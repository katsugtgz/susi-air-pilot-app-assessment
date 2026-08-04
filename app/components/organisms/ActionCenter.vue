<script setup lang="ts">
import type { ActionItem, ActionItemKind, ActionItemSeverity } from '~/composables/useActionItems'

type ActionCenterItem = ActionItem & { readonly to?: string }
type ActionRoute = '/home' | '/schedule' | '/logbook' | '/more' | '/documents'

interface Props {
  items: readonly ActionCenterItem[]
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'navigate', payload: { item: ActionCenterItem; to: string; source: 'action-center' }): void
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

const nextItems = computed(() => props.items.filter((item) => item.kind === 'next-duty'))
const changedItems = computed(() => props.items.filter((item) => item.kind === 'logbook-incomplete'))
const attentionItems = computed(() =>
  props.items.filter((item) => item.kind === 'document-expired' || item.kind === 'document-soon'),
)

const groups = computed(() => [
  { labelId: 'action-center-next', title: 'Next duty', fallback: 'No next duty flagged.', items: nextItems.value },
  { labelId: 'action-center-changed', title: 'Changed', fallback: 'No changed items flagged.', items: changedItems.value },
  { labelId: 'action-center-attention', title: 'Needs attention', fallback: 'No attention items flagged.', items: attentionItems.value },
])

function navigate(item: ActionCenterItem) {
  emit('navigate', { item, to: item.to ?? ROUTE_BY_KIND[item.kind], source: 'action-center' })
}
</script>

<template>
  <article class="action-center" aria-labelledby="action-center-title">
    <header class="action-center__header">
      <div>
        <p class="action-center__eyebrow">Remote ops briefing</p>
        <h2 id="action-center-title" class="action-center__title">Action center</h2>
      </div>
      <Badge variant="neutral" label="Demo" />
    </header>

    <p class="action-center__note">Demo briefing from mock data. No live dispatch sync.</p>

    <p v-if="items.length === 0" class="action-center__empty">
      No action items in this demo snapshot.
    </p>

    <section
      v-for="group in groups"
      :key="group.labelId"
      class="action-center__group"
      :aria-labelledby="group.labelId"
    >
      <h3 :id="group.labelId" class="action-center__group-title">{{ group.title }}</h3>
      <p v-if="group.items.length === 0" class="action-center__fallback">{{ group.fallback }}</p>
      <button
        v-for="item in group.items"
        :key="item.id"
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
      </button>
    </section>
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
}

.action-center__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.action-center__eyebrow,
.action-center__group-title {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.action-center__title {
  margin: var(--space-1) 0 0;
  color: var(--color-text-primary);
  font-size: var(--fs-xl);
  line-height: 1.25;
}

.action-center__note,
.action-center__fallback,
.action-center__empty {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--fs-base-sm);
}

.action-center__group {
  display: grid;
  gap: var(--space-2);
}

.action-center__row {
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
}

.action-center__row:hover {
  background: var(--color-overlay);
}

.action-center__row:active {
  transform: translateY(0.5px);
}

.action-center__row:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.action-center__row--warning {
  color: var(--color-soon-fg);
}

.action-center__row--danger {
  color: var(--color-danger);
}

.action-center__copy {
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}

.action-center__row-title {
  color: var(--color-text-primary);
  font-size: var(--fs-base);
  font-weight: var(--fw-semibold);
}

.action-center__row-body {
  color: var(--color-text-secondary);
  font-size: var(--fs-base-sm);
}
</style>
