<script setup lang="ts">
/**
 * Dashboard (Home) — composes the 5 dashboard organisms with data from
 * 5 Pinia stores. All mock data; no fetches.
 *
 * Reference "today" for flight hours is 2026-05-31 (per brief §3.2), while
 * schedules use their own today (2026-05-15) from mock-schedules.json.
 *
 * Phase 6: data is gated by useLoadingDelay so skeletons are demonstrable.
 */
import { usePilotStore } from '~/stores/pilot'
import { useSchedulesStore } from '~/stores/schedules'
import { navigateTo } from '#app'
import { useFlightHoursStore } from '~/stores/flightHours'
import { useDocumentsStore } from '~/stores/documents'
import { useNewsStore } from '~/stores/news'
import { useNotificationsStore } from '~/stores/notifications'

definePageMeta({ layout: 'default' })

const pilotStore = usePilotStore()
const schedulesStore = useSchedulesStore()
const flightHoursStore = useFlightHoursStore()
const documentsStore = useDocumentsStore()
const newsStore = useNewsStore()
const notificationsStore = useNotificationsStore()

function onLogout() {
  // No real auth — just return to the sign-in screen.
  navigateTo('/')
}

const loading = useLoadingDelay(200)

// Per brief §3.2, the chart's dev "today" is 2026-05-31.
const FLIGHT_HOURS_TODAY = '2026-05-31'

// Decode the next upcoming schedule's base_name into a fake departure/arrival
// pair. The mock doesn't include route legs, so we surface the duty's base
// as the arrival and Padang (PDG) as the canonical departure.
const upcomingDeparture = computed(() => ({ icao: 'PDG', city: 'Padang' }))
const upcomingArrival = computed(() => {
  const next = schedulesStore.nextUpcomingSchedule
  return next ? { icao: next.base_name } : { icao: '—' }
})
</script>

<template>
  <div class="home-page">
    <DashboardHeader
      :pilot-name="pilotStore.name"
      :initials="pilotStore.initials"
      :pilot-id="pilotStore.pilotId"
      :total-flight-hours="pilotStore.totalFlightHours"
      :notifications="notificationsStore.notifications"
      @mark-read="notificationsStore.markRead"
      @mark-all-read="notificationsStore.markAllRead"
      @logout="onLogout"
    />

    <section class="home-page__section">
      <div class="t-skel" :class="{ 'is-revealed': !loading }">
        <div class="t-skel-skeleton is-pulsing">
          <div class="home-page__skeleton-card">
            <Skeleton variant="rect" :height="140" />
          </div>
        </div>
        <div class="t-skel-content">
          <UpcomingFlightCard
            v-if="schedulesStore.nextUpcomingSchedule"
            :schedule="schedulesStore.nextUpcomingSchedule"
            :departure="upcomingDeparture"
            :arrival="upcomingArrival"
          />
        </div>
      </div>
    </section>

    <section class="home-page__section">
      <div class="t-skel" :class="{ 'is-revealed': !loading }">
        <div class="t-skel-skeleton is-pulsing">
          <h2 class="home-page__skeleton-title"><Skeleton variant="text" :width="120" :height="18" /></h2>
          <div class="home-page__skeleton-news">
            <Skeleton variant="rect" :height="220" radius="14" />
            <Skeleton variant="rect" :height="220" radius="14" />
          </div>
        </div>
        <div class="t-skel-content">
          <LatestNewsCarousel :items="newsStore.items" />
        </div>
      </div>
    </section>

    <section class="home-page__section">
      <Transition name="chart-crossfade" mode="out-in">
        <HoursSkeleton v-if="loading" key="skeleton" />
        <LazyHoursToLimitSection
          v-else
          key="content"
          :flight-hours="flightHoursStore.flightHours"
          :limits="flightHoursStore.limits"
          :chart-bounds="flightHoursStore.chartBounds"
          :today="FLIGHT_HOURS_TODAY"
        >
          <template #fallback>
            <HoursSkeleton />
          </template>
        </LazyHoursToLimitSection>
      </Transition>
    </section>

    <section class="home-page__section">
      <MyDocumentsList
        :documents="documentsStore.documents"
        :today="documentsStore.today"
        :warning-days="documentsStore.warningDays"
      />
    </section>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0 var(--space-4);

  &__section {
    width: 100%;
  }

  &__skeleton-card {
    background: var(--color-surface);
    border-radius: var(--radius-card);
    overflow: hidden;
    padding: var(--space-4);
  }

  &__skeleton-title {
    margin: 0 0 var(--space-3) var(--space-2);
  }

  &__skeleton-news {
    display: flex;
    gap: var(--space-3);
    overflow: hidden;
  }

  /* __skeleton-hours / __skeleton-cards moved to HoursSkeleton.vue */
}

/* t-skel reveal lives in transitions-root.css (global). */

.chart-crossfade-enter-active,
.chart-crossfade-leave-active {
  transition: opacity var(--reveal-dur) var(--reveal-ease);
}
.chart-crossfade-enter-from,
.chart-crossfade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .chart-crossfade-enter-active,
  .chart-crossfade-leave-active {
    transition: none;
  }
}
</style>
