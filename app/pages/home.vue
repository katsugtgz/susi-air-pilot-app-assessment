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
import type { NotificationItem } from '~/types'

definePageMeta({ layout: 'default' })

const pilotStore = usePilotStore()
const schedulesStore = useSchedulesStore()
const flightHoursStore = useFlightHoursStore()
const documentsStore = useDocumentsStore()
const newsStore = useNewsStore()

function onLogout() {
  // No real auth — just return to the sign-in screen.
  navigateTo('/')
}

// Dummy notifications for the bell dropdown. No backend; the brief ships
// with mock data only. Mixed read/unread so the unread badge is meaningful.
const notifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Duty starts in 2 hours',
    body: 'PDG → PLM, Airbus ATR 72-600. Report by 14:30 LT.',
    time: '12m ago',
    variant: 'info',
  },
  {
    id: 'n2',
    title: 'Schedule change',
    body: 'PKU → BTH leg added to tomorrow\'s roster.',
    time: '1h ago',
    variant: 'warning',
  },
  {
    id: 'n3',
    title: 'Medical certificate expires soon',
    body: '14 days remaining — renew before 22 July 2026.',
    time: 'Yesterday',
    variant: 'warning',
  },
  {
    id: 'n4',
    title: 'Flight log verified',
    body: 'Cruise log for flight SJO-320 has been countersigned.',
    time: '2 days ago',
    read: true,
    variant: 'success',
  },
]

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
      :pilot-id="pilotStore.pilotId"
      :total-flight-hours="pilotStore.totalFlightHours"
      :notifications="notifications"
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
        <div v-if="loading" key="skeleton" class="home-page__skeleton-hours">
          <Skeleton variant="rect" :height="40" radius="24" :width="220" />
          <Skeleton variant="rect" :height="180" />
          <div class="home-page__skeleton-cards">
            <Skeleton variant="rect" :height="140" />
            <Skeleton variant="rect" :height="140" />
            <Skeleton variant="rect" :height="140" />
            <Skeleton variant="rect" :height="140" />
          </div>
        </div>
        <LazyHoursToLimitSection
          v-else
          key="content"
          :flight-hours="flightHoursStore.flightHours"
          :limits="flightHoursStore.limits"
          :chart-bounds="flightHoursStore.chartBounds"
          :today="FLIGHT_HOURS_TODAY"
        >
          <template #fallback>
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

  &__skeleton-hours {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    background: var(--color-surface);
    border-radius: var(--radius-card);
    padding: var(--space-4);
  }

  &__skeleton-cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
  }
}

/*
 * transitions.dev — skeleton reveal (14-skeleton-reveal.md).
 * The transition / opacity / filter logic + --reveal-* / --pulse-* tokens
 * follow the reference. The stacking primitive is a single grid cell
 * (grid-area: 1 / 1) instead of position:absolute so the in-flow content
 * always reserves the slot height → the skeleton ↔ content swap is
 * layout-free (no reflow on reveal). Content sits on z-index: 2.
 */
.t-skel {
  display: grid;
}
.t-skel-skeleton,
.t-skel-content {
  grid-area: 1 / 1;
  min-width: 0;
}
.t-skel-skeleton {
  z-index: 1;
  opacity: 1;
  filter: blur(0);
  transition:
    opacity var(--reveal-dur) var(--reveal-ease),
    filter  var(--reveal-dur) var(--reveal-ease);
}
.t-skel-content {
  z-index: 2;
  opacity: 0;
  filter: blur(var(--reveal-blur));
  transition:
    opacity var(--reveal-dur) var(--reveal-ease),
    filter  var(--reveal-dur) var(--reveal-ease);
}
.t-skel.is-revealed .t-skel-skeleton {
  opacity: 0;
  filter: blur(var(--reveal-blur));
}
.t-skel.is-revealed .t-skel-content {
  opacity: 1;
  filter: blur(0);
}
// The invisible layer must not swallow taps: content sits above the skeleton
// (z-index 2) even while opacity: 0, and opacity doesn't disable hit-testing.
.t-skel:not(.is-revealed) .t-skel-content,
.t-skel.is-revealed .t-skel-skeleton {
  pointer-events: none;
}
.t-skel.is-resetting .t-skel-skeleton,
.t-skel.is-resetting .t-skel-content {
  transition: none !important;
}

.t-skel-skeleton.is-pulsing > * {
  animation: t-skel-pulse var(--pulse-dur) ease-in-out var(--pulse-count);
}
@keyframes t-skel-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: var(--pulse-min); }
}

@media (prefers-reduced-motion: reduce) {
  .t-skel-skeleton, .t-skel-content {
    transition: none !important;
  }
  .t-skel-skeleton.is-pulsing > * { animation: none !important; }
}

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
