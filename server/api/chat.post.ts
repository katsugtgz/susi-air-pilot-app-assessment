/**
 * POST /api/chat — AI Copilot streaming chat endpoint.
 *
 * Body: { messages: [{ role: 'user' | 'model', text: string }] }
 *
 * Flow (per spec §3e):
 *   1. No keys configured → 503 'AI copilot is not configured'.
 *   2. Embed the LAST user message; retrieve top-5 corpus chunks. If the
 *      corpus has no embeddings (built offline without an API key), fall back
 *      to using every chunk text as context (corpus is ~50 chunks).
 *   3. First generateContent call advertises a `lookupFlightByDate` tool.
 *   4. If the model returns a function call, execute it (reads
 *      mock-schedules.json), append the model's function-call turn + the
 *      function-response turn to the conversation, and STREAM a second call.
 *      Otherwise emit the first response's text.
 *   5. SSE: frames `data: <json-encoded text delta>`, terminated by
 *      `data: [DONE]`.
 *
 * Every Gemini call goes through `withKeyRotation` for 429 round-robin.
 */
import { createError, defineEventHandler, readBody, createEventStream } from 'h3'
import schedulesMock from '../../app/assets/data/mock-schedules.json'
import corpus from '../data/embeddings.json'
import { parseKeys, withKeyRotation } from '../utils/gemini'
import { retrieve, l2Normalize, type Chunk } from '../utils/rag'

interface IncomingMessage {
  role: 'user' | 'model'
  text: string
}

interface IncomingBody {
  messages: IncomingMessage[]
}

const SYSTEM_INSTRUCTION = `You are an assistant for Susi Air pilots using the Susi Air Pilot Companion App.
Answer ONLY from the provided context or tool results. Reference dates: schedules today is 2026-05-15, documents today is 2026-05-31.
Be concise and friendly. If you do not know, say so plainly instead of guessing.`

const CHAT_MODEL_FALLBACK = 'gemini-3-flash-preview'
const EMBED_MODEL_FALLBACK = 'gemini-embedding-001'
const EMBED_DIM = 768
const TOP_K = 5

const lookupFlightByDateDeclaration = {
  name: 'lookupFlightByDate',
  description: 'Look up the duty schedule for a specific ISO date (yyyy-mm-dd).',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      date: { type: 'string', description: 'ISO date in yyyy-mm-dd format' },
    },
    required: ['date'],
  },
}

/**
 * Tool implementation — server-side read of mock-schedules.json. Returns the
 * entries matching the requested date (typically one, but the schema allows
 * multiples so we return an array).
 */
function lookupFlightByDate(date: unknown): unknown[] {
  if (typeof date !== 'string') return []
  // Single pass: match the date and shape the row in one iteration.
  return schedulesMock.schedules.reduce<unknown[]>((acc, s) => {
    if (s.duty_date === date) {
      acc.push({
        duty_date: s.duty_date,
        duty_type: s.duty_type,
        base_name: s.base_name,
        count_schedules: s.count_schedules,
        count_logbooks: s.count_logbooks,
        status: s.status === 2 ? 'verified' : 'pending',
      })
    }
    return acc
  }, [])
}

function toGeminiContents(messages: IncomingMessage[]) {
  return messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }))
}

function buildContextSnippet(relevant: Chunk[]): string {
  if (relevant.length === 0) return ''
  return (
    'Relevant context (pilot app data):\n' +
    relevant.map((c) => `- ${c.text}`).join('\n') +
    '\n\n'
  )
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const keys = parseKeys(config)
  if (keys.length === 0) {
    throw createError({
      statusCode: 503,
      statusMessage: 'AI copilot is not configured',
    })
  }

  const body = await readBody<IncomingBody>(event)
  const messages = body?.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'messages required' })
  }

  const contents = toGeminiContents(messages)
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const chatModel = (config.geminiChatModel as string) || CHAT_MODEL_FALLBACK
  const embedModel = (config.geminiEmbeddingModel as string) || EMBED_MODEL_FALLBACK

  // 2. Retrieve relevant context. Embed-then-retrieve when the corpus has
  //    vectors; otherwise use every chunk text (fallback path).
  const typedCorpus = corpus as Chunk[]
  const hasEmbeddings = typedCorpus.some((c) => Array.isArray(c.embedding))
  let relevant: Chunk[] = typedCorpus
  if (hasEmbeddings && lastUser) {
    try {
      const queryVec = await withKeyRotation(keys, (ai) =>
        ai.models
          .embedContent({
            model: embedModel,
            contents: lastUser.text,
            config: { taskType: 'RETRIEVAL_QUERY', outputDimensionality: EMBED_DIM },
          })
          .then((res) => l2Normalize(res.embeddings?.[0]?.values ?? [])),
      )
      relevant = retrieve(queryVec, typedCorpus, TOP_K)
    } catch {
      // Embedding failure → degrade to full-corpus fallback (already set above).
    }
  }

  const contextSnippet = buildContextSnippet(relevant)
  // Inject the context as a system-role prefix on the first user message so
  // it participates in the model's grounding without violating the SDK's
  // "function-call parts must come with full Content[]" rule.
  if (contents.length > 0 && contents[0]?.role === 'user') {
    const first = contents[0]
    if (first?.parts?.[0] && 'text' in first.parts[0]) {
      first.parts[0].text = contextSnippet + first.parts[0].text
    }
  }

  // 3. First call: advertise the lookup tool.
  const firstResponse = await withKeyRotation(keys, (ai) =>
    ai.models.generateContent({
      model: chatModel,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [lookupFlightByDateDeclaration] }],
      },
    }),
  )

  const functionCalls = firstResponse.functionCalls ?? []
  const sse = createEventStream(event)

  // Stream pipeline — fire-and-forget; we return sse.send() below.
  ;(async () => {
    try {
      if (functionCalls.length > 0) {
        const call = functionCalls[0]
        if (!call?.name) {
          await sse.push(JSON.stringify({ text: firstResponse.text ?? '' }))
          await sse.push('[DONE]')
          await sse.close()
          return
        }
        const toolResult = lookupFlightByDate(call.args?.date)

        // Append the model's functionCall turn + the functionResponse turn.
        // Use the model's returned content VERBATIM (not a reconstruction):
        // Gemini 3 requires the thoughtSignature carried in the functionCall
        // part, and rebuilding the part drops it (400 INVALID_ARGUMENT).
        const modelTurn = firstResponse.candidates?.[0]?.content
        const functionResponseTurn = [
          ...(modelTurn ? [modelTurn] : []),
          {
            role: 'user',
            parts: [
              {
                functionResponse: {
                  id: call.id,
                  name: call.name,
                  response: { output: toolResult },
                },
              },
            ],
          },
        ]
        const stream = await withKeyRotation(keys, (ai) =>
          ai.models.generateContentStream({
            model: chatModel,
            contents: [...contents, ...functionResponseTurn],
            config: { systemInstruction: SYSTEM_INSTRUCTION },
          }),
        )
        for await (const chunk of stream) {
          const text = chunk.text ?? ''
          if (text) await sse.push(JSON.stringify({ text }))
        }
      } else {
        const text = firstResponse.text ?? ''
        if (text) await sse.push(JSON.stringify({ text }))
      }
      await sse.push('[DONE]')
      await sse.close()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'copilot error'
      await sse.push(JSON.stringify({ error: message }))
      await sse.push('[DONE]')
      await sse.close()
    }
  })()

  return sse.send()
})
