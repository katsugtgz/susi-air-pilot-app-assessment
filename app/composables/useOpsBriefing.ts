import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { isoDate } from '~/utils/dates'
import { computeDocumentExpiry, type DocumentExpiryStatus } from './useDocumentExpiry'
import type { DocumentRecord, FlightLeg, NotificationItem, Schedule } from '~/types'

export type ActionItemSeverity = 'danger' | 'warning' | 'info'
export type ActionItemKind = 'next-duty' | 'document-expired' | 'document-soon' | 'logbook-incomplete'

export type ActionItem = {
  readonly id: string
  readonly kind: ActionItemKind
  readonly title: string
  readonly body: string
  readonly severity: ActionItemSeverity
  readonly date: string
}

export type UpcomingDutyPreview =
  | {
      readonly kind: 'ready'
      readonly dutyDate: string
      readonly departureCode: string
      readonly arrivalCode: string
      readonly std: string
      readonly sta: string
      readonly flightNumber: string
      readonly legCount: number
    }
  | { readonly kind: 'empty' }
  | { readonly kind: 'invalid'; readonly reason: string }

export type OpsBriefingInput = {
  readonly schedules: readonly Schedule[]
  readonly legsByDate: Readonly<Record<string, readonly FlightLeg[]>>
  readonly documents: readonly DocumentRecord[]
  readonly scheduleToday: string
  readonly documentsToday: string
  readonly documentWarningDays: number
}

export type OpsBriefing = {
  readonly nextDuty: UpcomingDutyPreview
  readonly items: readonly ActionItem[]
  readonly notifications: readonly NotificationItem[]
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && isoDate(parsed) === value
}

function computeUpcomingDuty(
  schedules: readonly Schedule[],
  legsByDate: Readonly<Record<string, readonly FlightLeg[]>>,
  today: string,
): UpcomingDutyPreview {
  if (!isValidIsoDate(today)) {
    return {
      kind: 'invalid',
      reason: `today must be a valid YYYY-MM-DD calendar date, got "${today}"`,
    }
  }

  const upcoming = schedules
    .filter((schedule) => schedule.status === 1 && schedule.duty_date >= today)
    .sort((left, right) => left.duty_date.localeCompare(right.duty_date))

  for (const schedule of upcoming) {
    const legs = legsByDate[schedule.duty_date] ?? []
    const firstLeg = legs[0]
    if (firstLeg) {
      return {
        kind: 'ready',
        dutyDate: schedule.duty_date,
        departureCode: firstLeg.from,
        arrivalCode: firstLeg.to,
        std: firstLeg.std,
        sta: firstLeg.sta,
        flightNumber: firstLeg.flightNumber,
        legCount: legs.length,
      }
    }
  }

  return { kind: 'empty' }
}

type RankedActionItem = ActionItem & { readonly rank: number }

const DOC_META: Record<
  Exclude<DocumentExpiryStatus, 'safe'>,
  { kind: 'document-expired' | 'document-soon'; label: string; severity: ActionItemSeverity; rank: number }
> = {
  expired: { kind: 'document-expired', label: 'expired', severity: 'danger', rank: 0 },
  soon: { kind: 'document-soon', label: 'due soon', severity: 'warning', rank: 2 },
}

export function computeOpsBriefing(input: OpsBriefingInput): OpsBriefing {
  const nextDuty = computeUpcomingDuty(input.schedules, input.legsByDate, input.scheduleToday)

  const docItems: RankedActionItem[] = input.documents.flatMap((doc) => {
    const expiry = computeDocumentExpiry({
      expiryDate: doc.expiryDate,
      today: input.documentsToday,
      warningDays: input.documentWarningDays,
    })
    if (expiry.status === 'safe') return []
    const meta = DOC_META[expiry.status]
    return [
      {
        id: `document-${expiry.status}-${doc.id}`,
        kind: meta.kind,
        title: `${doc.label} ${meta.label}`,
        body: `Review by ${doc.expiryDate}`,
        severity: meta.severity,
        date: doc.expiryDate,
        rank: meta.rank,
      },
    ]
  })

  const logbookItems: RankedActionItem[] =
    nextDuty.kind === 'invalid'
      ? []
      : input.schedules
          .filter(
            (schedule) =>
              schedule.count_logbooks < schedule.count_schedules &&
              schedule.duty_date < input.scheduleToday,
          )
          .map((schedule) => ({
            id: `logbook-incomplete-${schedule.duty_date}`,
            kind: 'logbook-incomplete',
            title: `Logbook incomplete for ${schedule.duty_date}`,
            body: `${schedule.count_logbooks}/${schedule.count_schedules} entries recorded`,
            severity: 'warning',
            date: schedule.duty_date,
            rank: 1,
          }))

  const dutyItems: RankedActionItem[] =
    nextDuty.kind === 'ready'
      ? [
          {
            id: `next-duty-${nextDuty.dutyDate}`,
            kind: 'next-duty',
            title: `Next duty ${nextDuty.departureCode} → ${nextDuty.arrivalCode}`,
            body: `${nextDuty.flightNumber} at ${nextDuty.std}, ${nextDuty.legCount} leg(s) planned`,
            severity: 'info',
            date: nextDuty.dutyDate,
            rank: 3,
          },
        ]
      : []

  const items = [...docItems, ...logbookItems, ...dutyItems]
    .sort((left, right) => left.rank - right.rank || left.date.localeCompare(right.date))
    .map(({ rank, ...item }) => item)

  const notifications: NotificationItem[] = (['danger', 'warning', 'info'] as const)
    .map((severity) => items.find((item) => item.severity === severity))
    .filter((item): item is ActionItem => item !== undefined)
    .map((item) => ({
      id: `notification-${item.id}`,
      title: item.title,
      body: item.body,
      time: item.date,
      read: false,
      variant: item.severity,
    }))

  return { nextDuty, items, notifications }
}

export function useOpsBriefing(
  input: MaybeRefOrGetter<OpsBriefingInput>,
): ComputedRef<OpsBriefing> {
  return computed(() => computeOpsBriefing(toValue(input)))
}
