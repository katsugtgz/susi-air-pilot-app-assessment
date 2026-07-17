<script setup lang="ts">
/**
 * More page — profile header + grouped settings menu.
 *
 * Profile reads from the pilot store (name, pilotId, totalFlightHours).
 * Settings groups (Account / Preferences / About) are built from the
 * SettingsListItem molecule. Every row is wired to a real surface:
 *   - Notifications → NotificationPrefsSheet
 *   - Documents    → /documents page
 *   - Appearance    → AppearanceSheet (light/dark/system)
 *   - Licenses     → LicensesSheet
 *   - Sign out     → returns to / (per brief, no real auth)
 *
 * Language is intentionally cut — see .omo/demo-expansion-plan.md.
 */
import { navigateTo } from '#app'
import { usePilotStore } from '~/stores/pilot'
import { useSchedulesStore } from '~/stores/schedules'
import { useDocumentsStore } from '~/stores/documents'

definePageMeta({ layout: 'default' })

const pilotStore = usePilotStore()
const schedulesStore = useSchedulesStore()
const documentsStore = useDocumentsStore()
const FLIGHT_HOURS_TODAY = '2026-05-31'
const demoTimeline = useDemoTimeline(() => ({
  scheduleToday: schedulesStore.today,
  documentsToday: documentsStore.today,
  flightHoursToday: FLIGHT_HOURS_TODAY,
}))

const appVersion = 'v1.0.0'

function onSignOut() {
  useSessionStore().signOut()
  navigateTo('/')
}

const notifOpen = ref(false)
const appearanceOpen = ref(false)
const licensesOpen = ref(false)

function openDocuments() {
  navigateTo('/documents')
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

    <section class="more-page__group" aria-label="Demo and data status">
      <h2 class="more-page__group-title">Demo & data status</h2>
      <DataFreshnessStrip :timeline="demoTimeline" />
      <SyncStatusPill status="demo" :timestamp="demoTimeline.latestDataDate" />
    </section>

    <section class="more-page__group" aria-label="Account settings">
      <h2 class="more-page__group-title">Account</h2>
      <div class="more-page__group-list">
        <SettingsListItem label="Notifications" icon="bell" trailing="chevron" @click="notifOpen = true" />
        <SettingsListItem
          label="Documents"
          icon="file-text"
          trailing="chevron"
          @click="openDocuments"
        />
      </div>
    </section>

    <section class="more-page__group" aria-label="Preferences">
      <h2 class="more-page__group-title">Preferences</h2>
      <div class="more-page__group-list">
        <SettingsListItem
          label="Appearance"
          icon="info"
          trailing="chevron"
          @click="appearanceOpen = true"
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
          :badge-label="appVersion"
          badge-variant="neutral"
          disabled
        />
        <SettingsListItem
          label="Licenses"
          icon="file-text"
          trailing="chevron"
          @click="licensesOpen = true"
        />
      </div>
    </section>

    <section class="more-page__group" aria-label="Session">
      <div class="more-page__group-list">
        <SettingsListItem label="Sign out" icon="log-out" danger @click="onSignOut" />
      </div>
    </section>

    <NotificationPrefsSheet :open="notifOpen" @close="notifOpen = false" />
    <AppearanceSheet :open="appearanceOpen" @close="appearanceOpen = false" />
    <LicensesSheet :open="licensesOpen" @close="licensesOpen = false" />
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
