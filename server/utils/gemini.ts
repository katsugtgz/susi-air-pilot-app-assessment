/**
 * Gemini API key rotation.
 *
 * Round-robins a module-level index across the configured keys so each request
 * uses a different key, and on HTTP 429 (rate limit) the next call retries
 * with the next key in the list. All other errors propagate immediately.
 *
 * The keys come from `runtimeConfig.geminiApiKeys` (comma-separated) with a
 * fallback to `runtimeConfig.geminiApiKey` (single). The chat endpoint calls
 * `withKeyRotation` to wrap every `@google/genai` invocation so the rotation
 * logic stays in one place.
 */
import { GoogleGenAI, type ApiError } from '@google/genai'

export interface GeminiRuntimeConfig {
  geminiApiKeys?: string
  geminiApiKey?: string
  geminiChatModel?: string
  geminiEmbeddingModel?: string
}

/** Module-level round-robin cursor; bumped on every key use. */
let rotationIndex = 0

/**
 * Resolve the configured keys into an ordered array, trimming whitespace and
 * dropping empties. Returns [] when nothing is configured.
 */
export function parseKeys(config: GeminiRuntimeConfig): string[] {
  const list = (config.geminiApiKeys ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0)
  if (list.length > 0) return list
  const single = (config.geminiApiKey ?? '').trim()
  return single.length > 0 ? [single] : []
}

/**
 * True when an `ApiError`-shaped object reports a 429 status. The `@google/genai`
 * SDK surfaces rate limits as `error.status === 429`. We check defensively for
 * both number and string forms because the SDK's `ApiError.status` typing is
 * loose and runtime values have been observed as both.
 */
function isRateLimit(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const raw = (error as ApiError).status as unknown
  return raw === 429 || raw === '429'
}

/**
 * Wrap a per-key operation in round-robin + retry-on-429 semantics.
 *
 * - No keys configured: throws a friendly `Error('AI copilot is not configured')`.
 * - 429 on the current key: advance to the next, retry. If every key has 429'd
 *   in this call, the last error propagates.
 * - Any other error type: propagates immediately (caller surfaces it via h3).
 */
export async function withKeyRotation<T>(
  keys: string[],
  fn: (client: GoogleGenAI) => Promise<T>,
): Promise<T> {
  if (keys.length === 0) {
    throw new Error('AI copilot is not configured')
  }

  let lastError: unknown
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[rotationIndex % keys.length] ?? ''
    rotationIndex++
    const client = new GoogleGenAI({ apiKey: key })
    try {
      return await fn(client)
    } catch (error) {
      lastError = error
      if (!isRateLimit(error)) throw error
      // 429 → try the next key
    }
  }
  throw lastError
}

/** Test-only helper — resets the module-level cursor. */
export function __resetRotationIndexForTests(): void {
  rotationIndex = 0
}
