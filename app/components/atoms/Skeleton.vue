<script setup lang="ts">
/**
 * Skeleton
 * Animated gray placeholder for loading states. Three variants:
 *   - text: thin bar (default 12px tall, full width)
 *   - rect: card-shaped (default 100% × 80px)
 *   - circle: round (default 40×40px)
 *
 * Shimmer is a left→right gradient sweep via CSS keyframes (GPU-friendly).
 */

interface Props {
  variant?: 'text' | 'rect' | 'circle'
  width?: string | number
  height?: string | number
  radius?: string | number
}
const props = withDefaults(defineProps<Props>(), { variant: 'rect' })

function dim(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

const style = computed(() => {
  const w = dim(props.width)
  const h = dim(props.height)
  const r = dim(props.radius)
  const out: Record<string, string> = {}
  if (w) out.width = w
  if (h) out.height = h
  if (r) out.borderRadius = r
  return out
})
</script>

<template>
  <span class="skeleton" :class="`skeleton--${variant}`" :style="style" aria-hidden="true" />
</template>

<style scoped lang="scss">
.skeleton {
  display: inline-block;
  background:
    linear-gradient(
      90deg,
      var(--color-overlay) 0%,
      var(--color-overlay) 40%,
      var(--color-overlay-strong) 50%,
      var(--color-overlay) 60%,
      var(--color-overlay) 100%
    );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
  vertical-align: middle;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton--text {
  width: 100%;
  height: 12px;
  border-radius: var(--radius-sm);
}

.skeleton--rect {
  width: 100%;
  height: 80px;
  border-radius: var(--radius-card);
}

.skeleton--circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
</style>
