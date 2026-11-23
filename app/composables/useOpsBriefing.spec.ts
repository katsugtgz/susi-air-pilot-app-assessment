import { describe, expect, it } from 'vitest'
import { computeOpsBriefing, useOpsBriefing } from './useOpsBriefing'
import type { DocumentRecord, FlightLeg, Schedule } from '~/types'

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

const DOCUMENTS: readonly DocumentRecord[] = [
  { id: 'doc_license', label: 'Indonesian License Exp. Date', expiryDate: '2026-05-29' },
  { id: 'doc_medical', label: 'Indonesian Medical Exp. Date', expiryDate: '2026-06-11' },
  { id: 'doc_ppc', label: 'PPC Exp. Date', expiryDate: '2026-12-25' },
]

describe('computeOpsBriefing', () => {
  it('derives the next leg-backed duty preview and skips legless pending rows', () => {
    const schedules = [
      schedule({ id: '97028', duty_date: '2026-05-16', duty_type: 'MED', count_schedules: 1 }),
      schedule({ id: '97029', duty_date: '2026-05-21', base_name: 'CJN' }),
    ]
    const legsByDate = { '2026-05-21': [FIRST_LEG, SECOND_LEG] }

    const result = computeOpsBriefing({
      schedules,
      legsByDate,
      documents: [],
      scheduleToday: '2026-05-15',
      documentsToday: '2026-05-31',
      documentWarningDays: 30,
    })

    expect(result.nextDuty).toEqual({
      kind: 'ready',
      dutyDate: '2026-05-21',
      departureCode: 'MKW',
      arrivalCode: 'INX',
      std: '06:45',
      sta: '07:42',
      flightNumber: 'SI 257',
      legCount: 2,
    })
  })

  it('returns empty nextDuty when no leg-backed pending duty exists', () => {
    const schedules = [
      schedule({ status: 2 }),
      schedule({ duty_date: '2026-05-20', duty_type: 'MED' }),
    ]

    const result = computeOpsBriefing({
      schedules,
      legsByDate: {},
      documents: [],
      scheduleToday: '2026-05-15',
      documentsToday: '2026-05-31',
      documentWarningDays: 30,
    })

    expect(result.nextDuty).toEqual({ kind: 'empty' })
    expect(result.items).toEqual([])
  })

  it('rejects malformed and calendar-invalid scheduleToday values without spurious logbook flags', () => {
    const schedules = [schedule({ duty_date: '2026-04-13', count_schedules: 4, count_logbooks: 2 })]
    const legsByDate = { '2026-05-15': [FIRST_LEG] }

    for (const badDate of ['not-a-date', '2026-02-30', '2026-13-01']) {
      const result = computeOpsBriefing({
        schedules,
        legsByDate,
        documents: [],
        scheduleToday: badDate,
        documentsToday: '2026-05-31',
        documentWarningDays: 30,
      })

      expect(result.nextDuty.kind).toBe('invalid')
      if (result.nextDuty.kind === 'invalid') expect(result.nextDuty.reason).toContain(badDate)
      expect(result.items).toEqual([])
    }
  })

  it('ranks expired docs, past incomplete logbooks, expiring docs, and next duty deterministically', () => {
    const schedules = [
      schedule({ duty_date: '2026-05-15', count_logbooks: 6 }),
      schedule({ duty_date: '2026-05-19', count_schedules: 2, count_logbooks: 0 }),
      schedule({ duty_date: '2026-04-13', status: 2, count_schedules: 4, count_logbooks: 2 }),
    ]

    const result = computeOpsBriefing({
      schedules,
      legsByDate: { '2026-05-15': [FIRST_LEG] },
      documents: DOCUMENTS,
      scheduleToday: '2026-05-15',
      documentsToday: '2026-05-31',
      documentWarningDays: 30,
    })

    expect(result.items.map((item) => item.id)).toEqual([
      'document-expired-doc_license',
      'logbook-incomplete-2026-04-13',
      'document-soon-doc_medical',
      'next-duty-2026-05-15',
    ])
    expect(result.items.map((item) => item.id)).not.toContain('logbook-incomplete-2026-05-19')
  })

  it('derives one top notification per severity with neutral wording', () => {
    const result = computeOpsBriefing({
      schedules: [schedule({ count_logbooks: 6 })],
      legsByDate: { '2026-05-15': [FIRST_LEG] },
      documents: DOCUMENTS,
      scheduleToday: '2026-05-15',
      documentsToday: '2026-05-31',
      documentWarningDays: 30,
    })

    const copy = [...result.items, ...result.notifications]
      .flatMap((entry) => [entry.title, entry.body])
      .join(' ')
    expect(copy).not.toMatch(/safe|cleared|legal/i)
    expect(result.notifications.map((n) => n.variant)).toEqual(['danger', 'warning', 'info'])
  })

  it('exposes a reactive ComputedRef wrapper', () => {
    const briefing = useOpsBriefing({
      schedules: [schedule({ count_logbooks: 6 })],
      legsByDate: { '2026-05-15': [FIRST_LEG] },
      documents: DOCUMENTS,
      scheduleToday: '2026-05-15',
      documentsToday: '2026-05-31',
      documentWarningDays: 30,
    })

    expect(briefing.value.nextDuty.kind).toBe('ready')
    if (briefing.value.nextDuty.kind === 'ready') {
      expect(briefing.value.nextDuty.flightNumber).toBe('SI 257')
    }
    expect(briefing.value.items[0]?.id).toBe('document-expired-doc_license')
  })
})
