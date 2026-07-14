import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFlightLegsStore } from './flightLegs'

describe('useFlightLegsStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('exposes legsByDate populated from mock-flight-legs.json', () => {
    const store = useFlightLegsStore()
    expect(Object.keys(store.legsByDate).length).toBeGreaterThan(0)
  })

  it('keys legsByDate by ISO yyyy-mm-dd with at least one leg each', () => {
    const store = useFlightLegsStore()
    for (const [date, legs] of Object.entries(store.legsByDate)) {
      expect(/^\d{4}-\d{2}-\d{2}$/.test(date)).toBe(true)
      expect(legs.length).toBeGreaterThan(0)
    }
  })

  it('returns the legs for a known duty date', () => {
    const store = useFlightLegsStore()
    const legs = store.legsByDate['2026-05-15']
    expect(legs).toBeDefined()
    expect(legs?.[0]?.flightNumber).toBe('SI 257')
  })
})
