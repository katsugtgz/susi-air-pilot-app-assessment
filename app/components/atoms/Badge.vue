<script setup lang="ts">
/**
 * Badge
 * Pill-shaped status indicator. Variants map to document expiry status
 * (safe/soon/expired) plus a neutral default.
 */
interface Props {
  variant?: 'safe' | 'soon' | 'expired' | 'neutral'
  label?: string
}
withDefaults(defineProps<Props>(), { variant: 'neutral' })
</script>

<template>
  <span class="badge" :class="`badge--${variant}`">
    <span class="badge__dot" />
    <span class="badge__label"><slot>{{ label }}</slot></span>
  </span>
</template>

<style scoped lang="scss">
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  line-height: 1.4;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  &--safe {
    background: rgba(31, 191, 143, 0.12);
    color: #0b745a;
  }

  &--soon {
    background: rgba(245, 158, 11, 0.14);
    color: #965e08;
  }

  &--expired {
    // Tint of the AA red at 8% — 12% of the old red composited to #F3DFE5,
    // which put the 11px label at 4.36:1 (Lighthouse-measured, < 4.5 AA).
    background: rgba(204, 26, 58, 0.08);
    color: var(--color-danger);
  }

  &--neutral {
    background: var(--color-surface-alt);
    color: var(--color-text-secondary);
  }
}
</style>
