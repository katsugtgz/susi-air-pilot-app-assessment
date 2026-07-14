<script setup lang="ts">
/**
 * SettingsListItem
 * Row used to build the grouped settings menu on the More page. Renders as
 * either a `<button>` (default) or `<a>` when `as="link"` + `href` are
 * supplied — so each entry keeps correct a11y semantics. Trailing slot can
 * show a Badge (for "Soon" / version pill) or a chevron Icon.
 *
 * Reuses the Icon + Badge atoms only — no new dependencies.
 */
interface Props {
  label: string
  icon?: string
  /** Trailing affordance: nothing, a Badge (use badgeLabel), or a chevron. */
  trailing?: 'none' | 'badge' | 'chevron'
  badgeLabel?: string
  badgeVariant?: 'safe' | 'soon' | 'expired' | 'neutral'
  /** Danger tint — used for Sign out. */
  danger?: boolean
  /** Render as an anchor (`as="link"` requires `href`). */
  as?: 'button' | 'link'
  href?: string
  /** Disable interaction. */
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  trailing: 'none',
  badgeVariant: 'neutral',
  danger: false,
  as: 'button',
  disabled: false,
})

const emit = defineEmits<{ (e: 'click', payload: MouseEvent): void }>()

function onClick(event: MouseEvent) {
  if (props.disabled) return
  emit('click', event)
}
</script>

<template>
  <a
    v-if="as === 'link'"
    :href="disabled ? undefined : href"
    class="settings-list-item"
    :class="{ 'settings-list-item--danger': danger, 'settings-list-item--disabled': disabled }"
    :aria-disabled="disabled ? 'true' : undefined"
    @click="onClick"
  >
    <span v-if="icon" class="settings-list-item__icon" :class="{ 'settings-list-item__icon--danger': danger }">
      <Icon :name="icon" :size="18" />
    </span>
    <span class="settings-list-item__label">{{ label }}</span>
    <span class="settings-list-item__trailing">
      <Badge v-if="trailing === 'badge'" :variant="badgeVariant" :label="badgeLabel" />
      <Icon v-else-if="trailing === 'chevron'" name="chevron-right" :size="18" decorative />
    </span>
  </a>

  <button
    v-else
    type="button"
    class="settings-list-item"
    :class="{ 'settings-list-item--danger': danger, 'settings-list-item--disabled': disabled }"
    :disabled="disabled"
    @click="onClick"
  >
    <span v-if="icon" class="settings-list-item__icon" :class="{ 'settings-list-item__icon--danger': danger }">
      <Icon :name="icon" :size="18" />
    </span>
    <span class="settings-list-item__label">{{ label }}</span>
    <span class="settings-list-item__trailing">
      <Badge v-if="trailing === 'badge'" :variant="badgeVariant" :label="badgeLabel" />
      <Icon v-else-if="trailing === 'chevron'" name="chevron-right" :size="18" decorative />
    </span>
  </button>
</template>

<style scoped lang="scss">
.settings-list-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-2);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  font-family: inherit;
  font-size: var(--fs-base);
  font-weight: var(--fw-medium);
  color: var(--color-text-primary);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover:not(.settings-list-item--disabled) {
    background: var(--color-surface-alt);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    background: var(--color-surface-alt);
    color: var(--color-text-secondary);
    flex-shrink: 0;

    &--danger {
      background: rgba(204, 26, 58, 0.08);
      color: var(--color-danger);
    }
  }

  &__label {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__trailing {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  &--danger {
    color: var(--color-danger);
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
