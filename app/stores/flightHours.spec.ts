import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFlightHoursStore } from './flightHours'

describe('useFlightHoursStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('exposes flightHours, limits, chartBounds from JSON', () => {
    const store = useFlightHoursStore()
    expect(store.flightHours.length).toBeGreaterThan(0)
    expect(store.limits).toEqual({ daily: 8, weekly: 40, monthly: 100, annual: 1050 })
    expect(store.chartBounds['1w']).toEqual({ limit: 40, max: 45, windowDays: 7, displayRangeDays: 7 })
  })

  it('chartBounds has all 5 toggle keys with expected windowDays', () => {
    const store = useFlightHoursStore()
    expect(store.chartBounds['1w']?.windowDays).toBe(7)
    expect(store.chartBounds['1m']?.windowDays).toBe(30)
    expect(store.chartBounds['3m']?.windowDays).toBe(90)
    expect(store.chartBounds['6m']?.windowDays).toBe(180)
    expect(store.chartBounds['1y']?.windowDays).toBe(365)
  })

  it('rangeKeys is in the canonical order from the brief', () => {
    const store = useFlightHoursStore()
    expect(store.rangeKeys).toEqual(['1w', '1m', '3m', '6m', '1y'])
  })
})
