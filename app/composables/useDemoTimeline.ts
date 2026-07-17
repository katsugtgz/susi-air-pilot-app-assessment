import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'

export type DemoTimelineSourceId = 'schedule' | 'documents' | 'flight-hours'

export type DemoTimelineInput = {
  readonly scheduleToday: string
  readonly documentsToday: string
  readonly flightHoursToday: string
}

export type DemoTimelineSource = {
  readonly id: DemoTimelineSourceId
  readonly label: string
  readonly asOfDate: string
}

export type DemoTimeline = {
  readonly sources: readonly DemoTimelineSource[]
  readonly latestDataDate: string
  readonly statusText: string
}

export function computeDemoTimeline(input: DemoTimelineInput): DemoTimeline {
  const sources: readonly DemoTimelineSource[] = [
    { id: 'schedule', label: 'Schedule', asOfDate: input.scheduleToday },
    { id: 'documents', label: 'Documents', asOfDate: input.documentsToday },
    { id: 'flight-hours', label: 'Flight hours', asOfDate: input.flightHoursToday },
  ]
  const latestDataDate = sources
    .map((source) => source.asOfDate)
    .sort((left, right) => right.localeCompare(left))[0]
  const currentThrough = latestDataDate ?? input.scheduleToday

  return {
    sources,
    latestDataDate: currentThrough,
    statusText: `Demo data is current through ${currentThrough}`,
  }
}

export function useDemoTimeline(
  input: MaybeRefOrGetter<DemoTimelineInput>,
): ComputedRef<DemoTimeline> {
  return computed(() => computeDemoTimeline(toValue(input)))
}
