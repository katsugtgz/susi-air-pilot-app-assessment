/**
 * useLogbookEntries
 *
 * Derives the logbook view from `mock-schedules.json` data (via store args).
 * Per brief §3 (Feature 2):
 *
 *   - Filter: schedules with `count_logbooks > 0`
 *   - Sort: by `duty_date` descending (most recent first)
 *   - Group: by month label (human-readable, e.g. "May 2026")
 *   - Each row: duty_date, duty_type, legend label+color, base_name,
 *     count_schedules, count_logbooks, verified (status === 2)
 *   - Totals: total logbook entries (sum of count_logbooks), verified count
 *
 * Pure function — exported as `computeLogbookEntries` so it can be unit-tested
 * with no Vue mount. The `useLogbookEntries` wrapper is sugar for `<script
 * setup>` consumers, returning a `ComputedRef<LogbookResult>`.
 */
import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import type { Legend, Schedule, UserLogbookEntry } from '~/types'

export interface LogbookRow {
  /** ISO yyyy-mm-dd */
  dutyDate: string
  /** Raw duty_type code from the schedule (e.g. "DTY", "TRX"). */
  dutyType: string
  /** Legend label (looked up by code). Falls back to the raw code. */
  dutyLabel: string
  /** Legend color (looked up by code). Falls back to the schedule's base_color. */
  dutyColor: string
  /** base_name (e.g. "MKW", "PDG"). */
  baseName: string
  countSchedules: number
  countLogbooks: number
  /** True only when status === 2 (verified). */
  verified: boolean
  /** True for user-created entries merged in from the logbook store. */
  isUserEntry?: boolean
  /** "FROM → TO" route string (user entries only). */
  route?: string
  /** Aircraft text (user entries only). */
  aircraft?: string
  /** Block time "H:mm" (user entries only). */
  blockTime?: string
}

export interface LogbookMonthGroup {
  /** Human-readable month label, e.g. "May 2026". */
  label: string
  /** Sort key 'yyyy-mm' — lets consumers re-sort or compare safely. */
  key: string
  rows: LogbookRow[]
}

export interface LogbookResult {
  groups: LogbookMonthGroup[]
  totals: {
    /** Number of qualifying rows (entries with count_logbooks > 0). */
    entries: number
    /** Number of those rows whose schedule status === 2. */
    verified: number
    /** Total flight hours contributed by user-created entries. */
    hours: number
  }
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function legendByCodeMap(legend: Legend[]): Record<string, Legend> {
  const map: Record<string, Legend> = {}
  for (const entry of legend) map[entry.code] = entry
  return map
}

function monthKey(iso: string): string {
  // 'yyyy-mm-dd' → 'yyyy-mm'
  return iso.slice(0, 7)
}

function monthLabel(key: string): string {
  // 'yyyy-mm' → 'Month yyyy'
  const match = /^(\d{4})-(\d{2})$/.exec(key)
  if (!match) return key
  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) return key
  return `${MONTH_NAMES[month - 1]} ${year}`
}

function toRow(schedule: Schedule, legendMap: Record<string, Legend>): LogbookRow {
  const legend = legendMap[schedule.duty_type]
  return {
    dutyDate: schedule.duty_date,
    dutyType: schedule.duty_type,
    dutyLabel: legend?.label ?? schedule.duty_type,
    dutyColor: legend?.color ?? schedule.base_color,
    baseName: schedule.base_name,
    countSchedules: schedule.count_schedules,
    countLogbooks: schedule.count_logbooks,
    verified: schedule.status === 2,
  }
}

/** Strict "H:mm" / "HH:mm" block-time regex — two-digit minutes only. Shared
 *  by the validator in `LogbookEntrySheet.vue` and `parseBlockTime` here so
 *  the two can't drift. No `g` flag → safe to share between `.exec` / `.test`. */
export const BLOCK_TIME_RE = /^(\d+):([0-5]\d)$/

/** Parse a "H:mm" / "HH:mm" block time into fractional hours (0 on bad input). */
function parseBlockTime(blockTime: string): number {
  const match = BLOCK_TIME_RE.exec(blockTime.trim())
  if (!match) return 0
  const hours = Number(match[1])
  const minutes = Number(match[2])
  return hours + minutes / 60
}

function userEntryToRow(entry: UserLogbookEntry): LogbookRow {
  return {
    dutyDate: entry.date,
    dutyType: 'USER',
    dutyLabel: 'Logged flight',
    dutyColor: '',
    baseName: entry.from,
    countSchedules: 1,
    countLogbooks: 1,
    verified: true,
    isUserEntry: true,
    route: `${entry.from} → ${entry.to}`,
    aircraft: entry.aircraft,
    blockTime: entry.blockTime,
  }
}

export function computeLogbookEntries(
  schedules: Schedule[],
  legend: Legend[],
  userEntries: UserLogbookEntry[] = [],
): LogbookResult {
  const legendMap = legendByCodeMap(legend)

  // Filter: count_logbooks > 0. Then sort by duty_date desc.
  const filtered = schedules
    .filter((s) => s.count_logbooks > 0)
    .slice()
    .sort((a, b) => b.duty_date.localeCompare(a.duty_date))

  // Group by month, preserving desc sort within each group.
  const groupMap = new Map<string, LogbookRow[]>()
  for (const s of filtered) {
    const key = monthKey(s.duty_date)
    const rows = groupMap.get(key) ?? []
    rows.push(toRow(s, legendMap))
    groupMap.set(key, rows)
  }

  // Merge user-created entries into their month groups.
  let userHours = 0
  for (const entry of userEntries) {
    const key = monthKey(entry.date)
    const rows = groupMap.get(key) ?? []
    rows.push(userEntryToRow(entry))
    groupMap.set(key, rows)
    userHours += parseBlockTime(entry.blockTime)
  }

  // Re-sort every group's rows by duty_date desc so user + schedule rows
  // interleave by date within their shared month.
  for (const rows of groupMap.values()) {
    rows.sort((a, b) => b.dutyDate.localeCompare(a.dutyDate))
  }

  // Sort month keys desc so the latest month appears first.
  const sortedKeys = Array.from(groupMap.keys()).sort((a, b) => b.localeCompare(a))
  const groups: LogbookMonthGroup[] = sortedKeys.map((key) => ({
    key,
    label: monthLabel(key),
    rows: groupMap.get(key) ?? [],
  }))

  // Totals are computed off the row array so the `verified` flag (derived in
  // toRow) is the single source of truth — never re-derived from raw Schedule.
  const allRows = groups.flatMap((g) => g.rows)
  const totals = {
    entries: allRows.length,
    verified: allRows.filter((r) => r.verified).length,
    hours: Math.round(userHours * 100) / 100,
  }

  return { groups, totals }
}

/**
 * Reactive wrapper. Pass refs/getters so the result recomputes when the
 * underlying store data changes.
 */
export function useLogbookEntries(
  schedules: MaybeRefOrGetter<Schedule[]>,
  legend: MaybeRefOrGetter<Legend[]>,
  userEntries?: MaybeRefOrGetter<UserLogbookEntry[]>,
): ComputedRef<LogbookResult> {
  const extra = userEntries ?? (() => [])
  return computed(() => computeLogbookEntries(toValue(schedules), toValue(legend), toValue(extra)))
}
