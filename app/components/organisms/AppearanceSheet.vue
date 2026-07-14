<script setup lang="ts">
/**
 * AppearanceSheet
 * Three-option appearance picker (Light / Dark / System) mounted on the
 * generic BottomSheet. Selecting a row updates `useTheme().preference`,
 * which persists to localStorage and applies `data-theme` on <html>
 * immediately — no reload needed.
 */
import type { ThemePreference } from '~/composables/useTheme'

interface Props {
  open: boolean
}
defineProps<Props>()

const emit = defineEmits<{ (e: 'close'): void }>()

const { preference, theme } = useTheme()

const OPTIONS: Array<{
  value: ThemePreference
  label: string
  hint: string
}> = [
  { value: 'light', label: 'Light', hint: 'Always light' },
  { value: 'dark', label: 'Dark', hint: 'Always dark' },
  {
    value: 'system',
    label: 'System',
    hint: 'Follow OS preference',
  },
]

function select(value: ThemePreference) {
  preference.value = value
}

function close() {
  emit('close')
}
</script>

<template>
  <BottomSheet :open="open" title="Appearance" aria-label="Appearance options" @close="close">
    <ul class="appearance-sheet__list" role="radiogroup" aria-label="Theme">
      <li v-for="opt in OPTIONS" :key="opt.value">
        <button
          type="button"
          role="radio"
          class="appearance-sheet__row"
          :class="{ 'appearance-sheet__row--active': preference === opt.value }"
          :aria-checked="preference === opt.value ? 'true' : 'false'"
          @click="select(opt.value)"
        >
          <span class="appearance-sheet__meta">
            <span class="appearance-sheet__label">{{ opt.label }}</span>
            <span class="appearance-sheet__hint">
              {{ opt.hint }}<template v-if="opt.value === 'system'"> · current: {{ theme }}</template>
            </span>
          </span>
          <span
            class="appearance-sheet__check"
            :class="{ 'appearance-sheet__check--on': preference === opt.value }"
            aria-hidden="true"
          >
            <Icon name="check" :size="14" />
          </span>
        </button>
      </li>
    </ul>
  </BottomSheet>
</template>

<style scoped lang="scss">
.appearance-sheet {
  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-3) var(--space-3);
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: var(--fs-base);
    font-weight: var(--fw-medium);
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;

    &:hover {
      background: var(--color-surface-alt);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }

    &--active {
      border-color: var(--color-red);
      background: var(--color-surface-alt);
    }
  }

  &__meta {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__label {
    color: var(--color-text-primary);
    font-weight: var(--fw-semibold);
  }

  &__hint {
    color: var(--color-text-secondary);
    font-size: var(--fs-base-sm);
    font-weight: var(--fw-regular);
  }

  &__check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    color: var(--color-surface);
    background: transparent;
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 0.15s ease, transform 0.15s ease, background 0.15s ease;
    flex-shrink: 0;

    &--on {
      opacity: 1;
      transform: scale(1);
      background: var(--color-red);
    }
  }
}
</style>
