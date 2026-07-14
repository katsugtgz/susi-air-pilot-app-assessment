/**
 * useCopilotChat
 *
 * Client-side composable for the AI Copilot. Holds the message list + streaming
 * state, sends a POST to /api/chat, parses the SSE stream, and incrementally
 * appends streamed text deltas to the trailing assistant message.
 *
 * `parseSseFrames` is exported as a pure helper so the frame-parsing logic has
 * a direct unit test (no fetch mock required).
 */
import { ref, type Ref } from 'vue'

export interface CopilotMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export interface UseCopilotChat {
  messages: Ref<CopilotMessage[]>
  isStreaming: Ref<boolean>
  error: Ref<string | null>
  send: (text: string) => Promise<void>
  reset: () => void
}

const TEMPLATE_PROMPTS = [
  'When is my next flight?',
  'Which documents expire soon?',
  'How many hours left this month?',
  'Summarize the latest crew news',
] as const

let idCounter = 0
function nextId(): string {
  idCounter += 1
  return `m${Date.now().toString(36)}-${idCounter}`
}

/**
 * Parse a single SSE frame buffer (one or more `data: ...\n\n` blocks) into
 * the list of payloads. `[DONE]` is converted to `{ done: true }`; everything
 * else is JSON-parsed and pushed as `{ payload }`. Malformed payloads are
 * skipped so the stream keeps going.
 *
 * Pure + framework-agnostic — exported for direct unit testing.
 */
export function parseSseFrames(buffer: string): Array<{ payload?: unknown; done?: boolean }> {
  const out: Array<{ payload?: unknown; done?: boolean }> = []
  // SSE events are separated by a blank line. Within an event, lines starting
  // with `data: ` carry the payload.
  const events = buffer.split(/\r?\n\r?\n/)
  for (const evt of events) {
    if (!evt.trim()) continue
    const dataLines: string[] = []
    for (const line of evt.split(/\r?\n/)) {
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).replace(/^ /, ''))
      }
    }
    if (dataLines.length === 0) continue
    const payloadStr = dataLines.join('\n')
    if (payloadStr === '[DONE]') {
      out.push({ done: true })
      continue
    }
    try {
      out.push({ payload: JSON.parse(payloadStr) })
    } catch {
      // Skip non-JSON frames (e.g. comments / heartbeats).
    }
  }
  return out
}

export function useCopilotChat(): UseCopilotChat {
  const messages = ref<CopilotMessage[]>([])
  const isStreaming = ref(false)
  const error = ref<string | null>(null)

  function appendDelta(id: string, delta: string) {
    const list = messages.value
    const idx = list.findIndex((m) => m.id === id)
    if (idx === -1) return
    const next = list.slice()
    const target = next[idx]
    if (target) next[idx] = { ...target, text: target.text + delta }
    messages.value = next
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isStreaming.value) return

    error.value = null
    const userMsg: CopilotMessage = { id: nextId(), role: 'user', text: trimmed }
    const assistantMsg: CopilotMessage = { id: nextId(), role: 'assistant', text: '' }
    messages.value = [...messages.value, userMsg, assistantMsg]
    isStreaming.value = true

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.value]
            .filter((m) => m.id !== assistantMsg.id)
            .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', text: m.text })),
        }),
      })

      if (res.status === 503) {
        // Friendly "not configured" assistant message.
        appendDelta(
          assistantMsg.id,
          "The AI copilot isn't configured on this server. Set a Gemini API key to enable it.",
        )
        return
      }
      if (!res.ok || !res.body) {
        throw new Error(`Copilot request failed (${res.status})`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        // Process complete frames; keep any partial tail in the buffer.
        const lastBoundary = buffer.lastIndexOf('\n\n')
        if (lastBoundary !== -1) {
          const complete = buffer.slice(0, lastBoundary + 2)
          buffer = buffer.slice(lastBoundary + 2)
          for (const evt of parseSseFrames(complete)) {
            if (evt.done) {
              // Stream terminator — we'll exit on next reader.read().
              continue
            }
            const payload = evt.payload as { text?: string; error?: string } | undefined
            if (!payload) continue
            if (typeof payload.text === 'string') {
              appendDelta(assistantMsg.id, payload.text)
            }
            if (typeof payload.error === 'string') {
              error.value = payload.error
            }
          }
        }
      }
      // Flush any trailing buffered frame.
      if (buffer.trim()) {
        for (const evt of parseSseFrames(buffer)) {
          if (evt.done) continue
          const payload = evt.payload as { text?: string; error?: string } | undefined
          if (payload?.text) appendDelta(assistantMsg.id, payload.text)
          if (payload?.error) error.value = payload.error
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'copilot error'
      error.value = message
      if (messages.value.find((m) => m.id === assistantMsg.id)?.text === '') {
        appendDelta(assistantMsg.id, `Sorry — something went wrong (${message}).`)
      }
    } finally {
      isStreaming.value = false
    }
  }

  function reset() {
    messages.value = []
    error.value = null
    isStreaming.value = false
  }

  return { messages, isStreaming, error, send, reset }
}

export { TEMPLATE_PROMPTS }
