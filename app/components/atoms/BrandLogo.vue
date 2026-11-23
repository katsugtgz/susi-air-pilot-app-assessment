<script setup lang="ts">
/**
 * BrandLogo
 * Renders the real Susi Air brand asset pulled from susiair.com.
 * Served from /public/susi-air-logo.png (light) and
 * /public/susi-air-logo-dark.png (dark) — 240x60 RGBA PNG, 4:1 aspect.
 */
interface Props {
  height?: number
  variant?: 'full' | 'mark'
}
withDefaults(defineProps<Props>(), { height: 28, variant: 'full' })
</script>

<template>
  <span class="brand-logo" :class="`brand-logo--${variant}`">
    <img
      class="brand-logo__img brand-logo__img--light"
      src="/susi-air-logo.png"
      :style="{ height: `${height}px` }"
      alt="Susi Air"
      draggable="false"
    >
    <img
      class="brand-logo__img brand-logo__img--dark"
      src="/susi-air-logo-dark.png"
      :style="{ height: `${height}px` }"
      alt="Susi Air"
      draggable="false"
    >
  </span>
</template>

<style scoped lang="scss">
.brand-logo {
  display: inline-flex;
  align-items: center;
  user-select: none;

  &__img {
    width: auto;
    aspect-ratio: 4 / 1;

    &--light {
      display: var(--brand-logo-light-display, block);
    }

    &--dark {
      display: var(--brand-logo-dark-display, none);
    }
  }
}
</style>
