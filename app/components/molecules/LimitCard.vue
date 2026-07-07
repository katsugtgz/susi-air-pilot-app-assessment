<script setup lang="ts">
/**
 * LimitCard
 * One of the 4 daily/weekly/monthly/annual limit cards on the dashboard.
 * Uses ProgressRing as the central visual.
 */
import { computed } from 'vue'
import ProgressRing from '~/components/atoms/ProgressRing.vue'

interface Props {
  label: string
  value: number
  limit: number
  unit?: string
  /** Override ProgressRing defaults (0.8 / 1.0). */
  warningThreshold?: number
  dangerThreshold?: number
}
const props = withDefaults(defineProps<Props>(), {
  unit: 'h',
  warningThreshold: 0.8,
  dangerThreshold: 1,
})

const state = computed<'safe' | 'warning' | 'danger'>(() => {
  const ratio = props.limit > 0 ? props.value / props.limit : 0
  if (ratio >= props.dangerThreshold) return 'danger'
  if (ratio >= props.warningThreshold) return 'warning'
  return 'safe'
})

const remaining = computed(() => Math.max(0, props.limit - props.value))
</script>

<template>
  <div class="limit-card" :class="`limit-card--${state}`">
    <ProgressRing
      :value="value"
      :max="limit"
      :unit="unit"
      :label="label"
      :warning-threshold="warningThreshold"
      :danger-threshold="dangerThreshold"
    />
    <div class="limit-card__meta">
      <span class="limit-card__remaining">
        <span class="limit-card__remaining-value">{{ remaining }}{{ unit }}</span>
        <span class="limit-card__remaining-label">left</span>
      </span>
      <span class="limit-card__limit">of {{ limit }}{{ unit }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.limit-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: var(--space-4) var(--space-3);
  box-shadow: var(--shadow-sm);
  min-width: 140px;

  &--warning {
    box-shadow: var(--shadow-sm), 0 0 0 1px rgba(245, 158, 11, 0.2);
  }

  &--danger {
    box-shadow: var(--shadow-sm), 0 0 0 1px rgba(230, 55, 87, 0.25);
  }

  &__meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  &__remaining {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
  }

  &__remaining-value {
    font-size: var(--fs-md);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
  }

  &__remaining-label {
    font-size: var(--fs-xs);
    color: var(--color-text-secondary);
  }

  &__limit {
    font-size: var(--fs-xs);
    color: var(--color-text-muted);
  }
}
</style>
