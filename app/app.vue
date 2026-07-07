<script setup lang="ts"></script>

<template>
  <div class="app-shell">
    <p class="app-shell__note">Susi Air Pilot App — foundations scaffolded. Storybook is the primary UI surface during Phase 1–2.</p>
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: var(--color-bg);
  font-family: var(--font-sans);

  &__note {
    color: var(--color-text-secondary);
    text-align: center;
    font-size: 0.875rem;
    max-width: 24rem;
  }
}
</style>
