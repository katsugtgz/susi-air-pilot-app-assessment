<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
/*
 * Global page + layout transitions — subtle fade + slide + blur.
 * Motion tokens (durations / easings / distances / blur) are read from
 * the vendored transitions-dev layer (transitions-root.css), which mirrors
 * the `08-page-side-by-side.md` reference values. No hardcoded ms.
 */
.page-enter-active,
.page-leave-active,
.layout-enter-active,
.layout-leave-active {
  transition:
    opacity   var(--page-fade-dur)  var(--page-fade-ease),
    transform var(--page-slide-dur) var(--page-slide-ease),
    filter    var(--page-slide-dur) var(--page-slide-ease);
}
.page-enter-from,
.layout-enter-from {
  opacity: 0;
  transform: translateX(var(--page-slide-distance));
  filter: blur(var(--page-blur));
}
.page-leave-to,
.layout-leave-to {
  opacity: 0;
  transform: translateX(calc(var(--page-slide-distance) * -1));
  filter: blur(var(--page-blur));
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active,
  .layout-enter-active,
  .layout-leave-active {
    transition: opacity var(--page-fade-dur) var(--page-fade-ease);
  }
  .page-enter-from,
  .page-leave-to,
  .layout-enter-from,
  .layout-leave-to {
    opacity: 0;
    transform: none;
    filter: none;
  }
}
</style>
