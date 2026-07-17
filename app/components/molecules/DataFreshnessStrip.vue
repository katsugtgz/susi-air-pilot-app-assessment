<script setup lang="ts">
import type { DemoTimeline } from '~/composables/useDemoTimeline'

type FreshnessVariant = 'demo' | 'fresh' | 'stale' | 'offline' | 'error'

interface Props {
  timeline: DemoTimeline
  variant?: FreshnessVariant
  detailsLabel?: string
}
const props = withDefaults(defineProps<Props>(), {
  variant: 'demo',
})

const emit = defineEmits<{ (e: 'details'): void }>()

const ICON_BY_VARIANT: Record<FreshnessVariant, string> = {
  demo: 'info',
  fresh: 'check-circle',
  stale: 'alert-triangle',
  offline: 'alert-triangle',
  error: 'alert-octagon',
}

const variantLabel = computed(() => {
  if (props.variant === 'offline') return 'Offline cached shell'
  if (props.variant === 'stale') return 'Stale demo data'
  if (props.variant === 'error') return 'Demo data error'
  if (props.variant === 'fresh') return 'Fresh demo data'
  return 'Mock JSON snapshot'
})
</script>

<template>
  <aside class="data-freshness-strip" :class="`data-freshness-strip--${variant}`" role="status">
    <Icon :name="ICON_BY_VARIANT[variant]" :size="16" decorative />
    <div class="data-freshness-strip__content">
      <span class="data-freshness-strip__label">{{ timeline.statusText }}</span>
      <span class="data-freshness-strip__meta">
        {{ variantLabel }} ·
        <span v-for="source in timeline.sources" :key="source.id">
          {{ source.label }} {{ source.asOfDate }}
        </span>
      </span>
    </div>
    <BaseButton
      v-if="detailsLabel"
      class="data-freshness-strip__details"
      variant="ghost"
      size="sm"
      @click="emit('details')"
    >
      {{ detailsLabel }}
    </BaseButton>
  </aside>
</template>

<style scoped lang="scss">
.data-freshness-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  color: var(--color-chart-accent);
}

.data-freshness-strip--fresh {
  color: var(--color-safe-fg);
}

.data-freshness-strip--stale,
.data-freshness-strip--offline {
  color: var(--color-soon-fg);
}

.data-freshness-strip--error {
  color: var(--color-danger);
}

.data-freshness-strip__content {
  display: grid;
  gap: var(--space-1);
  flex: 1 1 220px;
  min-width: 0;
}

.data-freshness-strip__label {
  font-size: var(--fs-base-sm);
  font-weight: var(--fw-semibold);
  color: var(--color-text-primary);
}

.data-freshness-strip__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-2);
  font-size: var(--fs-xs);
  color: var(--color-text-secondary);
}

.data-freshness-strip__details {
  min-height: var(--control-height-sm);
}
</style>
