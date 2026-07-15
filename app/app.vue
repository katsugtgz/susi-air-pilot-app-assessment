<script setup lang="ts">
// Page transitions are driven by native Nuxt config (nuxt.config `app.pageTransition`)
// with the per-navigation direction chosen in middleware/page-transition.global.ts.
// Letting Nuxt own the <Transition> keeps page and layout swaps coordinated, so
// cross-layout navigations (auth → default on sign-in) no longer orphan the page.
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
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
