import { describe, it, expect, beforeEach } from 'vitest'
import { usePersistedState } from './usePersistedState'

// localStorage shim comes from tests/setup-local-storage.ts.

beforeEach(() => {
  window.localStorage.clear()
})

describe('usePersistedState', () => {
  it('returns the default value when nothing is stored', () => {
    const state = usePersistedState('theme', 'light')
    expect(state.value).toBe('light')
  })

  it('persists primitive changes round-trip', async () => {
    const state = usePersistedState('count', 0)
    state.value = 7
    await nextTick()
    expect(window.localStorage.getItem('susi:count')).toBe('7')

    // A new instance with the same key hydrates from storage.
    const rehydrated = usePersistedState('count', 0)
    expect(rehydrated.value).toBe(7)
  })

  it('persists objects deeply', async () => {
    interface Profile {
      name: string
      prefs: { theme: string }
    }
    const state = usePersistedState<Profile>('profile', {
      name: '',
      prefs: { theme: 'light' },
    })
    state.value.prefs.theme = 'dark'
    await nextTick()

    const rehydrated = usePersistedState<Profile>('profile', {
      name: '',
      prefs: { theme: 'light' },
    })
    expect(rehydrated.value.prefs.theme).toBe('dark')
  })

  it('falls back to default on corrupt stored JSON', () => {
    window.localStorage.setItem('susi:broken', '{not valid json')
    const state = usePersistedState('broken', { ok: true })
    expect(state.value).toEqual({ ok: true })
  })

  it('namespaces keys under "susi:"', async () => {
    const state = usePersistedState('token', 'abc')
    state.value = 'def'
    await nextTick()

    expect(window.localStorage.getItem('susi:token')).toBe('"def"')
    expect(window.localStorage.getItem('token')).toBeNull()
  })

  it('keeps separate keys independent', async () => {
    const a = usePersistedState('a', 1)
    const b = usePersistedState('b', 2)
    a.value = 10
    b.value = 20
    await nextTick()

    expect(window.localStorage.getItem('susi:a')).toBe('10')
    expect(window.localStorage.getItem('susi:b')).toBe('20')
  })

  it('hydrates null/boolean/array values stored as JSON', async () => {
    window.localStorage.setItem('susi:flag', 'false')
    window.localStorage.setItem('susi:list', '[1,2,3]')
    window.localStorage.setItem('susi:maybe', 'null')

    expect(usePersistedState('flag', true).value).toBe(false)
    expect(usePersistedState('list', [] as number[]).value).toEqual([1, 2, 3])
    expect(usePersistedState('maybe', 'default').value).toBeNull()
  })
})
