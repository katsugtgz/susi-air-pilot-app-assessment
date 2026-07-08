import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDocumentsStore } from './documents'

describe('useDocumentsStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('exposes today and warningDays from JSON', () => {
    const store = useDocumentsStore()
    expect(store.today).toBe('2026-05-31')
    expect(store.warningDays).toBe(30)
  })

  it('exposes all 5 documents', () => {
    const store = useDocumentsStore()
    expect(store.documents).toHaveLength(5)
  })

  it('documentsWithExpiry computes status per brief §3.1 (the 5 worked examples)', () => {
    const store = useDocumentsStore()
    const byId = Object.fromEntries(store.documentsWithExpiry.map((d) => [d.id, d]))
    expect(byId.doc_recurrent?.status).toBe('safe')
    expect(byId.doc_ppc?.status).toBe('safe')
    expect(byId.doc_license?.status).toBe('expired')
    expect(byId.doc_medical?.status).toBe('soon')
    expect(byId.doc_security?.status).toBe('expired')
  })
})
