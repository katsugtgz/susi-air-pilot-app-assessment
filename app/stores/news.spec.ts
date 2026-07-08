import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNewsStore } from './news'

describe('useNewsStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('exposes items from JSON', () => {
    const store = useNewsStore()
    expect(store.items.length).toBeGreaterThan(0)
  })

  it('each item has id + title', () => {
    const store = useNewsStore()
    for (const item of store.items) {
      expect(typeof item.id).toBe('string')
      expect(typeof item.title).toBe('string')
      expect(item.title.length).toBeGreaterThan(0)
    }
  })
})
