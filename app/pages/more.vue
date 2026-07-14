<script setup lang="ts">
/**
 * More page — profile header + grouped settings menu.
 *
 * Profile reads from the pilot store (name, pilotId, totalFlightHours).
 * Settings groups (Account / Preferences / About) are built from the
 * SettingsListItem molecule. Notifications, Documents, Appearance, Language
 * and Licenses are placeholders — only Sign out has an effect (returns to /).
 */
import { navigateTo } from '#app'
import { usePilotStore } from '~/stores/pilot'

definePageMeta({ layout: 'default' })

const pilotStore = usePilotStore()

function onSignOut() {
  // No real auth — return to Sign In per brief.
  navigateTo('/')
}
</script>

<template>
  <div class="more-page">
    <header class="more-page__app-header">
      <h1 class="more-page__app-title">More</h1>
    </header>

    <section class="more-page__profile" aria-label="Pilot profile">
      <Avatar :name="pilotStore.name" size="lg" />
      <div class="more-page__profile-meta">
        <span class="more-page__profile-name">{{ pilotStore.name }}</span>
        <span class="more-page__profile-id">{{ pilotStore.pilotId }}</span>
        <span class="more-page__profile-hours">
          {{ pilotStore.totalFlightHours.toLocaleString('en-US') }} total flight hours
        </span>
      </div>
    </section>

    <section class="more-page__group" aria-label="Account settings">
      <h2 class="more-page__group-title">Account</h2>
      <div class="more-page__group-list">
        <SettingsListItem label="Notifications" icon="bell" trailing="chevron" />
        <SettingsListItem label="Documents" icon="file-text" trailing="chevron" />
      </div>
    </section>

    <section class="more-page__group" aria-label="Preferences">
      <h2 class="more-page__group-title">Preferences</h2>
      <div class="more-page__group-list">
        <SettingsListItem
          label="Appearance"
          icon="info"
          trailing="badge"
          badge-label="Soon"
          badge-variant="soon"
        />
        <SettingsListItem
          label="Language"
          icon="info"
          trailing="badge"
          badge-label="Soon"
          badge-variant="soon"
        />
      </div>
    </section>

    <section class="more-page__group" aria-label="About">
      <h2 class="more-page__group-title">About</h2>
      <div class="more-page__group-list">
        <SettingsListItem
          label="App version"
          icon="info"
          trailing="badge"
          badge-label="v1.0.0"
          badge-variant="neutral"
        />
        <SettingsListItem label="Licenses" icon="file-text" trailing="chevron" />
      </div>
    </section>

    <section class="more-page__group" aria-label="Session">
      <div class="more-page__group-list">
        <SettingsListItem label="Sign out" icon="log-out" danger @click="onSignOut" />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.more-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0 var(--space-4) var(--space-4);

  &__app-header {
    padding: var(--space-3) 0 var(--space-1);
  }

  &__app-title {
    margin: 0;
    font-size: var(--fs-2xl);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
  }

  &__profile {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--color-surface);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-sm);
  }

  &__profile-meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }

  &__profile-name {
    font-size: var(--fs-md);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__profile-id {
    font-size: var(--fs-base-sm);
    color: var(--color-text-secondary);
    font-weight: var(--fw-medium);
  }

  &__profile-hours {
    font-size: var(--fs-sm);
    color: var(--color-text-muted);
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__group-title {
    margin: 0;
    padding: 0 var(--space-2);
    font-size: var(--fs-sm);
    font-weight: var(--fw-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__group-list {
    display: flex;
    flex-direction: column;
    background: var(--color-surface);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-sm);
    padding: var(--space-2);
    gap: var(--space-1);
  }
}
</style>
