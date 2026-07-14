<script setup lang="ts">
/**
 * NotificationPrefsSheet
 * Three toggle rows persisted via usePersistedState('notification-prefs', …).
 * The defaults (all on) match what a working pilot would want: schedule
 * changes, document-expiry reminders, and company news. State survives
 * reloads because usePersistedState writes through to localStorage.
 */
interface Props {
  open: boolean
}
defineProps<Props>()

const emit = defineEmits<{ (e: 'close'): void }>()

interface Prefs {
  scheduleChanges: boolean
  documentExpiry: boolean
  companyNews: boolean
}

const DEFAULT_PREFS: Prefs = {
  scheduleChanges: true,
  documentExpiry: true,
  companyNews: false,
}

const prefs = usePersistedState<Prefs>('notification-prefs', DEFAULT_PREFS)

const ROWS: Array<{ key: keyof Prefs; label: string; hint: string; icon: string }> = [
  {
    key: 'scheduleChanges',
    label: 'Schedule changes',
    hint: 'Notify me when my roster is updated.',
    icon: 'bell',
  },
  {
    key: 'documentExpiry',
    label: 'Document expiry reminders',
    hint: 'Warn before a certificate expires.',
    icon: 'file-text',
  },
  {
    key: 'companyNews',
    label: 'Company news',
    hint: 'Crew bulletins and operational updates.',
    icon: 'info',
  },
]

function close() {
  emit('close')
}
</script>

<template>
  <BottomSheet :open="open" title="Notifications" aria-label="Notification preferences" @close="close">
    <ul class="notification-prefs-sheet__list">
      <li v-for="row in ROWS" :key="row.key" class="notification-prefs-sheet__row">
        <span class="notification-prefs-sheet__icon"><Icon :name="row.icon" :size="20" /></span>
        <span class="notification-prefs-sheet__meta">
          <span class="notification-prefs-sheet__label">{{ row.label }}</span>
          <span class="notification-prefs-sheet__hint">{{ row.hint }}</span>
        </span>
        <ToggleSwitch
          :model-value="prefs[row.key]"
          :aria-label="row.label"
          @update:model-value="prefs[row.key] = $event"
        />
      </li>
    </ul>
  </BottomSheet>
</template>

<style scoped lang="scss">
.notification-prefs-sheet {
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
    padding: var(--space-3);
    border-radius: var(--radius-md);
  }

  &__row:hover {
    background: var(--color-surface-alt);
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
}
</style>
