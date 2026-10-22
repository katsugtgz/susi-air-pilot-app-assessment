/**
 * UTC date helpers shared by the date-sensitive composables
 * (useRollingSum, useDutyCalendar, useDocumentExpiry) and display components.
 *
 * Why UTC midnight normalization: day counting across DST boundaries must not
 * shift by an hour, so every date comparison and day-count subtraction happens
 * at UTC midnight. One canonical implementation lives here instead of three
 * private near-duplicates.
 *
 * Error semantics: `parseUtcMidnight` THROWS on invalid input — callers
 * (computeRollingSum, computeDutyCalendar, computeDocumentExpiry) rely on that
 * fail-fast contract, and their specs assert it. Display-only `formatDateGB`
 * never throws; it echoes unparseable input back to the caller.
 */

/** Truncate a Date to its UTC calendar-day midnight (pure, no validation). */
export function toUtcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/**
 * Parse an ISO date string or Date to its UTC-midnight Date. Throws on
 * unparseable input (fail-fast — bad dates must not silently become today).
 */
export function parseUtcMidnight(date: string | Date): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) {
    throw new Error(`invalid date "${date}"`)
  }
  return toUtcMidnight(d)
}

/** Format a UTC-midnight Date back to ISO yyyy-mm-dd (no timezone shift). */
export function isoDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Human display format used by DocumentListItem and the logbook rows:
 * en-GB "25 Dec 2026". Returns the input unchanged when unparseable so a bad
 * data point stays visible (and debuggable) instead of rendering "Invalid Date".
 */
export function formatDateGB(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
