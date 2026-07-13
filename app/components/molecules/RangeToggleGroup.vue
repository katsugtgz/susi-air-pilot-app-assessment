<script setup lang="ts">
/**
 * RangeToggleGroup
 * Segmented control for the 1w / 1m / 3m / 6m / 1y window selector on the
 * HoursToLimit section. Active option styled as a pill on top of a track.
 */
interface Option {
  value: string
  label: string
}
interface Props {
  modelValue: string
  options?: Option[]
}
const props = withDefaults(defineProps<Props>(), {
  options: () => [
    { value: '1w', label: '1W' },
    { value: '1m', label: '1M' },
    { value: '3m', label: '3M' },
    { value: '6m', label: '6M' },
    { value: '1y', label: '1Y' },
  ],
})
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

function select(value: string) {
  if (value !== props.modelValue) emit('update:modelValue', value)
}

const containerRef = ref<HTMLElement | null>(null)
const pillRef = ref<HTMLElement | null>(null)

// transitions.dev — tabs sliding (16-tabs-sliding.md). JS writes the active
// option's offsetLeft / offsetWidth onto the pill as inline transform/width;
// CSS owns the tween. First paint + resize position the pill WITHOUT a
// transition so it snaps before any animation can run.
function movePill(animate: boolean) {
  const container = containerRef.value
  const pill = pillRef.value
  if (!container || !pill) return
  const active = container.querySelector<HTMLElement>('.range-toggle-group__option--active')
  if (!active) return
  if (!animate) {
    const prev = pill.style.transition
    pill.style.transition = 'none'
    pill.style.transform = `translateX(${active.offsetLeft}px)`
    pill.style.width = `${active.offsetWidth}px`
    void pill.offsetWidth // force reflow
    pill.style.transition = prev
  } else {
    pill.style.transform = `translateX(${active.offsetLeft}px)`
    pill.style.width = `${active.offsetWidth}px`
  }
}

let onResize: (() => void) | null = null
onMounted(() => {
  requestAnimationFrame(() => movePill(false))
  onResize = () => movePill(false)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  if (onResize) window.removeEventListener('resize', onResize)
})
watch(
  () => props.modelValue,
  () => nextTick(() => movePill(true)),
)
watch(
  () => props.options,
  () => nextTick(() => movePill(false)),
  { deep: true },
)
</script>

<template>
  <div ref="containerRef" class="range-toggle-group" role="tablist" aria-label="Range">
    <span ref="pillRef" class="t-tabs-pill" aria-hidden="true" />
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="range-toggle-group__option"
      :class="{ 'range-toggle-group__option--active': opt.value === modelValue }"
      role="tab"
      :aria-selected="opt.value === modelValue ? 'true' : 'false'"
      @click="select(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.range-toggle-group {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  background: var(--color-surface-alt);
  border-radius: var(--radius-pill);
  width: 100%;

  &__option {
    position: relative;
    z-index: 1;
    flex: 1;
    padding: var(--space-2) var(--space-3);
    background: transparent;
    border: 0;
    border-radius: var(--radius-pill);
    color: var(--color-text-secondary);
    font-family: var(--font-sans);
    font-size: var(--fs-base-sm);
    font-weight: var(--fw-semibold);
    cursor: pointer;
    transition: color var(--tabs-dur) var(--tabs-ease);

    &:hover:not(.range-toggle-group__option--active) {
      color: var(--color-text-primary);
    }

    &--active {
      color: var(--color-red);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }
  }
}

/* transitions.dev — tabs sliding (16-tabs-sliding.md), pasted verbatim.
   The pill's width/transform are written inline by JS; the transition tweens
   between measured positions. Reads --tabs-* tokens from transitions-root.css. */
.t-tabs-pill {
  position: absolute;
  top: 3px;
  left: 0;
  height: 30px;
  width: 0;
  background: var(--tabs-pill-bg);
  border-radius: 48px;
  transform: translateX(0);
  transition:
    transform var(--tabs-dur) var(--tabs-ease),
    width     var(--tabs-dur) var(--tabs-ease);
  will-change: transform, width;
  z-index: 0;
  pointer-events: none;
}

/* Refine-by-usage: size the pill to the toggle's track (2px inset, full
   height, pill radius) and use the design-system surface + shadow so it
   matches the original active-option look. */
.range-toggle-group .t-tabs-pill {
  top: 2px;
  bottom: 2px;
  height: auto;
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
}

@media (prefers-reduced-motion: reduce) {
  .t-tabs-pill, .range-toggle-group__option { transition: none !important; }
}
</style>
