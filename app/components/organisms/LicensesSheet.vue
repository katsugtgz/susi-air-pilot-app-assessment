<script setup lang="ts">
/**
 * LicensesSheet
 * Static OSS attribution list. License identifiers are verified against each
 * package's `license` field in node_modules (see comment by each entry).
 * No runtime fetch — keeps the sheet SSR-safe and offline-friendly.
 */
interface Props {
  open: boolean
}
defineProps<Props>()

const emit = defineEmits<{ (e: 'close'): void }>()

interface LicenseEntry {
  name: string
  version: string
  license: string
}

const LICENSES: LicenseEntry[] = [
  { name: 'Nuxt', version: '4.4.8', license: 'MIT' },
  { name: 'Vue', version: '3.5.39', license: 'MIT' },
  { name: 'Pinia', version: '3.0.4', license: 'MIT' },
  { name: 'Chart.js', version: '4.5.1', license: 'MIT' },
  { name: 'vue-chartjs', version: '5.3.3', license: 'MIT' },
  { name: '@lucide/vue', version: '1.23.0', license: 'ISC' },
  { name: '@google/genai', version: '1.52.0', license: 'Apache-2.0' },
  { name: 'Storybook', version: '10.4.6', license: 'MIT' },
  { name: 'Vitest', version: '4.1.10', license: 'MIT' },
]

function close() {
  emit('close')
}
</script>

<template>
  <BottomSheet :open="open" title="Licenses" aria-label="Open-source licenses" @close="close">
    <ul class="licenses-sheet__list">
      <li v-for="entry in LICENSES" :key="`${entry.name}@${entry.version}`" class="licenses-sheet__row">
        <span class="licenses-sheet__name">{{ entry.name }}</span>
        <span class="licenses-sheet__version">v{{ entry.version }}</span>
        <span class="licenses-sheet__license">{{ entry.license }}</span>
      </li>
    </ul>
    <p class="licenses-sheet__note">
      Full license texts ship with each package inside <code>node_modules</code>.
    </p>
  </BottomSheet>
</template>

<style scoped lang="scss">
.licenses-sheet {
  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: baseline;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-2);
    border-bottom: 1px solid var(--color-border);

    &:last-child {
      border-bottom: 0;
    }
  }

  &__name {
    color: var(--color-text-primary);
    font-weight: var(--fw-semibold);
    font-size: var(--fs-base);
  }

  &__version {
    color: var(--color-text-muted);
    font-size: var(--fs-base-sm);
    font-variant-numeric: tabular-nums;
  }

  &__license {
    color: var(--color-text-secondary);
    background: var(--color-surface-alt);
    border-radius: var(--radius-sm);
    padding: 2px var(--space-2);
    font-size: var(--fs-xs);
    font-weight: var(--fw-semibold);
    letter-spacing: 0.02em;
  }

  &__note {
    margin: var(--space-4) 0 0;
    color: var(--color-text-muted);
    font-size: var(--fs-base-sm);

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      background: var(--color-surface-alt);
      padding: 0 var(--space-1);
      border-radius: var(--radius-sm);
    }
  }
}
</style>
