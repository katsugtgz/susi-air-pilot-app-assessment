/**
 * useDocumentFilter
 *
 * Pure filter logic for the Documents page. Filters documents-with-expiry
 * (the shape returned by `useDocumentsStore.documentsWithExpiry`) by status
 * bucket and exposes counts per bucket so the chip row can render a number
 * next to each filter.
 *
 * Pure core is exported as `filterDocumentsByStatus` for unit testing; the
 * reactive wrapper `useDocumentFilter` is sugar for <script setup>.
 */
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type { DocumentWithExpiry } from '~/stores/documents'

export type DocumentFilterKey = 'all' | 'valid' | 'soon' | 'expired'

export interface DocumentFilterCounts {
  all: number
  valid: number
  soon: number
  expired: number
}

const FILTER_TO_STATUS: Record<Exclude<DocumentFilterKey, 'all'>, 'safe' | 'soon' | 'expired'> = {
  valid: 'safe',
  soon: 'soon',
  expired: 'expired',
}

export function filterDocumentsByStatus(
  docs: DocumentWithExpiry[],
  filter: DocumentFilterKey,
): DocumentWithExpiry[] {
  if (filter === 'all') return docs
  const status = FILTER_TO_STATUS[filter]
  return docs.filter((d) => d.status === status)
}

export function countDocumentsByStatus(docs: DocumentWithExpiry[]): DocumentFilterCounts {
  const counts: DocumentFilterCounts = { all: docs.length, valid: 0, soon: 0, expired: 0 }
  for (const d of docs) {
    if (d.status === 'safe') counts.valid += 1
    else if (d.status === 'soon') counts.soon += 1
    else if (d.status === 'expired') counts.expired += 1
  }
  return counts
}

export function useDocumentFilter(
  docs: MaybeRefOrGetter<DocumentWithExpiry[]>,
  filter: MaybeRefOrGetter<DocumentFilterKey>,
) {
  const filtered = computed(() =>
    filterDocumentsByStatus(toValue(docs), toValue(filter)),
  )
  const counts = computed(() => countDocumentsByStatus(toValue(docs)))
  return { filtered, counts }
}
