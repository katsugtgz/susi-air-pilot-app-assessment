import { describe, expect, it } from 'vitest'
import { computeActionItems, useActionItems } from './useActionItems'
import type { DocumentRecord, FlightLeg, Schedule } from '~/types'

const LEG: FlightLeg = {
  flightNumber: 'SI 257',
  from: 'MKW',
  to: 'INX',
  std: '06:45',
  sta: '07:42',
  aircraft: 'PK-BVS · C208B Grand Caravan',
  blockTime: '0:57',
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

const DOCUMENTS: readonly DocumentRecord[] = [
  { id: 'doc_license', label: 'Indonesian License Exp. Date', expiryDate: '2026-05-29' },
  { id: 'doc_medical', label: 'Indonesian Medical Exp. Date', expiryDate: '2026-06-11' },
  { id: 'doc_ppc', label: 'PPC Exp. Date', expiryDate: '2026-12-25' },
]

describe('computeActionItems', () => {
  it('derives next-duty, document, and incomplete-logbook action items deterministically', () => {
    // Given: one upcoming duty, expired/soon documents, and one past incomplete logbook row.
    const schedules = [
      schedule({ duty_date: '2026-05-15', count_logbooks: 6 }),
      schedule({ duty_date: '2026-05-19', count_schedules: 2, count_logbooks: 0 }),
      schedule({ duty_date: '2026-04-13', status: 2, count_schedules: 4, count_logbooks: 2 }),
    ]
    const input = {
      schedules,
      legsByDate: { '2026-05-15': [LEG] },
      documents: DOCUMENTS,
      scheduleToday: '2026-05-15',
      documentsToday: '2026-05-31',
      documentWarningDays: 30,
    }

    // When: actions are derived.
    const result = computeActionItems(input)

    // Then: output order is stable by priority, then date.
    expect(result.items.map((item) => item.id)).toEqual([
      'document-expired-doc_license',
      'logbook-incomplete-2026-04-13',
      'document-soon-doc_medical',
      'next-duty-2026-05-15',
    ])
  })

  it('does not flag upcoming duties as incomplete before they occur', () => {
    // Given: a future duty with no logbook entries yet.
    const schedules = [
      schedule({ duty_date: '2026-05-19', count_schedules: 2, count_logbooks: 0 }),
    ]
    const input = {
      schedules,
      legsByDate: {},
      documents: [],
      scheduleToday: '2026-05-15',
      documentsToday: '2026-05-31',
      documentWarningDays: 30,
    }

    // When: actions are derived.
    const result = computeActionItems(input)

    // Then: planned work is not incorrectly flagged as missing.
    expect(result.items.map((item) => item.id)).not.toContain('logbook-incomplete-2026-05-19')
  })

  it('uses safe app wording and notification variants without clearance language', () => {
    // Given: a representative action set.
    const input = {
      schedules: [schedule({ count_logbooks: 6 })],
      legsByDate: { '2026-05-15': [LEG] },
      documents: DOCUMENTS,
      scheduleToday: '2026-05-15',
      documentsToday: '2026-05-31',
      documentWarningDays: 30,
    }

    // When: items and notifications are rendered.
    const result = computeActionItems(input)

    // Then: copy avoids operational status claims.
    const copy = [...result.items, ...result.notifications]
      .flatMap((entry) => [entry.title, entry.body])
      .join(' ')
    expect(copy).not.toMatch(/safe|cleared|legal/i)
    expect(result.notifications.map((notification) => notification.variant)).toEqual([
      'danger',
      'warning',
      'info',
    ])
  })

  it('returns a reactive wrapper with the pure result', () => {
    // Given: plain values accepted by the wrapper.
    const input = {
      schedules: [schedule({ count_logbooks: 6 })],
      legsByDate: { '2026-05-15': [LEG] },
      documents: DOCUMENTS,
      scheduleToday: '2026-05-15',
      documentsToday: '2026-05-31',
      documentWarningDays: 30,
    }

    // When: the wrapper computes action items.
    const result = useActionItems(input)

    // Then: derived actions are exposed through ComputedRef.
    expect(result.value.items[0]?.id).toBe('document-expired-doc_license')
  })
})
