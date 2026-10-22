<template>
  <!-- t-skel reveal lives in transitions-root.css (global). -->
  <div class="home-page__skeleton-hours">
    <Skeleton variant="rect" :height="40" radius="24" :width="220" />
    <Skeleton variant="rect" :height="180" />
    <div class="home-page__skeleton-cards">
      <Skeleton variant="rect" :height="140" />
      <Skeleton variant="rect" :height="140" />
      <Skeleton variant="rect" :height="140" />
      <Skeleton variant="rect" :height="140" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * HoursSkeleton
 * Single source for the HoursToLimit section's loading placeholder — rendered
 * both inside home.vue's chart-crossfade <Transition> (key="skeleton") and as
 * the LazyHoursToLimitSection #fallback. Markup lives here once.
 */
</script>

<style scoped lang="scss">
.home-page__skeleton-hours {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: var(--space-4);
}

.home-page__skeleton-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
</style>
