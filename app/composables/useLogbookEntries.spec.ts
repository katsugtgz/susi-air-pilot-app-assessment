import { describe, it, expect } from 'vitest'
import { computeLogbookEntries } from './useLogbookEntries'
import mockSchedules from '~/assets/data/mock-schedules.json'
import type { Legend, Schedule } from '~/types'

const LEGEND: Legend[] = [
  { code: 'DTY', label: 'On Duty', color: '#10B981' },
  { code: 'TRX', label: 'Training', color: '#F59E0B' },
  { code: 'RLV', label: 'Requested Leave', color: '#475569' },
]

function mk(partial: Partial<Schedule>): Schedule {
  return {
    id: '0',
    duty_date: '2026-05-01',
    status: 2,
    base_name: 'MKW',
    base_color: '#10B981',
    duty_type: 'DTY',
    count_schedules: 4,
    count_logbooks: 4,
    ...partial,
  }
}

describe('computeLogbookEntries', () => {
  it('filters out entries with count_logbooks === 0', () => {
    const schedules = [
      mk({ id: '1', duty_date: '2026-05-14', count_logbooks: 4 }),
      mk({ id: '2', duty_date: '2026-05-21', count_logbooks: 0 }),
    ]
    const result = computeLogbookEntries(schedules, LEGEND)
    expect(result.totals.entries).toBe(1)
    expect(result.groups[0]?.rows).toHaveLength(1)
  })

  it('sorts rows by duty_date descending within a month', () => {
    const schedules = [
      mk({ id: '1', duty_date: '2026-05-01' }),
      mk({ id: '2', duty_date: '2026-05-15' }),
      mk({ id: '3', duty_date: '2026-05-07' }),
    ]
    const result = computeLogbookEntries(schedules, LEGEND)
    const dates = result.groups[0]?.rows.map((r) => r.dutyDate) ?? []
    expect(dates).toEqual(['2026-05-15', '2026-05-07', '2026-05-01'])
  })

  it('groups by month with desc order at the group level', () => {
    const schedules = [
      mk({ id: '1', duty_date: '2026-04-10' }),
      mk({ id: '2', duty_date: '2026-05-01' }),
      mk({ id: '3', duty_date: '2026-05-15' }),
      mk({ id: '4', duty_date: '2026-03-20' }),
    ]
    const result = computeLogbookEntries(schedules, LEGEND)
    expect(result.groups.map((g) => g.key)).toEqual(['2026-05', '2026-04', '2026-03'])
  })

  it('formats month label as "Month yyyy"', () => {
    const schedules = [mk({ duty_date: '2026-05-15' })]
    const result = computeLogbookEntries(schedules, LEGEND)
    expect(result.groups[0]?.label).toBe('May 2026')
  })

  it('maps legend label + color from duty_type', () => {
    const schedules = [
      mk({ duty_type: 'DTY' }), // 2026-05-01
      mk({ duty_date: '2026-05-02', duty_type: 'TRX' }),
      mk({ duty_date: '2026-05-03', duty_type: 'RLV' }),
    ]
    const result = computeLogbookEntries(schedules, LEGEND)
    const rows = result.groups[0]?.rows ?? []
    // Sort is duty_date desc → 03 RLV, 02 TRX, 01 DTY.
    expect(rows[0]?.dutyLabel).toBe('Requested Leave')
    expect(rows[0]?.dutyColor).toBe('#475569')
    expect(rows[1]?.dutyLabel).toBe('Training')
    expect(rows[1]?.dutyColor).toBe('#F59E0B')
    expect(rows[2]?.dutyLabel).toBe('On Duty')
    expect(rows[2]?.dutyColor).toBe('#10B981')
  })

  it('falls back to duty_type code when legend missing', () => {
    const schedules = [mk({ duty_type: 'UNK' })]
    const result = computeLogbookEntries(schedules, LEGEND)
    const row = result.groups[0]?.rows[0]
    expect(row?.dutyLabel).toBe('UNK')
    expect(row?.dutyColor).toBe('#10B981') // schedule.base_color fallback
  })

  it('verified flag is true only when status === 2', () => {
    const schedules = [
      mk({ id: '1', duty_date: '2026-05-15', status: 2 }),
      mk({ id: '2', duty_date: '2026-05-14', status: 1 }),
    ]
    const result = computeLogbookEntries(schedules, LEGEND)
    const rows = result.groups[0]?.rows ?? []
    expect(rows[0]?.verified).toBe(true) // 2026-05-15 first (desc)
    expect(rows[1]?.verified).toBe(false)
  })

  it('totals.verified counts only verified rows', () => {
    const schedules = [
      mk({ id: '1', duty_date: '2026-05-15', status: 2 }),
      mk({ id: '2', duty_date: '2026-05-14', status: 2 }),
      mk({ id: '3', duty_date: '2026-05-13', status: 1 }),
    ]
    const result = computeLogbookEntries(schedules, LEGEND)
    expect(result.totals.entries).toBe(3)
    expect(result.totals.verified).toBe(2)
  })

  it('returns empty groups + zero totals on no qualifying entries', () => {
    const result = computeLogbookEntries([], LEGEND)
    expect(result.groups).toEqual([])
    expect(result.totals).toEqual({ entries: 0, verified: 0 })
  })

  it('handles the full mock-schedules.json fixture consistently', () => {
    // Sanity check against the real fixture — every output row has
    // count_logbooks > 0, and totals.entries === row count across all groups.
    const schedules: Schedule[] = mockSchedules.schedules as Schedule[]
    const legend: Legend[] = mockSchedules.legend as Legend[]
    const result = computeLogbookEntries(schedules, legend)

    const allRows = result.groups.flatMap((g) => g.rows)
    for (const row of allRows) {
      expect(row.countLogbooks).toBeGreaterThan(0)
    }
    expect(result.totals.entries).toBe(allRows.length)
    expect(result.totals.verified).toBe(allRows.filter((r) => r.verified).length)
    // 2026-05 month is split (verified before/on 2026-05-14, pending from
    // 2026-05-15 onward but those have count_logbooks=0). 2026-05 should be
    // the first group (desc), with verified-only rows from earlier in May.
    expect(result.groups[0]?.key).toBe('2026-05')
  })
})
