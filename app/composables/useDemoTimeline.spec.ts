import { describe, expect, it } from 'vitest'
import { computeDemoTimeline, useDemoTimeline } from './useDemoTimeline'

describe('computeDemoTimeline', () => {
  it('keeps schedule freshness separate from documents and hours freshness', () => {
    // Given: the brief-locked source dates differ by data domain.
    const input = {
      scheduleToday: '2026-05-15',
      documentsToday: '2026-05-31',
      flightHoursToday: '2026-05-31',
    }

    // When: the demo timeline is derived.
    const result = computeDemoTimeline(input)

    // Then: no source is overwritten by a single fake current date.
    expect(result.sources.map((source) => [source.id, source.asOfDate])).toEqual([
      ['schedule', '2026-05-15'],
      ['documents', '2026-05-31'],
      ['flight-hours', '2026-05-31'],
    ])
  })

  it('uses neutral status wording for demo data freshness', () => {
    // Given: all demo sources have explicit as-of dates.
    const input = {
      scheduleToday: '2026-05-15',
      documentsToday: '2026-05-31',
      flightHoursToday: '2026-05-31',
    }

    // When: source status copy is derived.
    const result = computeDemoTimeline(input)

    // Then: status copy is app-safe and not operational clearance language.
    expect(result.statusText).toBe('Demo data is current through 2026-05-31')
    expect(result.statusText).not.toMatch(/safe|cleared|legal/i)
  })

  it('returns a reactive wrapper with the pure result', () => {
    // Given: plain values accepted by the wrapper.
    const input = {
      scheduleToday: '2026-05-15',
      documentsToday: '2026-05-31',
      flightHoursToday: '2026-05-31',
    }

    // When: the wrapper computes the timeline.
    const result = useDemoTimeline(input)

    // Then: latest data date reflects the freshest source, not wall-clock time.
    expect(result.value.latestDataDate).toBe('2026-05-31')
  })
})
