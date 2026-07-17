import { describe, expect, it } from 'vitest'
import { computeUpcomingDutyPreview, useUpcomingDutyPreview } from './useUpcomingDutyPreview'
import type { FlightLeg, Schedule } from '~/types'

const FIRST_LEG: FlightLeg = {
  flightNumber: 'SI 257',
  from: 'MKW',
  to: 'INX',
  std: '06:45',
  sta: '07:42',
  aircraft: 'PK-BVS · C208B Grand Caravan',
  blockTime: '0:57',
}

const SECOND_LEG: FlightLeg = {
  flightNumber: 'SI 258',
  from: 'INX',
  to: 'MKW',
  std: '08:13',
  sta: '08:50',
  aircraft: 'PK-BVS · C208B Grand Caravan',
  blockTime: '0:37',
}

function schedule(partial: Partial<Schedule>): Schedule {
  return {
    id: '97027',
    duty_date: '2026-05-15',
    status: 1,
    base_name: 'MKW',
    base_color: '#10B981',
    duty_type: 'DTY',
    count_schedules: 6,
    count_logbooks: 0,
    ...partial,
  }
}

describe('computeUpcomingDutyPreview', () => {
  it('derives the first upcoming duty from existing flight legs', () => {
    // Given: the brief schedule date has a pending duty with real legs.
    const schedules = [schedule({ count_logbooks: 6 })]
    const legsByDate = { '2026-05-15': [FIRST_LEG, SECOND_LEG] }

    // When: the upcoming preview is derived from schedule + legs.
    const result = computeUpcomingDutyPreview({ schedules, legsByDate, today: '2026-05-15' })

    // Then: first leg fields come from legsByDate, with leg count from available legs.
    expect(result).toEqual({
      kind: 'ready',
      dutyDate: '2026-05-15',
      baseName: 'MKW',
      dutyType: 'DTY',
      departureCode: 'MKW',
      arrivalCode: 'INX',
      route: 'MKW → INX',
      std: '06:45',
      sta: '07:42',
      flightNumber: 'SI 257',
      aircraft: 'PK-BVS · C208B Grand Caravan',
      legCount: 2,
    })
  })

  it('skips pending schedule rows that have no flight legs', () => {
    // Given: a non-leg duty appears before the next leg-backed duty.
    const schedules = [
      schedule({ id: '97029', duty_date: '2026-05-20', duty_type: 'MED', count_schedules: 1 }),
      schedule({ id: '97030', duty_date: '2026-05-21', base_name: 'CJN' }),
    ]
    const legsByDate = { '2026-05-21': [FIRST_LEG] }

    // When: the preview is selected.
    const result = computeUpcomingDutyPreview({ schedules, legsByDate, today: '2026-05-15' })

    // Then: the first leg-backed duty wins.
    expect(result.kind).toBe('ready')
    if (result.kind === 'ready') expect(result.dutyDate).toBe('2026-05-21')
  })

  it('returns empty when no upcoming leg-backed duty exists', () => {
    // Given: only completed or legless schedules are available.
    const schedules = [schedule({ status: 2 }), schedule({ duty_date: '2026-05-20', duty_type: 'MED' })]

    // When: the preview is derived.
    const result = computeUpcomingDutyPreview({ schedules, legsByDate: {}, today: '2026-05-15' })

    // Then: callers receive an explicit empty state.
    expect(result).toEqual({ kind: 'empty' })
  })

  it('returns a reactive wrapper with the pure result', () => {
    // Given: plain values accepted by the wrapper.
    const input = {
      schedules: [schedule({ count_logbooks: 6 })],
      legsByDate: { '2026-05-15': [FIRST_LEG] },
      today: '2026-05-15',
    }

    // When: the wrapper computes the preview.
    const result = useUpcomingDutyPreview(input)

    // Then: the same first-leg preview is exposed through ComputedRef.
    expect(result.value.kind).toBe('ready')
    if (result.value.kind === 'ready') expect(result.value.flightNumber).toBe('SI 257')
  })
})
