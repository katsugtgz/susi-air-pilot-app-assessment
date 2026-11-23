/**
 * useDocumentExpiry
 *
 * Pure function — exported as `computeDocumentExpiry` so it can be unit-tested
 * without any Vue context. Components (e.g. DocumentListItem) call it inside
 * their own `computed`.
 *
 * Status rules (per brief §3.1):
 *   daysRemaining <= 0                                  -> "expired"  (red)
 *   0 < daysRemaining <= warningDays                    -> "soon"     (amber)
 *   else                                                -> "safe"     (green)
 *
 * `daysRemaining = floor((expiryDate - today) / dayMs)` using UTC midnight
 * both sides, so daylight saving doesn't shift the day count.
 */
import { toUtcMidnight } from '~/utils/dates'

export type DocumentExpiryStatus = 'expired' | 'soon' | 'safe'

export interface DocumentExpiryInput {
  expiryDate: string | Date
  today?: string | Date
  warningDays?: number
}

export interface DocumentExpiryResult {
  daysRemaining: number
  status: DocumentExpiryStatus
}

const DAY_MS = 86_400_000

export function computeDocumentExpiry(input: DocumentExpiryInput): DocumentExpiryResult {
  const warningDays = input.warningDays ?? 30
  const expiry = typeof input.expiryDate === 'string' ? new Date(input.expiryDate) : input.expiryDate
  const today = typeof input.today === 'string' ? new Date(input.today) : (input.today ?? new Date())

  if (Number.isNaN(expiry.getTime()) || Number.isNaN(today.getTime())) {
    throw new Error(
      `useDocumentExpiry: invalid date input (expiry=${input.expiryDate}, today=${input.today})`,
    )
  }

  const ms = toUtcMidnight(expiry).getTime() - toUtcMidnight(today).getTime()
  const daysRemaining = Math.floor(ms / DAY_MS)

  let status: DocumentExpiryStatus
  if (daysRemaining <= 0) status = 'expired'
  else if (daysRemaining <= warningDays) status = 'soon'
  else status = 'safe'

  return { daysRemaining, status }
}
