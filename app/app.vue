<script setup lang="ts">
const route = useRoute()

const ROUTE_ORDER: Record<string, number> = {
  '/': 0,
  '/home': 1,
  '/schedule': 2,
  '/logbook': 3,
  '/more': 4,
}

const transitionName = ref('page-fade')

watch(
  () => route.path,
  (to, from) => {
    const toOrder = ROUTE_ORDER[to] ?? -1
    const fromOrder = from ? (ROUTE_ORDER[from] ?? -1) : -1
    if (to === '/' || !from || toOrder === -1 || fromOrder === -1) {
      transitionName.value = 'page-fade'
    } else {
      transitionName.value = toOrder > fromOrder ? 'page-forward' : 'page-back'
    }
  },
)
</script>

<template>
  <NuxtLayout>
    <Transition :name="transitionName" mode="out-in">
      <NuxtPage :key="route.path" />
    </Transition>
  </NuxtLayout>
</template>

<style>
.page-fade-enter-active,
.page-fade-leave-active,
.page-forward-enter-active,
.page-forward-leave-active,
.page-back-enter-active,
.page-back-leave-active {
  transition:
    opacity var(--page-fade-dur) var(--page-fade-ease),
    transform var(--page-slide-dur) var(--page-slide-ease),
    filter var(--page-slide-dur) var(--page-slide-ease);
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
  transform: none;
  filter: none;
}

.page-forward-enter-from {
  opacity: 0;
  transform: translateX(var(--page-slide-distance));
  filter: blur(var(--page-blur));
}
.page-forward-leave-to {
  opacity: 0;
  transform: translateX(calc(var(--page-slide-distance) * -1));
  filter: blur(var(--page-blur));
}

.page-back-enter-from {
  opacity: 0;
  transform: translateX(calc(var(--page-slide-distance) * -1));
  filter: blur(var(--page-blur));
}
.page-back-leave-to {
  opacity: 0;
  transform: translateX(var(--page-slide-distance));
  filter: blur(var(--page-blur));
}

@media (prefers-reduced-motion: reduce) {
  .page-fade-enter-active,
  .page-fade-leave-active,
  .page-forward-enter-active,
  .page-forward-leave-active,
  .page-back-enter-active,
  .page-back-leave-active {
    transition: opacity var(--page-fade-dur) var(--page-fade-ease);
  }
  .page-fade-enter-from,
  .page-fade-leave-to,
  .page-forward-enter-from,
  .page-forward-leave-to,
  .page-back-enter-from,
  .page-back-leave-to {
    opacity: 0;
    transform: none;
    filter: none;
  }
}
</style>
