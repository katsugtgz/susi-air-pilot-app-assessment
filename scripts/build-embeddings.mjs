/**
 * scripts/build-embeddings.mjs
 *
 * Precompute the corpus for the AI Copilot RAG pipeline.
 *
 * Reads the 4 mock JSONs from app/assets/data/, builds chunks per the spec,
 * optionally embeds them with the Gemini embedding API (gemini-embedding-001,
 * RETRIEVAL_DOCUMENT taskType, 768-dim, L2-normalized), and writes
 * server/data/embeddings.json.
 *
 * If NO GEMINI_API_KEY / NUXT_GEMINI_API_KEY(S) env var is set, the script
 * still writes the file with `embedding: null` for every chunk — the chat
 * endpoint then falls back to using every chunk text as context (the corpus
 * is tiny, ~30-40 chunks).
 *
 * Run via:  npm run build-embeddings
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import documents from '../app/assets/data/mock-documents.json' with { type: 'json' }
import flightHours from '../app/assets/data/mock-flight-hours.json' with { type: 'json' }
import schedules from '../app/assets/data/mock-schedules.json' with { type: 'json' }
import news from '../app/assets/data/mock-news.json' with { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT = resolve(ROOT, 'server/data/embeddings.json')

const SCHEDULES_TODAY = schedules.today // '2026-05-15'
const DOCUMENTS_TODAY = documents.today // '2026-05-31'
const EMBED_MODEL = 'gemini-embedding-001'
const DIM = 768

function statusWord(status) {
  return status === 2 ? 'verified' : 'pending'
}

function buildChunks() {
  const chunks = []

  for (const doc of documents.documents) {
    chunks.push({
      id: `doc:${doc.id}`,
      source: 'documents',
      text: `${doc.label} expires on ${doc.expiryDate}. Reference today for documents: ${DOCUMENTS_TODAY}.`,
    })
  }

  for (const item of news.items) {
    const parts = [
      item.category ? `[${item.category}]` : null,
      item.title,
      item.excerpt,
      item.date ? `Published ${item.date}.` : null,
      item.readTime ? `Read time ${item.readTime}.` : null,
    ].filter(Boolean)
    chunks.push({
      id: `news:${item.id}`,
      source: 'news',
      text: parts.join(' '),
    })
  }

  chunks.push({
    id: 'flight-hours:pilot',
    source: 'flight-hours',
    text: `Pilot ${flightHours.pilot.name} (ID ${flightHours.pilot.pilotId}) has logged ${flightHours.pilot.totalFlightHours} total flight hours.`,
  })
  chunks.push({
    id: 'flight-hours:limits',
    source: 'flight-hours',
    text: `Regulatory flight-hour limits — daily ${flightHours.limits.daily}, weekly ${flightHours.limits.weekly}, monthly ${flightHours.limits.monthly}, annual ${flightHours.limits.annual}.`,
  })
  const chartBoundsSummary = Object.entries(flightHours.chartBounds)
    .map(
      ([key, b]) =>
        `${key}: limit ${b.limit}, max ${b.max}, windowDays ${b.windowDays}, displayRangeDays ${b.displayRangeDays}`,
    )
    .join('; ')
  chunks.push({
    id: 'flight-hours:chart-bounds',
    source: 'flight-hours',
    text: `Chart bounds per range toggle — ${chartBoundsSummary}.`,
  })

  chunks.push({
    id: 'schedules:field-guide',
    source: 'schedules',
    text: Object.entries(schedules.fieldGuide)
      .map(([field, desc]) => `${field}: ${desc}`)
      .join(' '),
  })

  for (const entry of schedules.legend) {
    chunks.push({
      id: `schedules:legend:${entry.code}`,
      source: 'schedules',
      text: `Duty legend code ${entry.code} means ${entry.label} (color ${entry.color}).`,
    })
  }

  for (const s of schedules.schedules) {
    if (s.duty_date < SCHEDULES_TODAY) continue
    chunks.push({
      id: `schedules:entry:${s.id}`,
      source: 'schedules',
      text: `On ${s.duty_date} duty ${s.duty_type} at base ${s.base_name}, ${s.count_schedules} flights planned, status ${statusWord(s.status)}. Reference today for schedules: ${SCHEDULES_TODAY}.`,
    })
  }

  return chunks
}

function l2Normalize(vec) {
  let sumSq = 0
  for (const v of vec) sumSq += v * v
  const norm = Math.sqrt(sumSq)
  if (norm === 0) return vec.slice()
  return vec.map((v) => v / norm)
}

function pickKey() {
  const list = (process.env.NUXT_GEMINI_API_KEYS ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0)
  if (list.length > 0) return list[0]
  const single = (process.env.NUXT_GEMINI_API_KEY ?? '').trim()
  if (single.length > 0) return single
  return (process.env.GEMINI_API_KEY ?? '').trim() || null
}

async function embedAll(chunks) {
  const { GoogleGenAI } = await import('@google/genai')
  const apiKey = pickKey()
  if (!apiKey) return null

  const ai = new GoogleGenAI({ apiKey })
  const out = []
  for (const chunk of chunks) {
    const res = await ai.models.embedContent({
      model: EMBED_MODEL,
      contents: chunk.text,
      config: { taskType: 'RETRIEVAL_DOCUMENT', outputDimensionality: DIM },
    })
    const vec = res.embeddings?.[0]?.values ?? []
    out.push({ ...chunk, embedding: l2Normalize(vec) })
  }
  return out
}

async function main() {
  const chunks = buildChunks()
  console.log(`Built ${chunks.length} chunks from 4 mock JSONs`)

  let result = null
  try {
    result = await embedAll(chunks)
  } catch (err) {
    console.warn('Embedding call failed; falling back to null embeddings.', err?.message ?? err)
  }

  let corpus
  if (result) {
    corpus = result
    console.log(`Embedded ${corpus.length} chunks via ${EMBED_MODEL} (${DIM}-dim, L2-normalized)`)
  } else {
    corpus = chunks.map((c) => ({ ...c, embedding: null }))
    console.log(
      'No GEMINI_API_KEY / NUXT_GEMINI_API_KEY(S) env var (or embedding call failed). ' +
        `Wrote ${corpus.length} chunks with embedding: null — chat endpoint will use the full-corpus fallback.`,
    )
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(corpus, null, 2), 'utf8')
  console.log(`Wrote ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
