<script setup lang="ts">
type SyncStatus = 'demo' | 'synced' | 'syncing' | 'offline' | 'stale' | 'failed'

interface Props {
  status?: SyncStatus
  timestamp?: string
}
const props = withDefaults(defineProps<Props>(), {
  status: 'demo',
})

const clientOnline = ref(true)

function updateClientState() {
  clientOnline.value = typeof navigator === 'undefined' ? true : navigator.onLine
}

function markOnline() {
  clientOnline.value = true
}

function markOffline() {
  clientOnline.value = false
}

onMounted(() => {
  updateClientState()
  window.addEventListener('online', markOnline)
  window.addEventListener('offline', markOffline)
})

onUnmounted(() => {
  window.removeEventListener('online', markOnline)
  window.removeEventListener('offline', markOffline)
})

const effectiveStatus = computed<SyncStatus>(() => (clientOnline.value ? props.status : 'offline'))

const ICON_BY_STATUS: Record<SyncStatus, string> = {
  demo: 'info',
  synced: 'check-circle',
  syncing: 'clock',
  offline: 'alert-triangle',
  stale: 'alert-triangle',
  failed: 'alert-octagon',
}

const LABEL_BY_STATUS: Record<SyncStatus, string> = {
  demo: 'Demo data',
  synced: 'Synced',
  syncing: 'Syncing',
  offline: 'Offline',
  stale: 'Stale',
  failed: 'Failed',
}

const detailText = computed(() => {
  if (effectiveStatus.value === 'offline') return 'Cached shell · No write sync'
  if (effectiveStatus.value === 'demo') return 'Mock snapshot · No write sync'
  if (effectiveStatus.value === 'syncing') return 'Checking client state · No write sync'
  if (effectiveStatus.value === 'failed') return 'Mock snapshot unavailable · No write sync'
  if (effectiveStatus.value === 'stale') return 'Older mock snapshot · No write sync'
  return 'Mock snapshot · No write sync'
})
</script>

<template>
  <span class="sync-status-pill" :class="`sync-status-pill--${effectiveStatus}`" aria-live="polite">
    <Icon :name="ICON_BY_STATUS[effectiveStatus]" :size="14" decorative />
    <span class="sync-status-pill__label">{{ LABEL_BY_STATUS[effectiveStatus] }}</span>
    <span class="sync-status-pill__detail">{{ detailText }}</span>
    <span v-if="timestamp" class="sync-status-pill__time">{{ timestamp }}</span>
  </span>
</template>

<style scoped lang="scss">
.sync-status-pill {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-surface-alt);
  color: var(--color-chart-accent);
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
}

.sync-status-pill--synced {
  color: var(--color-safe-fg);
}

.sync-status-pill--syncing,
.sync-status-pill--stale,
.sync-status-pill--offline {
  color: var(--color-soon-fg);
}

.sync-status-pill--failed {
  color: var(--color-danger);
}

.sync-status-pill__label {
  color: currentColor;
}

.sync-status-pill__detail,
.sync-status-pill__time {
  color: var(--color-text-secondary);
  font-weight: var(--fw-medium);
}
</style>
