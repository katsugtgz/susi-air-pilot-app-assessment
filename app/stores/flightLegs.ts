/**
 * FlightLegs store — exposes the per-date flight-leg lists from
 * mock-flight-legs.json. Consumed by the schedule page's DutyDetailSheet.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import flightLegsData from '~/assets/data/mock-flight-legs.json'
import type { FlightLeg } from '~/types'

export const useFlightLegsStore = defineStore('flightLegs', () => {
  const legsByDate = ref<Record<string, FlightLeg[]>>(flightLegsData.legsByDate)
  return { legsByDate }
})
