import { describe, it, expect } from 'vitest'
import { l2Normalize, cosineSimilarity, retrieve, type Chunk } from './rag'

describe('l2Normalize', () => {
  it('returns a unit-norm vector', () => {
    const v = l2Normalize([3, 4])
    const mag = Math.hypot(v[0] ?? 0, v[1] ?? 0)
    expect(mag).toBeCloseTo(1, 10)
  })

  it('preserves direction', () => {
    expect(l2Normalize([0, 5])).toEqual([0, 1])
  })

  it('handles zero vector without NaN', () => {
    const v = l2Normalize([0, 0, 0])
    expect(v.every((x) => !Number.isNaN(x))).toBe(true)
    expect(v).toEqual([0, 0, 0])
  })

  it('does not mutate the input', () => {
    const input = [3, 4]
    l2Normalize(input)
    expect(input).toEqual([3, 4])
  })
})

describe('cosineSimilarity', () => {
  it('equals 1 for identical unit vectors', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1, 10)
  })

  it('equals 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10)
  })

  it('is negative for opposing vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 10)
  })

  it('returns 0 on dimension mismatch', () => {
    expect(cosineSimilarity([1, 0], [1, 0, 0])).toBe(0)
  })

  it('returns 0 for empty inputs', () => {
    expect(cosineSimilarity([], [])).toBe(0)
  })
})

describe('retrieve', () => {
  const corpus: Chunk[] = [
    { id: 'a', source: 'schedules', text: 'alpha', embedding: [1, 0] },
    { id: 'b', source: 'schedules', text: 'beta', embedding: [0, 1] },
    { id: 'c', source: 'documents', text: 'gamma', embedding: [0.9, 0.1] },
    { id: 'd', source: 'documents', text: 'delta', embedding: null },
  ]

  it('returns top-k by descending similarity', () => {
    const top = retrieve([1, 0], corpus, 2)
    expect(top.map((c) => c.id)).toEqual(['a', 'c'])
  })

  it('returns fewer than k when corpus is smaller', () => {
    const top = retrieve([1, 0], corpus.slice(0, 1), 5)
    expect(top).toHaveLength(1)
  })

  it('returns empty for k <= 0', () => {
    expect(retrieve([1, 0], corpus, 0)).toEqual([])
  })

  it('skips chunks with null embedding', () => {
    const top = retrieve([1, 0], corpus, 10)
    expect(top.find((c) => c.id === 'd')).toBeUndefined()
  })

  it('skips chunks with mismatched dimension', () => {
    const mixed: Chunk[] = [
      { id: 'a', source: 's', text: '', embedding: [1, 0, 0] },
      { id: 'b', source: 's', text: '', embedding: [1, 0] },
    ]
    const top = retrieve([1, 0], mixed, 5)
    expect(top.map((c) => c.id)).toEqual(['b'])
  })
})
