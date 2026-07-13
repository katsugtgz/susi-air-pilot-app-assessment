<script setup lang="ts">
/**
 * ProgressRing
 * SVG ring that fills 0..max. Auto-assigns warning/danger modifier when value
 * crosses thresholds (default 80% / 100% of max).
 */

interface Props {
  value: number
  max?: number
  size?: number
  stroke?: number
  warningThreshold?: number // fraction of max, e.g. 0.8
  dangerThreshold?: number // fraction of max, e.g. 1
  unit?: string
  label?: string
  /** Optional formatter for the center value text (e.g. to round floats). */
  formatValue?: (value: number) => string
}
const props = withDefaults(defineProps<Props>(), {
  max: 100,
  size: 72,
  stroke: 6,
  warningThreshold: 0.8,
  dangerThreshold: 1,
  unit: '',
  formatValue: undefined,
})

const clamped = computed(() => Math.max(0, Math.min(props.value, props.max)))
const ratio = computed(() => (props.max > 0 ? clamped.value / props.max : 0))

const radius = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => circumference.value * (1 - ratio.value))

const state = computed<'safe' | 'warning' | 'danger'>(() => {
  if (ratio.value >= props.dangerThreshold) return 'danger'
  if (ratio.value >= props.warningThreshold) return 'warning'
  return 'safe'
})

const valueText = computed(() =>
  typeof props.formatValue === 'function' ? props.formatValue(props.value) : String(props.value),
)

// Per-character split for the transitions.dev `t-digit-group` pop-in. The
// value span is :key'd on valueText so Vue re-mounts the group (replaying
// the keyframe) whenever the value changes.
const valueChars = computed(() => valueText.value.split(''))
// Last two chars ride in 1× / 2× --digit-stagger behind the leading digits.
function digitStagger(i: number, total: number): string | undefined {
  if (i === total - 2) return '1'
  if (i === total - 1) return '2'
  return undefined
}
</script>

<template>
  <div class="progress-ring" :class="`progress-ring--${state}`">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="progress-ring__svg">
      <circle
        class="progress-ring__track"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke-width="stroke"
      />
      <circle
        class="progress-ring__value"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        :transform="`rotate(-90 ${size / 2} ${size / 2})`"
      />
    </svg>
    <div class="progress-ring__center">
      <span
        :key="valueText"
        class="progress-ring__value-text t-digit-group is-animating"
      >
        <span
          v-for="(ch, i) in valueChars"
          :key="i"
          class="t-digit"
          :data-stagger="digitStagger(i, valueChars.length)"
        >{{ ch }}</span
        ><span v-if="unit" class="progress-ring__unit">{{ unit }}</span>
      </span>
      <span v-if="label" class="progress-ring__label">{{ label }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.progress-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &__svg {
    display: block;
  }

  &__track {
    stroke: rgba(14, 33, 56, 0.08);
  }

  &__value {
    transition: stroke-dashoffset 0.4s ease, stroke 0.2s ease;
  }

  &--safe &__value {
    stroke: var(--color-success);
  }
  &--warning &__value {
    stroke: var(--color-warning);
  }
  &--danger &__value {
    stroke: var(--color-danger);
  }

  &__center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    line-height: 1.1;
  }

  &__value-text {
    font-size: var(--fs-md);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
  }

  &__unit {
    font-size: var(--fs-xs);
    font-weight: var(--fw-semibold);
    color: var(--color-text-secondary);
    margin-left: 2px;
  }

  &__label {
    font-size: var(--fs-xs);
    color: var(--color-text-secondary);
    margin-top: 2px;
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
