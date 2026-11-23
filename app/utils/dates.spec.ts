import { describe, it, expect } from 'vitest'
import { parseUtcMidnight, toUtcMidnight, isoDate, formatDateGB } from './dates'

describe('parseUtcMidnight', () => {
  it('parses an ISO date string to that UTC day midnight', () => {
    const d = parseUtcMidnight('2026-05-31')
    expect(d.toISOString()).toBe('2026-05-31T00:00:00.000Z')
  })

  it('accepts Date objects, normalizing to UTC midnight', () => {
    const d = parseUtcMidnight(new Date('2026-05-31T14:23:00Z'))
    expect(d.toISOString()).toBe('2026-05-31T00:00:00.000Z')
  })

  it('throws on invalid date string', () => {
    expect(() => parseUtcMidnight('not-a-date')).toThrow(/invalid date/)
  })

  it('throws on invalid Date object', () => {
    expect(() => parseUtcMidnight(new Date('nope'))).toThrow(/invalid date/)
  })
})

describe('toUtcMidnight', () => {
  it('truncates a Date to its UTC calendar-day midnight', () => {
    const d = toUtcMidnight(new Date('2026-05-31T23:59:59.999Z'))
    expect(d.toISOString()).toBe('2026-05-31T00:00:00.000Z')
  })
})

describe('isoDate', () => {
  it('formats a UTC-midnight Date as yyyy-mm-dd', () => {
    expect(isoDate(new Date(Date.UTC(2026, 4, 31)))).toBe('2026-05-31')
  })

  it('zero-pads month and day', () => {
    expect(isoDate(new Date(Date.UTC(2026, 0, 5)))).toBe('2026-01-05')
  })

  it('round-trips parseUtcMidnight', () => {
    expect(isoDate(parseUtcMidnight('2026-12-25'))).toBe('2026-12-25')
  })
})

describe('formatDateGB', () => {
  it('formats an ISO date as "25 Dec 2026"', () => {
    expect(formatDateGB('2026-12-25')).toBe('25 Dec 2026')
  })

  it('formats another example as "31 May 2026"', () => {
    expect(formatDateGB('2026-05-31')).toBe('31 May 2026')
  })

  it('returns the input unchanged when it is not a parseable date', () => {
    expect(formatDateGB('not-a-date')).toBe('not-a-date')
  })
})
