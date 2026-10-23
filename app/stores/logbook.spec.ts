import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useLogbookStore } from './logbook'

const STORAGE_KEY = 'susi:logbook-entries'

// localStorage shim comes from tests/setup-local-storage.ts.

describe('useLogbookStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('starts with no entries', () => {
    const store = useLogbookStore()
    expect(store.entries).toEqual([])
    expect(store.count).toBe(0)
  })

  it('addEntry appends a generated-id entry and returns it', () => {
    const store = useLogbookStore()
    const entry = store.addEntry({
      date: '2026-05-15',
      from: 'PDG',
      to: 'RSK',
      aircraft: 'PK-BVM · C208B Grand Caravan',
      blockTime: '1:21',
      remarks: 'Smooth sector',
    })
    expect(entry.id).toBeTruthy()
    expect(entry.from).toBe('PDG')
    expect(store.count).toBe(1)
    expect(store.entries[0]?.id).toBe(entry.id)
  })

  it('persists entries to localStorage under the susi: namespace', async () => {
    const store = useLogbookStore()
    store.addEntry({
      date: '2026-05-15',
      from: 'PDG',
      to: 'RSK',
      aircraft: 'PK-BVM · C208B Grand Caravan',
      blockTime: '1:21',
    })
    await nextTick()
    const raw = window.localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw ?? '[]') as unknown[]
    expect(parsed).toHaveLength(1)
  })

  it('clear() empties entries and storage', async () => {
    const store = useLogbookStore()
    store.addEntry({
      date: '2026-05-15',
      from: 'PDG',
      to: 'RSK',
      aircraft: 'PK-BVM · C208B Grand Caravan',
      blockTime: '1:21',
    })
    await nextTick()
    store.clear()
    await nextTick()
    expect(store.count).toBe(0)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('[]')
  })

  it('generates unique ids across calls', () => {
    const store = useLogbookStore()
    const a = store.addEntry({
      date: '2026-05-15',
      from: 'PDG',
      to: 'RSK',
      aircraft: 'PK-BVM · C208B Grand Caravan',
      blockTime: '1:21',
    })
    const b = store.addEntry({
      date: '2026-05-16',
      from: 'RSK',
      to: 'PDG',
      aircraft: 'PK-BVM · C208B Grand Caravan',
      blockTime: '0:59',
    })
    expect(a.id).not.toBe(b.id)
    expect(store.count).toBe(2)
  })
})
