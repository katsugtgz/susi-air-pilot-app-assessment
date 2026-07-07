import { describe, it, expect } from 'vitest'
import { computeDocumentExpiry, useDocumentExpiry } from './useDocumentExpiry'

const TODAY = '2026-05-31' // brief §3.1 development "today" (mock-documents.json)
const WARNING_DAYS = 30 // brief §3.1

describe('computeDocumentExpiry', () => {
  describe('brief §3.1 worked examples', () => {
    type Case = [string, string, 'expired' | 'soon' | 'safe', number]
    const cases: Case[] = [
      // [id, expiryDate, expectedStatus, expectedDays]
      ['doc_recurrent', '2026-10-14', 'safe', 136],
      ['doc_ppc', '2026-12-25', 'safe', 208],
      ['doc_license', '2026-05-29', 'expired', -2],
      ['doc_medical', '2026-06-11', 'soon', 11],
      ['doc_security', '2026-05-01', 'expired', -30],
    ]

    for (const [id, expiry, expectedStatus, expectedDays] of cases) {
      it(`${id} (${expiry}) -> ${expectedStatus} (${expectedDays}d)`, () => {
        const result = computeDocumentExpiry({
          expiryDate: expiry,
          today: TODAY,
          warningDays: WARNING_DAYS,
        })
        expect(result.status).toBe(expectedStatus)
        expect(result.daysRemaining).toBe(expectedDays)
      })
    }
  })

  describe('status boundaries', () => {
    it('exact expiry day -> expired (daysRemaining = 0)', () => {
      const r = computeDocumentExpiry({ expiryDate: '2026-05-31', today: TODAY })
      expect(r.daysRemaining).toBe(0)
      expect(r.status).toBe('expired')
    })

    it('1 day remaining -> soon', () => {
      const r = computeDocumentExpiry({ expiryDate: '2026-06-01', today: TODAY })
      expect(r.daysRemaining).toBe(1)
      expect(r.status).toBe('soon')
    })

    it('exactly warningDays remaining -> soon (boundary inclusive)', () => {
      const r = computeDocumentExpiry({ expiryDate: '2026-06-30', today: TODAY, warningDays: 30 })
      expect(r.daysRemaining).toBe(30)
      expect(r.status).toBe('soon')
    })

    it('warningDays + 1 remaining -> safe', () => {
      const r = computeDocumentExpiry({ expiryDate: '2026-07-01', today: TODAY, warningDays: 30 })
      expect(r.daysRemaining).toBe(31)
      expect(r.status).toBe('safe')
    })

    it('honours a custom warningDays', () => {
      const r = computeDocumentExpiry({ expiryDate: '2026-06-10', today: TODAY, warningDays: 7 })
      expect(r.daysRemaining).toBe(10)
      expect(r.status).toBe('safe')
    })
  })

  describe('date input shapes', () => {
    it('accepts Date objects', () => {
      const r = computeDocumentExpiry({ expiryDate: new Date('2026-10-14'), today: new Date(TODAY) })
      expect(r.status).toBe('safe')
    })

    it('uses current date when today omitted', () => {
      const future = new Date()
      future.setUTCFullYear(future.getUTCFullYear() + 1)
      const r = computeDocumentExpiry({ expiryDate: future })
      expect(r.status).toBe('safe')
      expect(r.daysRemaining).toBeGreaterThan(360)
    })

    it('throws on invalid date strings', () => {
      expect(() => computeDocumentExpiry({ expiryDate: 'not-a-date' })).toThrow()
    })

    it('handles daylight-saving edge: cross DST boundary cleanly', () => {
      // 2026-10-25 is when EU DST ends; cross it from 2026-10-24.
      const r = computeDocumentExpiry({ expiryDate: '2026-10-25', today: '2026-10-24' })
      expect(r.daysRemaining).toBe(1)
    })
  })
})

describe('useDocumentExpiry (reactive wrapper)', () => {
  it('returns a ComputedRef with the same value as the pure function', async () => {
    const ref = useDocumentExpiry('2026-06-11', TODAY, WARNING_DAYS)
    expect(ref.value.status).toBe('soon')
    expect(ref.value.daysRemaining).toBe(11)
  })
})
