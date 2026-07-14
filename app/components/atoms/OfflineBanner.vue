<script setup lang="ts">
const isOffline = ref(false)

function updateOnlineStatus() {
  isOffline.value = typeof navigator !== 'undefined' && !navigator.onLine
}

onMounted(() => {
  updateOnlineStatus()
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<template>
  <Transition name="offline-banner">
    <div v-if="isOffline" class="offline-banner" role="status">
      <Icon name="info" :size="14" decorative />
      <span class="offline-banner__text">You're offline — showing cached data</span>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.offline-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-warning);
  color: #fff;
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);

  &__text {
    line-height: 1.3;
  }
}

.offline-banner-enter-active,
.offline-banner-leave-active {
  transition:
    transform var(--duration-fast) var(--ease-smooth-out),
    opacity var(--duration-fast) var(--ease-smooth-out);
}

.offline-banner-enter-from,
.offline-banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .offline-banner-enter-active,
  .offline-banner-leave-active {
    transition: opacity var(--duration-fast) var(--ease-smooth-out);
  }

  .offline-banner-enter-from,
  .offline-banner-leave-to {
    transform: none;
    opacity: 0;
  }
}
</style>
