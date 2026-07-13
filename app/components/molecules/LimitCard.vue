<script setup lang="ts">
/**
 * LimitCard
 * One of the 4 daily/weekly/monthly/annual limit cards on the dashboard.
 * Uses ProgressRing as the central visual.
 */
import { formatHours, formatHoursOrMinutes, roundHours } from '~/utils/format'

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

// Display formatters — keeps raw values precise upstream while avoiding
// IEEE-754 noise like "24.599999999999998h" in the UI.
const _valueText = computed(() => formatHours(props.value, props.unit))
// Remaining switches to minutes under 1h so "0.7h left" reads as "42m left".
const remainingText = computed(() => formatHoursOrMinutes(remaining.value, props.unit))
const limitText = computed(() => formatHours(props.limit, props.unit))

// Per-character split for the transitions.dev `t-digit-group` pop-in. The
// remaining-value span is :key'd on remainingText so Vue re-mounts the
// group (replaying the keyframe) whenever the value changes.
const remainingChars = computed(() => remainingText.value.split(''))
function digitStagger(i: number, total: number): string | undefined {
  if (i === total - 2) return '1'
  if (i === total - 1) return '2'
  return undefined
}
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
      :format-value="(n: number) => String(roundHours(n))"
    />
    <div class="limit-card__meta">
      <span class="limit-card__remaining">
        <span
          :key="remainingText"
          class="limit-card__remaining-value t-digit-group is-animating"
        >
          <span
            v-for="(ch, i) in remainingChars"
            :key="i"
            class="t-digit"
            :data-stagger="digitStagger(i, remainingChars.length)"
          >{{ ch }}</span>
        </span>
        <span class="limit-card__remaining-label">left</span>
      </span>
      <span class="limit-card__limit">of {{ limitText }}</span>
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
  min-width: 0;

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

/* transitions.dev — number pop-in (02-number-pop-in.md), pasted verbatim.
   Reads --digit-* motion tokens from transitions-root.css. */
@keyframes t-digit-pop-in {
  0%   {
    transform: translate(
      calc(var(--digit-distance) * var(--digit-dir-x)),
      calc(var(--digit-distance) * var(--digit-dir-y))
    );
    opacity: 0;
    filter: blur(var(--digit-blur));
  }
  100% { transform: translate(0, 0); opacity: 1; filter: blur(0); }
}

.t-digit-group {
  display: inline-flex;
  align-items: baseline;
}
.t-digit {
  display: inline-block;
  will-change: transform, opacity, filter;
}
.t-digit-group.is-animating .t-digit {
  animation: t-digit-pop-in var(--digit-dur) var(--digit-ease) both;
}
.t-digit-group.is-animating .t-digit[data-stagger="1"] {
  animation-delay: var(--digit-stagger);
}
.t-digit-group.is-animating .t-digit[data-stagger="2"] {
  animation-delay: calc(var(--digit-stagger) * 2);
}

@media (prefers-reduced-motion: reduce) {
  .t-digit-group .t-digit { animation: none !important; }
}
</style>
