/**
 * Global test setup: install a Map-backed localStorage shim.
 *
 * happy-dom under Node 22 does not provide window.localStorage (it wants
 * --localstorage-file). Specs previously each carried a private copy of this
 * shim; the shared version runs before every suite so `window.localStorage`
 * always exists. Callers that need a clean slate use
 * `window.localStorage.clear()` in beforeEach.
 */
import type { Storage } from 'happy-dom'

if (typeof window !== 'undefined' && !window.localStorage) {
  const store = new Map<string, string>()
  const shim: Storage = {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? (store.get(key) as string) : null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
  }
  Object.defineProperty(window, 'localStorage', { value: shim, configurable: true })
}
