/**
 * useDutyDetail
 *
 * Resolves the legs + logged counts for a single tapped schedule day, to drive
 * the DutyDetailSheet. Pure: takes the schedule (or null) and the legs-by-date
 * map, returns the legs for that date with each leg flagged `isLogged`.
 *
 * "Logged" follows the brief's tick-vs-badge rule: the first
 * `schedule.count_logbooks` legs of the day are considered logged. A day with
 * no legs (non-duty types like RLV/SCK/TRD — only DTY days carry legs per the
 * mock-flight-legs fieldGuide) reports `isDutyDay === false` so the sheet can
 * render its empty state.
 */
import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import type { FlightLeg, Schedule } from '~/types'

export interface DutyLeg extends FlightLeg {
  isLogged: boolean
}

export interface DutyDetail {
  /** ISO yyyy-mm-dd of the schedule, or '' when no schedule is selected. */
  dutyDate: string
  /** Raw duty_type code (e.g. "DTY"), or '' when no schedule. */
  dutyType: string
  /** Legs for the day, each flagged logged/unlogged. Empty for non-duty days. */
  legs: DutyLeg[]
  /** Number of legs already logged (=== count_logbooks, capped at legs length). */
  loggedCount: number
  /** Total legs for the day. */
  totalLegs: number
  /** True only when the day has legs to display (a DTY day). */
  isDutyDay: boolean
}

const EMPTY_DETAIL: DutyDetail = {
  dutyDate: '',
  dutyType: '',
  legs: [],
  loggedCount: 0,
  totalLegs: 0,
  isDutyDay: false,
}

export function computeDutyDetail(
  schedule: Schedule | null,
  legsByDate: Record<string, FlightLeg[]>,
): DutyDetail {
  if (!schedule) return { ...EMPTY_DETAIL }

  const dayLegs = legsByDate[schedule.duty_date] ?? []
  const loggedCount = Math.min(schedule.count_logbooks, dayLegs.length)
  const legs: DutyLeg[] = dayLegs.map((leg, index) => ({
    ...leg,
    isLogged: index < loggedCount,
  }))

  return {
    dutyDate: schedule.duty_date,
    dutyType: schedule.duty_type,
    legs,
    loggedCount,
    totalLegs: dayLegs.length,
    isDutyDay: dayLegs.length > 0,
  }
}

export function useDutyDetail(
  schedule: MaybeRefOrGetter<Schedule | null>,
  legsByDate: MaybeRefOrGetter<Record<string, FlightLeg[]>>,
): ComputedRef<DutyDetail> {
  return computed(() => computeDutyDetail(toValue(schedule), toValue(legsByDate)))
}
