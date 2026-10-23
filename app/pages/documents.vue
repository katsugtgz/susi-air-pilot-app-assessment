<script setup lang="ts">
/**
 * Documents page — full document list with status filter chips.
 *
 * Reads the documents store (the only JSON consumer per the atomic contract),
 * computes expiry + filter buckets via the pure `useDocumentFilter`
 * composable, and reuses `MyDocumentsList`/`DocumentListItem` for rendering.
 * Back button returns to /more. Default layout keeps the bottom nav.
 */
import { navigateTo } from '#app'
import { useDocumentsStore } from '~/stores/documents'
import type { DocumentFilterKey } from '~/composables/useDocumentFilter'

definePageMeta({ layout: 'default' })

const documentsStore = useDocumentsStore()

const activeFilter = ref<DocumentFilterKey>('all')

const { filtered, counts } = useDocumentFilter(
  () => documentsStore.documentsWithExpiry,
  activeFilter,
)

const FILTERS: Array<{ key: DocumentFilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'valid', label: 'Valid' },
  { key: 'soon', label: 'Expiring soon' },
  { key: 'expired', label: 'Expired' },
]

function back() {
  navigateTo('/more')
}
</script>

<template>
  <div class="documents-page">
    <header class="documents-page__header">
      <button type="button" class="documents-page__back" aria-label="Back to More" @click="back">
        <Icon name="chevron-left" :size="22" />
      </button>
      <h1 class="documents-page__title">Documents</h1>
    </header>

    <div class="documents-page__chips" role="group" aria-label="Document status filter">
      <button
        v-for="f in FILTERS"
        :key="f.key"
        type="button"
        class="documents-page__chip"
        :class="{ 'documents-page__chip--active': activeFilter === f.key }"
        :aria-pressed="activeFilter === f.key ? 'true' : 'false'"
        @click="activeFilter = f.key"
      >
        <span class="documents-page__chip-label">{{ f.label }}</span>
        <span class="documents-page__chip-count">{{ counts[f.key] }}</span>
      </button>
    </div>

    <MyDocumentsList
      v-if="filtered.length > 0"
      :documents="filtered"
      :today="documentsStore.today"
      :warning-days="documentsStore.warningDays"
      title="All documents"
    />
    <p v-else class="documents-page__empty">No documents match this filter.</p>
  </div>
</template>

<style scoped lang="scss">
.documents-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0 var(--space-4) var(--space-4);

  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) 0 var(--space-1);
  }

  &__back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: transparent;
    border: 0;
    border-radius: var(--radius-full);
    color: var(--color-text-primary);
    cursor: pointer;

    &:hover {
      background: var(--color-surface-alt);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }
  }

  &__title {
    margin: 0;
    font-size: var(--fs-2xl);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
  }

  &__chips {
    display: flex;
    gap: var(--space-2);
    // One line — "Expiring soon" wraps the row at 390px and breaks the rhythm.
    overflow-x: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
    // Give the 3px focus ring room to draw inside the scroll container.
    padding: var(--space-1);
    margin: calc(var(--space-1) * -1);
    margin-bottom: 0;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-pill);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: var(--fs-base-sm);
    font-weight: var(--fw-medium);
    white-space: nowrap;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

    &:hover {
      background: var(--color-surface-alt);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }

    // Navy, not brand red — red is reserved for expired/danger semantics.
    &--active {
      background: var(--color-text-primary);
      border-color: var(--color-text-primary);
      color: var(--color-surface);
    }

    &--active:hover {
      background: var(--color-text-primary);
    }
  }

  // Count rides inline as a quiet number, not a nested pill-in-pill badge.
  &__chip-count {
    font-size: var(--fs-xs);
    font-weight: var(--fw-semibold);
    color: var(--color-text-muted);
    line-height: 1;

    .documents-page__chip--active & {
      color: var(--color-surface);
      opacity: 0.72;
    }
  }

  &__empty {
    margin: var(--space-8) 0;
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--fs-base);
  }
}
</style>
