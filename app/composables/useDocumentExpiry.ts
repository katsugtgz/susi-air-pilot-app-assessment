/**
 * useDocumentExpiry
 *
 * Pure function — exported as `computeDocumentExpiry` so it can be unit-tested
 * without any Vue context. The `useDocumentExpiry` wrapper is sugar for use
 * inside `<script setup>` that returns a `ComputedRef<DocumentExpiryResult>`.
 *
 * Status rules (per brief §3.1):
 *   daysRemaining <= 0                                  -> "expired"  (red)
 *   0 < daysRemaining <= warningDays                    -> "soon"     (amber)
 *   else                                                -> "safe"     (green)
 *
 * `daysRemaining = floor((expiryDate - today) / dayMs)` using UTC midnight
 * both sides, so daylight saving doesn't shift the day count.
 */
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

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

function toUtcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

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

/**
 * Reactive wrapper for use in components. Pass getters/refs so the result
 * recomputes when dependencies change.
 */
export function useDocumentExpiry(
  expiryDate: MaybeRefOrGetter<string | Date>,
  today: MaybeRefOrGetter<string | Date> = '2026-05-31',
  warningDays: MaybeRefOrGetter<number> = 30,
) {
  return computed<DocumentExpiryResult>(() =>
    computeDocumentExpiry({
      expiryDate: toValue(expiryDate),
      today: toValue(today),
      warningDays: toValue(warningDays),
    }),
  )
}
