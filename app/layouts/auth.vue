<script setup lang="ts">
/**
 * Auth layout — bare centered shell for the Sign In page. No bottom nav.
 */
</script>

<template>
  <div class="auth-layout">
    <div class="auth-layout__brand">
      <BrandLogo :height="32" />
    </div>
    <main class="auth-layout__main">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
.auth-layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  padding: var(--space-6) var(--space-4);
  background: var(--color-bg);

  &__brand {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__main {
    width: 100%;
    max-width: 360px;
  }
}
</style>
