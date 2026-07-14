/**
 * usePersistedState
 *
 * SSR-safe `ref` that hydrates from `localStorage` on the client and writes
 * back (deep) on every change. Keys are namespaced under `susi:` so demo
 * state never collides with other origins/storage users on the same host.
 *
 * SSR note: the plan called for `import.meta.client`, but that Nuxt/Vite
 * define is `undefined` under plain Vitest (which doesn't run the Nuxt Vite
 * plugin), so the persistence path would be unreachable from tests.
 * `typeof window !== 'undefined'` is true in both the browser and happy-dom
 * and false during SSR — same intent, testable.
 */
import { ref, watch, type Ref } from 'vue'

const KEY_PREFIX = 'susi:'

export function usePersistedState<T>(key: string, defaultValue: T): Ref<T> {
  const storageKey = `${KEY_PREFIX}${key}`
  const state = ref(defaultValue) as Ref<T>

  if (typeof window === 'undefined') return state

  const storedRaw = window.localStorage.getItem(storageKey)
  if (storedRaw !== null) {
    try {
      state.value = JSON.parse(storedRaw) as T
    } catch {
      // Corrupt / unparseable JSON — keep the default rather than throw.
    }
  }

  watch(
    state,
    (next) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        // Quota exceeded or disabled storage — silently drop the write so a
        // full disk never breaks the UI. State stays in-memory.
      }
    },
    { deep: true },
  )

  return state
}
