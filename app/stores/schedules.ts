/**
 * Schedules store — exposes the legend + schedules from mock-schedules.json.
 * Drives the calendar grid and the schedule legend list.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import schedulesData from '~/assets/data/mock-schedules.json'
import type { Legend, Schedule } from '~/types'

export const useSchedulesStore = defineStore('schedules', () => {
  const today = ref<string>(schedulesData.today)
  const legend = ref<Legend[]>(schedulesData.legend)
  const schedules = ref<Schedule[]>(schedulesData.schedules)

  /** Lookup map: duty_type code → legend entry. */
  const legendByCode = computed<Record<string, Legend>>(() => {
    const map: Record<string, Legend> = {}
    for (const entry of legend.value) {
      map[entry.code] = entry
    }
    return map
  })

  /** Lookup map: ISO date → schedule. */
  const scheduleByDate = computed<Map<string, Schedule>>(() => {
    const map = new Map<string, Schedule>()
    for (const s of schedules.value) {
      map.set(s.duty_date, s)
    }
    return map
  })

  /**
   * Next upcoming duty for the dashboard: first pending schedule (status=1)
   * with duty_date >= today, sorted ascending. Undefined if none qualify.
   *
   * Uses string compare on ISO yyyy-mm-dd — safe because all dates share
   * the same zero-padded format.
   */
  const nextUpcomingSchedule = computed<Schedule | undefined>(() => {
    const todayIso = today.value
    return (
      schedules.value
        .filter((s) => s.status === 1 && s.duty_date >= todayIso)
        .sort((a, b) => a.duty_date.localeCompare(b.duty_date))[0] ?? undefined
    )
  })

  return { today, legend, schedules, legendByCode, scheduleByDate, nextUpcomingSchedule }
})
