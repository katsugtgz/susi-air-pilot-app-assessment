import { describe, it, expect } from 'vitest'
import schedulesDataRaw from '~/assets/data/mock-schedules.json'
import flightLegsDataRaw from '~/assets/data/mock-flight-legs.json'
import type { FlightLeg, FlightLegsData, Schedule } from '~/types'

const schedulesData = schedulesDataRaw as unknown as {
  schedules: Schedule[]
}
const flightLegsData = flightLegsDataRaw as unknown as FlightLegsData

const dtyDays = schedulesData.schedules.filter((s) => s.duty_type === 'DTY')

describe('mock-flight-legs.json', () => {
  it('covers every DTY day from mock-schedules', () => {
    for (const s of dtyDays) {
      expect(flightLegsData.legsByDate).toHaveProperty(s.duty_date)
    }
  })

  it('does not include legs for non-DTY days', () => {
    const nonDty = schedulesData.schedules.filter((s) => s.duty_type !== 'DTY')
    for (const s of nonDty) {
      expect(flightLegsData.legsByDate).not.toHaveProperty(s.duty_date)
    }
  })

  it('each DTY day has exactly count_schedules legs', () => {
    for (const s of dtyDays) {
      const legs = flightLegsData.legsByDate[s.duty_date] as FlightLeg[] | undefined
      expect(legs).toBeDefined()
      expect(legs?.length).toBe(s.count_schedules)
    }
  })

  it('every leg has std < sta (string compare works for zero-padded HH:mm)', () => {
    for (const s of dtyDays) {
      const legs = flightLegsData.legsByDate[s.duty_date] as FlightLeg[]
      for (const leg of legs) {
        expect(leg.std < leg.sta).toBe(true)
      }
    }
  })

  it('legs within a day are sequential (each std >= previous sta)', () => {
    for (const s of dtyDays) {
      const legs = flightLegsData.legsByDate[s.duty_date] as FlightLeg[]
      for (let i = 1; i < legs.length; i++) {
        const prevSta = legs[i - 1]?.sta
        const currStd = legs[i]?.std
        expect(prevSta).toBeDefined()
        expect(currStd).toBeDefined()
        expect((currStd as string) >= (prevSta as string)).toBe(true)
      }
    }
  })

  it('all legs stay inside the 06:00–17:00 operating window', () => {
    for (const s of dtyDays) {
      const legs = flightLegsData.legsByDate[s.duty_date] as FlightLeg[]
      for (const leg of legs) {
        expect(leg.std >= '06:00').toBe(true)
        expect(leg.sta <= '17:00').toBe(true)
      }
    }
  })

  it('aircraft field is a C208B Grand Caravan with a PK-BV* tail', () => {
    for (const s of dtyDays) {
      const legs = flightLegsData.legsByDate[s.duty_date] as FlightLeg[]
      for (const leg of legs) {
        expect(leg.aircraft).toMatch(/^PK-BV[A-Z]{1,2} · C208B Grand Caravan$/)
      }
    }
  })

  it('blockTime is consistent with std/sta delta', () => {
    const toMins = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(Number)
      return (h ?? 0) * 60 + (m ?? 0)
    }
    for (const s of dtyDays) {
      const legs = flightLegsData.legsByDate[s.duty_date] as FlightLeg[]
      for (const leg of legs) {
        const expectedMins = toMins(leg.sta) - toMins(leg.std)
        const [h, m] = leg.blockTime.split(':').map(Number)
        const actualMins = (h ?? 0) * 60 + (m ?? 0)
        expect(actualMins).toBe(expectedMins)
      }
    }
  })

  it('fieldGuide documents every leg field', () => {
    const required = ['flightNumber', 'from', 'to', 'std', 'sta', 'aircraft', 'blockTime']
    for (const field of required) {
      expect(flightLegsData.fieldGuide).toHaveProperty(field)
      expect(typeof flightLegsData.fieldGuide[field]).toBe('string')
    }
  })
})
