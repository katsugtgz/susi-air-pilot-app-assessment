<script setup lang="ts">
/**
 * Dashboard (Home) — composes dashboard organisms with Pinia stores and
 * derives next-duty route, action items, and notifications via useOpsBriefing.
 */
import { usePilotStore } from '~/stores/pilot'
import { useSchedulesStore } from '~/stores/schedules'
import { navigateTo } from '#app'
import { useFlightHoursStore } from '~/stores/flightHours'
import { useDocumentsStore } from '~/stores/documents'
import { useNewsStore } from '~/stores/news'
import { useFlightLegsStore } from '~/stores/flightLegs'
import { useNotificationsStore } from '~/stores/notifications'
import type { ActionItem } from '~/composables/useOpsBriefing'
import type { Schedule } from '~/types'

definePageMeta({ layout: 'default' })

const pilotStore = usePilotStore()
const schedulesStore = useSchedulesStore()
const flightHoursStore = useFlightHoursStore()
const documentsStore = useDocumentsStore()
const newsStore = useNewsStore()
const flightLegsStore = useFlightLegsStore()
const notificationsStore = useNotificationsStore()

function onLogout() {
  // No real auth — just return to the sign-in screen.
  navigateTo('/')
}

const loading = useLoadingDelay(200)

// Per brief §3.2, the chart's dev "today" is 2026-05-31.
const FLIGHT_HOURS_TODAY = '2026-05-31'

const briefing = useOpsBriefing(() => ({
  schedules: schedulesStore.schedules,
  legsByDate: flightLegsStore.legsByDate,
  documents: documentsStore.documents,
  scheduleToday: schedulesStore.today,
  documentsToday: documentsStore.today,
  documentWarningDays: documentsStore.warningDays,
}))

const notifications = computed(() =>
  notificationsStore.resolveNotifications(briefing.value.notifications),
)

function onMarkAllRead() {
  notificationsStore.markAllRead(notifications.value.map((n) => n.id))
}

const selectedSchedule = ref<Schedule | null>(null)
const detailOpen = computed(() => selectedSchedule.value !== null)

function onFlightSelect(schedule: Schedule) {
  selectedSchedule.value = schedule
}
function onDetailClose() {
  selectedSchedule.value = null
}

const flightData = computed(() => {
  const duty = briefing.value.nextDuty
  if (duty.kind !== 'ready') {
    return { departure: '—', arrival: schedulesStore.nextUpcomingSchedule?.base_name ?? '—' }
  }
  return {
    departure: duty.departureCode,
    arrival: duty.arrivalCode,
    flightNumber: duty.flightNumber,
    std: duty.std,
    sta: duty.sta,
  }
})

function onActionNavigate(payload: { item: ActionItem; to: string }) {
  if (payload.item.kind === 'next-duty') {
    const target =
      schedulesStore.scheduleByDate.get(payload.item.date) ?? schedulesStore.nextUpcomingSchedule
    if (target) {
      selectedSchedule.value = target
      return
    }
  }
  navigateTo(payload.to)
}
</script>

<template>
  <div class="home-page">
    <DashboardHeader
      :pilot-name="pilotStore.name"
      :initials="pilotStore.initials"
      :pilot-id="pilotStore.pilotId"
      :total-flight-hours="pilotStore.totalFlightHours"
      :notifications="notifications"
      @mark-read="notificationsStore.markRead"
      @mark-all-read="onMarkAllRead"
      @logout="onLogout"
    />

    <p class="home-page__snapshot" role="status">
      Demo snapshot · Schedule {{ schedulesStore.today }} · Docs &amp; hours {{ FLIGHT_HOURS_TODAY }}
    </p>

    <section class="home-page__operations">
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
            :departure="{ icao: flightData.departure }"
            :arrival="{ icao: flightData.arrival }"
            :departure-time="flightData.std"
            :arrival-time="flightData.sta"
            :flight-number="flightData.flightNumber"
            actionable
            @select="onFlightSelect"
          />
        </div>
      </div>

      <ActionCenter :items="briefing.items" @navigate="onActionNavigate" />
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

    <DutyDetailSheet
      :open="detailOpen"
      :schedule="selectedSchedule"
      :legend="schedulesStore.legend"
      :legs-by-date="flightLegsStore.legsByDate"
      @close="onDetailClose"
    />
  </div>
</template>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0 var(--space-4);

  &__snapshot {
    margin: 0;
    font-size: var(--fs-xs);
    color: var(--color-text-muted);
    text-align: right;
  }

  &__operations {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
  }

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
}

@media (min-width: 768px) {
  .home-page__operations {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }
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
