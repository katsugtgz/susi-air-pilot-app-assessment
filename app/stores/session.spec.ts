import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionStore } from './session'

// Node 22 declares an experimental `localStorage` global that shadows
// happy-dom's window.localStorage and returns undefined unless
// --localstorage-file is passed. Install a Map-backed shim so the persisted
// session store has real storage under Vitest (mirrors usePersistedState.spec).
beforeAll(() => {
  if (typeof window === 'undefined' || window.localStorage) return
  const store = new Map<string, string>()
  const shim: Storage = {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key) {
      return store.has(key) ? (store.get(key) as string) : null
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key) {
      store.delete(key)
    },
    setItem(key, value) {
      store.set(key, String(value))
    },
  }
  Object.defineProperty(window, 'localStorage', { value: shim, configurable: true, writable: true })
})

describe('useSessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.localStorage.clear()
  })

  it('starts unauthenticated with no email', () => {
    const store = useSessionStore()
    expect(store.email).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('signIn stores the email and authenticates', () => {
    const store = useSessionStore()
    store.signIn('PSA-1042')
    expect(store.email).toBe('PSA-1042')
    expect(store.isAuthenticated).toBe(true)
  })

  it('signOut clears the email and de-authenticates', () => {
    const store = useSessionStore()
    store.signIn('PSA-1042')
    store.signOut()
    expect(store.email).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('persists the session across store re-creation (refresh)', async () => {
    const store = useSessionStore()
    store.signIn('PSA-1042')
    await nextTick()

    // A fresh Pinia + store instance hydrates from localStorage — mimics a
    // page refresh where the in-memory store is rebuilt.
    setActivePinia(createPinia())
    const recreated = useSessionStore()
    expect(recreated.email).toBe('PSA-1042')
    expect(recreated.isAuthenticated).toBe(true)
  })

  it('signs out across store re-creation (no phantom session)', async () => {
    const store = useSessionStore()
    store.signIn('PSA-1042')
    store.signOut()
    await nextTick()

    setActivePinia(createPinia())
    const recreated = useSessionStore()
    expect(recreated.email).toBeNull()
    expect(recreated.isAuthenticated).toBe(false)
  })

  it('persists the email under the namespaced susi: key', async () => {
    const store = useSessionStore()
    store.signIn('PSA-1042')
    await nextTick()
    expect(window.localStorage.getItem('susi:session:email')).toBe('"PSA-1042"')
  })
})
