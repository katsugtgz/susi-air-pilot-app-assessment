import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import type { FlightLeg, Schedule } from '~/types'

export type UpcomingDutyPreviewInput = {
  readonly schedules: readonly Schedule[]
  readonly legsByDate: Readonly<Record<string, readonly FlightLeg[]>>
  readonly today: string
}

export type UpcomingDutyPreview =
  | {
      readonly kind: 'ready'
      readonly dutyDate: string
      readonly baseName: string
      readonly dutyType: string
      readonly departureCode: string
      readonly arrivalCode: string
      readonly route: string
      readonly std: string
      readonly sta: string
      readonly flightNumber: string
      readonly aircraft: string
      readonly legCount: number
    }
  | { readonly kind: 'empty' }
  | { readonly kind: 'invalid'; readonly reason: string }

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function computeUpcomingDutyPreview(
  input: UpcomingDutyPreviewInput,
): UpcomingDutyPreview {
  if (!ISO_DATE.test(input.today)) {
    return {
      kind: 'invalid',
      reason: `today must be a YYYY-MM-DD date, got "${input.today}"`,
    }
  }
  const upcoming = input.schedules
    .filter((schedule) => schedule.status === 1 && schedule.duty_date >= input.today)
    .sort((left, right) => left.duty_date.localeCompare(right.duty_date))

  for (const schedule of upcoming) {
    const legs = input.legsByDate[schedule.duty_date] ?? []
    const firstLeg = legs[0]
    if (firstLeg) {
      return {
        kind: 'ready',
        dutyDate: schedule.duty_date,
        baseName: schedule.base_name,
        dutyType: schedule.duty_type,
        departureCode: firstLeg.from,
        arrivalCode: firstLeg.to,
        route: `${firstLeg.from} → ${firstLeg.to}`,
        std: firstLeg.std,
        sta: firstLeg.sta,
        flightNumber: firstLeg.flightNumber,
        aircraft: firstLeg.aircraft,
        legCount: legs.length,
      }
    }
  }

  return { kind: 'empty' }
}

export function useUpcomingDutyPreview(
  input: MaybeRefOrGetter<UpcomingDutyPreviewInput>,
): ComputedRef<UpcomingDutyPreview> {
  return computed(() => computeUpcomingDutyPreview(toValue(input)))
}
