<script setup lang="ts">
import type { ActionItem, ActionItemKind, ActionItemSeverity } from '~/composables/useOpsBriefing'

type ActionCenterItem = ActionItem & { readonly to?: string }
type ActionRoute = '/home' | '/schedule' | '/logbook' | '/more' | '/documents'

interface Props {
  items: readonly ActionCenterItem[]
}
defineProps<Props>()

const emit = defineEmits<{
  (e: 'navigate', payload: { item: ActionCenterItem; to: string }): void
}>()

const ROUTE_BY_KIND: Record<ActionItemKind, ActionRoute> = {
  'next-duty': '/schedule',
  'document-expired': '/documents',
  'document-soon': '/documents',
  'logbook-incomplete': '/logbook',
}

const ICON_BY_SEVERITY: Record<ActionItemSeverity, string> = {
  danger: 'alert-octagon',
  warning: 'alert-triangle',
  info: 'info',
}

function navigate(item: ActionCenterItem) {
  emit('navigate', { item, to: item.to ?? ROUTE_BY_KIND[item.kind] })
}
</script>

<template>
  <article class="action-center" aria-labelledby="action-center-title">
    <header class="action-center__header">
      <h2 id="action-center-title" class="action-center__title">Action center</h2>
      <Badge
        :variant="items.length > 0 ? 'neutral' : 'safe'"
        :label="items.length > 0 ? `${items.length} open` : 'All clear'"
      />
    </header>

    <p v-if="items.length === 0" class="action-center__empty">
      No open actions right now.
    </p>

    <ul v-else class="action-center__list">
      <li v-for="item in items" :key="item.id">
        <button
          type="button"
          class="action-center__row"
          :class="`action-center__row--${item.severity}`"
          :data-action-id="item.id"
          @click="navigate(item)"
        >
          <Icon :name="ICON_BY_SEVERITY[item.severity]" :size="18" decorative />
          <span class="action-center__copy">
            <span class="action-center__row-title">{{ item.title }}</span>
            <span class="action-center__row-body">{{ item.body }}</span>
          </span>
          <Icon name="chevron-right" :size="16" decorative class="action-center__chevron" />
        </button>
      </li>
    </ul>
  </article>
</template>

<style scoped lang="scss">
.action-center {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  &__title {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--fs-xl);
    line-height: 1.25;
  }

  &__empty {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--fs-base-sm);
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-2);
  }

  &__row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    min-height: var(--control-height-lg);
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-alt);
    color: var(--color-chart-accent);
    cursor: pointer;
    font: inherit;
    text-align: left;
    transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.05s ease;

    &:hover {
      background: var(--color-overlay);
    }

    &:active {
      transform: translateY(0.5px);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }

    &--warning {
      color: var(--color-soon-fg);
    }

    &--danger {
      color: var(--color-danger);
    }
  }

  &__copy {
    flex: 1;
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  &__row-title {
    color: var(--color-text-primary);
    font-size: var(--fs-base);
    font-weight: var(--fw-semibold);
  }

  &__row-body {
    color: var(--color-text-secondary);
    font-size: var(--fs-base-sm);
  }

  &__chevron {
    color: var(--color-text-muted);
    flex-shrink: 0;
  }
}
</style>
