import { describe, it, expect } from 'vitest'
import { computeDutyDetail } from './useDutyDetail'
import type { FlightLeg, Schedule } from '~/types'

const LEG_A: FlightLeg = {
  flightNumber: 'SI 254',
  from: 'MKW',
  to: 'DJJ',
  std: '06:00',
  sta: '06:49',
  aircraft: 'PK-BVJ · C208B Grand Caravan',
  blockTime: '0:49',
}
const LEG_B: FlightLeg = { ...LEG_A, flightNumber: 'SI 255', from: 'DJJ', to: 'MKW' }
const LEG_C: FlightLeg = { ...LEG_A, flightNumber: 'SI 256', from: 'MKW', to: 'KEQ' }
const LEG_D: FlightLeg = { ...LEG_A, flightNumber: 'SI 257', from: 'KEQ', to: 'MKW' }

const FOUR_LEGS: Record<string, FlightLeg[]> = {
  '2026-04-01': [LEG_A, LEG_B, LEG_C, LEG_D],
}

function mk(partial: Partial<Schedule> = {}): Schedule {
  return {
    id: '97000',
    duty_date: '2026-04-01',
    status: 2,
    base_name: 'MKW',
    base_color: '#10B981',
    duty_type: 'DTY',
    count_schedules: 4,
    count_logbooks: 4,
    ...partial,
  }
}

describe('computeDutyDetail', () => {
  it('returns an empty detail when schedule is null', () => {
    const detail = computeDutyDetail(null, FOUR_LEGS)
    expect(detail.isDutyDay).toBe(false)
    expect(detail.legs).toEqual([])
    expect(detail.dutyDate).toBe('')
    expect(detail.dutyType).toBe('')
  })

  it('marks the first count_logbooks legs as logged', () => {
    const sched = mk({ count_logbooks: 3 })
    const detail = computeDutyDetail(sched, FOUR_LEGS)
    expect(detail.legs.map((l) => l.isLogged)).toEqual([true, true, true, false])
    expect(detail.loggedCount).toBe(3)
  })

  it('flags every leg logged when count_logbooks === legs length (tick day)', () => {
    const sched = mk({ count_logbooks: 4 })
    const detail = computeDutyDetail(sched, FOUR_LEGS)
    expect(detail.legs.every((l) => l.isLogged)).toBe(true)
    expect(detail.loggedCount).toBe(4)
    expect(detail.totalLegs).toBe(4)
  })

  it('isDutyDay is true when legs exist for the date', () => {
    const detail = computeDutyDetail(mk(), FOUR_LEGS)
    expect(detail.isDutyDay).toBe(true)
    expect(detail.totalLegs).toBe(4)
  })

  it('isDutyDay is false for a non-duty day with no legs (RLV/SCK/etc.)', () => {
    const leave = mk({ duty_type: 'RLV', duty_date: '2026-04-08', count_schedules: 1, count_logbooks: 1 })
    const detail = computeDutyDetail(leave, FOUR_LEGS)
    expect(detail.isDutyDay).toBe(false)
    expect(detail.legs).toEqual([])
    expect(detail.loggedCount).toBe(0)
    expect(detail.totalLegs).toBe(0)
    // dutyType still surfaces so the sheet can resolve the legend label.
    expect(detail.dutyType).toBe('RLV')
  })

  it('caps loggedCount at the available legs length', () => {
    // count_logbooks exceeds the actual legs present — never report more logged
    // than legs exist.
    const sched = mk({ count_logbooks: 99 })
    const detail = computeDutyDetail(sched, FOUR_LEGS)
    expect(detail.loggedCount).toBe(4)
    expect(detail.legs.every((l) => l.isLogged)).toBe(true)
  })

  it('preserves all FlightLeg fields on each duty leg', () => {
    const detail = computeDutyDetail(mk({ count_logbooks: 1 }), FOUR_LEGS)
    const first = detail.legs[0]
    expect(first?.flightNumber).toBe('SI 254')
    expect(first?.from).toBe('MKW')
    expect(first?.to).toBe('DJJ')
    expect(first?.std).toBe('06:00')
    expect(first?.sta).toBe('06:49')
    expect(first?.aircraft).toContain('PK-BVJ')
    expect(first?.blockTime).toBe('0:49')
  })

  it('exposes the schedule date + duty type for legend lookup', () => {
    const detail = computeDutyDetail(mk({ duty_date: '2026-04-10' }), {
      '2026-04-10': [LEG_A, LEG_B],
    })
    expect(detail.dutyDate).toBe('2026-04-10')
    expect(detail.dutyType).toBe('DTY')
  })
})
