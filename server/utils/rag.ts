/**
 * Retrieval-Augmented Generation helpers for the AI Copilot.
 *
 * Pure functions — no Vue, no Nuxt, no network. Unit-tested in `rag.spec.ts`.
 * Consumed by `server/api/chat.post.ts` to embed the user's last message and
 * retrieve the most relevant chunks from `server/data/embeddings.json`.
 */

export interface Chunk {
  id: string
  source: string
  text: string
  /** 768-dim L2-normalized vector, or null when no API key was available at
   *  precompute time (the chat endpoint then falls back to using every chunk
   *  as context). */
  embedding: number[] | null
}

/**
 * L2-normalize a vector. Returns the zero vector when the input norm is 0
 * (e.g. an all-zero embedding from a degenerate API response) so downstream
 * cosine similarity returns 0 rather than NaN.
 */
export function l2Normalize(vec: number[]): number[] {
  let sumSq = 0
  for (const v of vec) sumSq += v * v
  const norm = Math.sqrt(sumSq)
  if (norm === 0) return vec.slice()
  return vec.map((v) => v / norm)
}

/**
 * Cosine similarity of two L2-normalized vectors (= their dot product).
 * Returns 0 when dimensions don't match or either vector is zero-length —
 * a guard against NaN propagation in the retrieve ranking.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += (a[i] ?? 0) * (b[i] ?? 0)
  return dot
}

/**
 * Return the top-k corpus chunks most similar to `queryVec`, in descending
 * similarity order. Skips corpus entries whose `embedding` is null (the
 * "no API key at precompute" case — those chunks are still usable as context
 * via the fallback path, just not via vector retrieval).
 */
export function retrieve(queryVec: number[], corpus: Chunk[], k: number): Chunk[] {
  if (k <= 0) return []
  const scored = corpus
    .filter((c) => c.embedding !== null && c.embedding.length === queryVec.length)
    .map((c) => ({ chunk: c, score: cosineSimilarity(queryVec, c.embedding as number[]) }))
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, k).map((s) => s.chunk)
}
