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
    background: var(--color-safe-bg);
    color: var(--color-safe-fg);
  }

  &--soon {
    background: var(--color-soon-bg);
    color: var(--color-soon-fg);
  }

  &--expired {
    background: var(--color-expired-bg);
    color: var(--color-danger);
  }

  &--neutral {
    background: var(--color-surface-alt);
    color: var(--color-text-secondary);
  }
}
</style>
