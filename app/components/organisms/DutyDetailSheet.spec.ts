import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import DutyDetailSheet from './DutyDetailSheet.vue'
import type { FlightLeg, Legend, Schedule } from '~/types'

const LEGEND: Legend[] = [
  { code: 'DTY', label: 'On Duty', color: '#10B981' },
  { code: 'RLV', label: 'Requested Leave', color: '#475569' },
]

function leg(partial: Partial<FlightLeg> = {}): FlightLeg {
  return {
    flightNumber: 'SI 254',
    from: 'MKW',
    to: 'DJJ',
    std: '06:00',
    sta: '06:49',
    aircraft: 'PK-BVJ · C208B Grand Caravan',
    blockTime: '0:49',
    ...partial,
  }
}

function duty(partial: Partial<Schedule> = {}): Schedule {
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

const FOUR_LEGS: Record<string, FlightLeg[]> = {
  '2026-04-01': [
    leg(),
    leg({ flightNumber: 'SI 255', from: 'DJJ', to: 'MKW' }),
    leg({ flightNumber: 'SI 256', from: 'MKW', to: 'KEQ' }),
    leg({ flightNumber: 'SI 257', from: 'KEQ', to: 'MKW' }),
  ],
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('DutyDetailSheet', () => {
  it('renders nothing when closed', () => {
    mount(DutyDetailSheet, {
      props: { open: false, schedule: duty(), legend: LEGEND, legsByDate: FOUR_LEGS },
    })
    expect(document.querySelector('.duty-detail')).toBeNull()
  })

  it('renders a duty chip with the legend label for the schedule type', () => {
    mount(DutyDetailSheet, {
      props: { open: true, schedule: duty(), legend: LEGEND, legsByDate: FOUR_LEGS },
    })
    const chip = document.querySelector('.duty-detail__chip')
    expect(chip?.textContent?.trim()).toBe('On Duty')
  })

  it('shows the formatted date as the sheet title', () => {
    mount(DutyDetailSheet, {
      props: { open: true, schedule: duty({ duty_date: '2026-04-01' }), legend: LEGEND, legsByDate: FOUR_LEGS },
    })
    expect(document.querySelector('.bottom-sheet__title')?.textContent?.trim()).toBe('1 Apr 2026')
  })

  it('lists every leg for the duty day', () => {
    mount(DutyDetailSheet, {
      props: { open: true, schedule: duty(), legend: LEGEND, legsByDate: FOUR_LEGS },
    })
    const rows = document.querySelectorAll('.duty-detail__leg')
    expect(rows.length).toBe(4)
    const routes = Array.from(rows).map((r) => r.querySelector('.duty-detail__route')?.textContent?.trim())
    expect(routes).toEqual(['MKW → DJJ', 'DJJ → MKW', 'MKW → KEQ', 'KEQ → MKW'])
  })

  it('marks the first count_logbooks legs as logged and the rest not logged', () => {
    mount(DutyDetailSheet, {
      props: {
        open: true,
        schedule: duty({ count_logbooks: 3 }),
        legend: LEGEND,
        legsByDate: FOUR_LEGS,
      },
    })
    const rows = document.querySelectorAll('.duty-detail__leg')
    expect(rows[0]?.classList.contains('duty-detail__leg--logged')).toBe(true)
    expect(rows[1]?.classList.contains('duty-detail__leg--logged')).toBe(true)
    expect(rows[2]?.classList.contains('duty-detail__leg--logged')).toBe(true)
    expect(rows[3]?.classList.contains('duty-detail__leg--logged')).toBe(false)
    expect(rows[3]?.querySelector('.duty-detail__not-logged')?.textContent).toContain('Not logged')
    expect(rows[0]?.querySelector('.duty-detail__not-logged')).toBeNull()
  })

  it('renders the "X of Y flights logged" footer for duty days', () => {
    mount(DutyDetailSheet, {
      props: {
        open: true,
        schedule: duty({ count_logbooks: 3 }),
        legend: LEGEND,
        legsByDate: FOUR_LEGS,
      },
    })
    const footer = document.querySelector('.duty-detail__footer')
    expect(footer?.textContent?.trim()).toBe('3 of 4 flights logged')
  })

  it('uses singular "flight" in the footer for a single-leg day', () => {
    mount(DutyDetailSheet, {
      props: {
        open: true,
        schedule: duty({ count_schedules: 1, count_logbooks: 0 }),
        legend: LEGEND,
        legsByDate: { '2026-04-01': [leg()] },
      },
    })
    expect(document.querySelector('.duty-detail__footer')?.textContent?.trim()).toBe('0 of 1 flight logged')
  })

  it('shows the legend-labelled empty state for a non-duty day (RLV)', () => {
    const leave = duty({
      duty_type: 'RLV',
      duty_date: '2026-04-08',
      base_name: 'HLP',
      base_color: '#475569',
      count_schedules: 1,
      count_logbooks: 1,
    })
    mount(DutyDetailSheet, {
      props: { open: true, schedule: leave, legend: LEGEND, legsByDate: FOUR_LEGS },
    })
    expect(document.querySelector('.duty-detail__legs')).toBeNull()
    const chip = document.querySelector('.duty-detail__chip')
    expect(chip?.textContent?.trim()).toBe('Requested Leave')
    const empty = document.querySelector('.duty-detail__empty-text')
    expect(empty?.textContent?.trim()).toBe('Requested Leave — no flights this day.')
  })

  it('shows a generic empty state when no schedule is selected', () => {
    mount(DutyDetailSheet, {
      props: { open: true, schedule: null, legend: LEGEND, legsByDate: FOUR_LEGS },
    })
    const empty = document.querySelector('.duty-detail__empty-text')
    expect(empty?.textContent?.trim()).toBe('No duty scheduled.')
    expect(document.querySelector('.duty-detail__chip')).toBeNull()
  })

  it('emits close on backdrop click', async () => {
    const wrapper = mount(DutyDetailSheet, {
      props: { open: true, schedule: duty(), legend: LEGEND, legsByDate: FOUR_LEGS },
    })
    const backdrop = document.querySelector('.bottom-sheet__backdrop') as HTMLElement
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('close')).toBeDefined()
  })

  it('never hardcodes duty codes — label resolves purely from legend', () => {
    // If the legend omits the code, the chip falls back to the raw code.
    const training = duty({ duty_type: 'XYZ', duty_date: '2026-04-09' })
    mount(DutyDetailSheet, {
      props: { open: true, schedule: training, legend: LEGEND, legsByDate: {} },
    })
    const chip = document.querySelector('.duty-detail__chip')
    expect(chip?.textContent?.trim()).toBe('XYZ')
  })
})
