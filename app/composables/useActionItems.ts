import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { computeDocumentExpiry, type DocumentExpiryStatus } from './useDocumentExpiry'
import { computeUpcomingDutyPreview } from './useUpcomingDutyPreview'
import type { DocumentRecord, FlightLeg, NotificationItem, Schedule } from '~/types'

export type ActionItemSeverity = 'danger' | 'warning' | 'info'
export type ActionItemKind = 'next-duty' | 'document-expired' | 'document-soon' | 'logbook-incomplete'

export type ActionItemsInput = {
  readonly schedules: readonly Schedule[]
  readonly legsByDate: Readonly<Record<string, readonly FlightLeg[]>>
  readonly documents: readonly DocumentRecord[]
  readonly scheduleToday: string
  readonly documentsToday: string
  readonly documentWarningDays: number
}

export type ActionItem = {
  readonly id: string
  readonly kind: ActionItemKind
  readonly title: string
  readonly body: string
  readonly severity: ActionItemSeverity
  readonly date: string
}

export type ActionItemsResult = {
  readonly items: readonly ActionItem[]
  readonly notifications: readonly NotificationItem[]
}

type RankedActionItem = ActionItem & { readonly rank: number }

function documentRank(status: DocumentExpiryStatus): number {
  if (status === 'expired') return 0
  if (status === 'soon') return 2
  return 9
}

function documentSeverity(status: DocumentExpiryStatus): ActionItemSeverity {
  if (status === 'expired') return 'danger'
  if (status === 'soon') return 'warning'
  return 'info'
}

function documentItems(input: ActionItemsInput): readonly RankedActionItem[] {
  return input.documents.flatMap((document) => {
    const expiry = computeDocumentExpiry({
      expiryDate: document.expiryDate,
      today: input.documentsToday,
      warningDays: input.documentWarningDays,
    })
    if (expiry.status === 'safe') return []
    const statusLabel = expiry.status === 'expired' ? 'expired' : 'due soon'
    return [
      {
        id: `document-${expiry.status}-${document.id}`,
        kind: expiry.status === 'expired' ? 'document-expired' : 'document-soon',
        title: `${document.label} ${statusLabel}`,
        body: `Review by ${document.expiryDate}`,
        severity: documentSeverity(expiry.status),
        date: document.expiryDate,
        rank: documentRank(expiry.status),
      },
    ]
  })
}

function nextDutyItem(input: ActionItemsInput): readonly RankedActionItem[] {
  const preview = computeUpcomingDutyPreview({
    schedules: input.schedules,
    legsByDate: input.legsByDate,
    today: input.scheduleToday,
  })
  if (preview.kind === 'empty') return []
  return [
    {
      id: `next-duty-${preview.dutyDate}`,
      kind: 'next-duty',
      title: `Next duty ${preview.route}`,
      body: `${preview.flightNumber} at ${preview.std}, ${preview.legCount} leg(s) planned`,
      severity: 'info',
      date: preview.dutyDate,
      rank: 3,
    },
  ]
}

function logbookItems(input: ActionItemsInput): readonly RankedActionItem[] {
  return input.schedules
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
}

function toNotification(item: ActionItem): NotificationItem {
  return {
    id: `notification-${item.id}`,
    title: item.title,
    body: item.body,
    time: item.date,
    read: false,
    variant: item.severity,
  }
}

export function computeActionItems(input: ActionItemsInput): ActionItemsResult {
  const ranked = [...documentItems(input), ...logbookItems(input), ...nextDutyItem(input)].sort(
    (left, right) => left.rank - right.rank || left.date.localeCompare(right.date),
  )
  const items = ranked.map(({ rank, ...item }) => item)
  const firstDanger = items.find((item) => item.severity === 'danger')
  const firstWarning = items.find((item) => item.severity === 'warning')
  const firstInfo = items.find((item) => item.severity === 'info')
  const notifications = [firstDanger, firstWarning, firstInfo]
    .filter((item): item is ActionItem => item !== undefined)
    .map(toNotification)

  return { items, notifications }
}

export function useActionItems(
  input: MaybeRefOrGetter<ActionItemsInput>,
): ComputedRef<ActionItemsResult> {
  return computed(() => computeActionItems(toValue(input)))
}
