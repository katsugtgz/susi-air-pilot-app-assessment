<script setup lang="ts">
// Dashboard — composes dashboard organisms with Pinia stores. Mock data only.
import { usePilotStore } from '~/stores/pilot'
import { useSchedulesStore } from '~/stores/schedules'
import { navigateTo } from '#app'
import { useFlightHoursStore } from '~/stores/flightHours'
import { useDocumentsStore } from '~/stores/documents'
import { useNewsStore } from '~/stores/news'
import { useFlightLegsStore } from '~/stores/flightLegs'
import type { ActionItem } from '~/composables/useActionItems'
import type { Schedule } from '~/types'

definePageMeta({ layout: 'default' })

const pilotStore = usePilotStore()
const schedulesStore = useSchedulesStore()
const flightHoursStore = useFlightHoursStore()
const documentsStore = useDocumentsStore()
const newsStore = useNewsStore()
const flightLegsStore = useFlightLegsStore()

function onLogout() { navigateTo('/') }
const loading = useLoadingDelay(200)
const FLIGHT_HOURS_TODAY = '2026-05-31'

const demoTimeline = useDemoTimeline(() => ({
  scheduleToday: schedulesStore.today,
  documentsToday: documentsStore.today,
  flightHoursToday: FLIGHT_HOURS_TODAY,
}))

const upcomingDuty = useUpcomingDutyPreview(() => ({
  schedules: schedulesStore.schedules,
  legsByDate: flightLegsStore.legsByDate,
  today: schedulesStore.today,
}))

const actionItems = useActionItems(() => ({
  schedules: schedulesStore.schedules,
  legsByDate: flightLegsStore.legsByDate,
  documents: documentsStore.documents,
  scheduleToday: schedulesStore.today,
  documentsToday: documentsStore.today,
  documentWarningDays: documentsStore.warningDays,
}))

const notifications = computed(() => [...actionItems.value.notifications])
const selectedSchedule = ref<Schedule | null>(null)
const detailOpen = computed(() => selectedSchedule.value !== null)

function onFlightSelect(schedule: Schedule) {
  selectedSchedule.value = schedule
}
function onDetailClose() {
  selectedSchedule.value = null
}

const flightData = computed(() => {
  const duty = upcomingDuty.value
  if (duty.kind !== 'ready') return { departure: '—', arrival: schedulesStore.nextUpcomingSchedule?.base_name ?? '—' }
  return {
    departure: duty.departureCode,
    arrival: duty.arrivalCode,
    flightNumber: duty.flightNumber,
    std: duty.std,
    sta: duty.sta,
  }
})

function onActionNavigate(payload: { item: ActionItem; to: string }) {
  if (payload.item.kind === 'next-duty' && schedulesStore.nextUpcomingSchedule) {
    selectedSchedule.value = schedulesStore.nextUpcomingSchedule
    return
  }
  navigateTo(payload.to)
}
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
      <DataFreshnessStrip :timeline="demoTimeline" />
    </section>

    <section class="home-page__section home-page__section--status">
      <SyncStatusPill status="demo" :timestamp="demoTimeline.latestDataDate" />
    </section>

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

      <ActionCenter :items="actionItems.items" @navigate="onActionNavigate" />
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

  &__section {
    width: 100%;

    &--status {
      display: flex;
      justify-content: flex-end;
    }
  }

  &__operations {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
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

@media (min-width: 768px) {
  .home-page__operations {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }
}
</style>
