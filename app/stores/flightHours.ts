/**
 * Flight Hours store — exposes flightHours[], limits, and chartBounds from
 * mock-flight-hours.json. Drives the trend chart and the 4 limit cards.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import flightHoursData from '~/assets/data/mock-flight-hours.json'
import type { ChartBounds, ChartRangeKey, FlightHour, FlightLimits } from '~/types'

export const useFlightHoursStore = defineStore('flightHours', () => {
  const flightHours = ref<FlightHour[]>(flightHoursData.flightHours)
  const limits = ref<FlightLimits>(flightHoursData.limits)
  const chartBounds = ref<Record<ChartRangeKey, ChartBounds>>(flightHoursData.chartBounds)

  /** Range toggle order (matches the brief's table). */
  const rangeKeys = computed<ChartRangeKey[]>(() => ['1w', '1m', '3m', '6m', '1y'])

  return { flightHours, limits, chartBounds, rangeKeys }
})
