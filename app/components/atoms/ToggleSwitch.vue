<script setup lang="ts">
/**
 * ToggleSwitch
 * Accessible on/off switch atom. Uses role="switch" (NOT role="checkbox"):
 * a switch communicates a binary state with an immediate effect (no submit),
 * matching the WAI-ARIA authoring guide. Keyboard-operable (Space + Enter
 * both toggle), exposes aria-checked, and supports a disabled state.
 */
interface Props {
  modelValue: boolean
  disabled?: boolean
  ariaLabel?: string
}
const props = withDefaults(defineProps<Props>(), { disabled: false })

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  // Space and Enter both toggle a switch per WAI-ARIA Authoring Practices.
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    toggle()
  }
}
</script>

<template>
  <button
    type="button"
    role="switch"
    class="toggle-switch"
    :class="{ 'toggle-switch--on': modelValue, 'toggle-switch--disabled': disabled }"
    :aria-checked="modelValue ? 'true' : 'false'"
    :aria-label="ariaLabel"
    :disabled="disabled"
    @click="toggle"
    @keydown="onKeydown"
  >
    <span class="toggle-switch__thumb" aria-hidden="true" />
  </button>
</template>

<style scoped lang="scss">
.toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-border);
  cursor: pointer;
  transition: background 0.18s ease;

  &:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }

  &:hover:not(.toggle-switch--disabled) {
    background: var(--color-text-muted);
  }

  &--on {
    background: var(--color-success);

    &:hover:not(.toggle-switch--disabled) {
      background: var(--color-success);
      filter: brightness(1.05);
    }
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    transition: transform 0.18s ease;
    will-change: transform;
  }

  &--on &__thumb {
    transform: translateX(18px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .toggle-switch,
  .toggle-switch__thumb {
    transition: none !important;
  }
}
</style>
