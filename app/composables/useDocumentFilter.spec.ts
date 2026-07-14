import { describe, it, expect } from 'vitest'
import {
  filterDocumentsByStatus,
  countDocumentsByStatus,
  type DocumentFilterKey,
} from './useDocumentFilter'
import type { DocumentWithExpiry } from '~/stores/documents'

function doc(id: string, status: DocumentWithExpiry['status']): DocumentWithExpiry {
  return {
    id,
    label: id,
    expiryDate: '2026-01-01',
    daysRemaining: 30,
    status,
  }
}

const sample: DocumentWithExpiry[] = [
  doc('a', 'safe'),
  doc('b', 'safe'),
  doc('c', 'soon'),
  doc('d', 'expired'),
  doc('e', 'expired'),
  doc('f', 'expired'),
]

describe('filterDocumentsByStatus', () => {
  it('returns all documents when filter is "all"', () => {
    expect(filterDocumentsByStatus(sample, 'all')).toHaveLength(sample.length)
  })

  it('returns only safe documents when filter is "valid"', () => {
    const out = filterDocumentsByStatus(sample, 'valid')
    expect(out.every((d) => d.status === 'safe')).toBe(true)
    expect(out).toHaveLength(2)
  })

  it('returns only soon documents when filter is "soon"', () => {
    const out = filterDocumentsByStatus(sample, 'soon')
    expect(out.every((d) => d.status === 'soon')).toBe(true)
    expect(out).toHaveLength(1)
  })

  it('returns only expired documents when filter is "expired"', () => {
    const out = filterDocumentsByStatus(sample, 'expired')
    expect(out.every((d) => d.status === 'expired')).toBe(true)
    expect(out).toHaveLength(3)
  })

  it('returns an empty array for an empty input regardless of filter', () => {
    const filters: DocumentFilterKey[] = ['all', 'valid', 'soon', 'expired']
    for (const f of filters) {
      expect(filterDocumentsByStatus([], f)).toEqual([])
    }
  })
})

describe('countDocumentsByStatus', () => {
  it('counts every bucket', () => {
    expect(countDocumentsByStatus(sample)).toEqual({
      all: 6,
      valid: 2,
      soon: 1,
      expired: 3,
    })
  })

  it('returns zeros for an empty list', () => {
    expect(countDocumentsByStatus([])).toEqual({
      all: 0,
      valid: 0,
      soon: 0,
      expired: 0,
    })
  })
})
