/**
 * Documents store — exposes the documents list + warning threshold from
 * mock-documents.json. Computes expiry status via useDocumentExpiry.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import documentsData from '~/assets/data/mock-documents.json'
import { computeDocumentExpiry } from '~/composables/useDocumentExpiry'
import type { DocumentExpiryStatus } from '~/composables/useDocumentExpiry'
import type { DocumentRecord } from '~/types'

export interface DocumentWithExpiry extends DocumentRecord {
  daysRemaining: number
  status: DocumentExpiryStatus
}

export const useDocumentsStore = defineStore('documents', () => {
  const today = ref<string>(documentsData.today)
  const warningDays = ref<number>(documentsData.thresholds.warningDays)
  const documents = ref<DocumentRecord[]>(documentsData.documents)

  const documentsWithExpiry = computed<DocumentWithExpiry[]>(() =>
    documents.value.map((doc) => {
      const { daysRemaining, status } = computeDocumentExpiry({
        expiryDate: doc.expiryDate,
        today: today.value,
        warningDays: warningDays.value,
      })
      return { ...doc, daysRemaining, status }
    }),
  )

  return { today, warningDays, documents, documentsWithExpiry }
})
