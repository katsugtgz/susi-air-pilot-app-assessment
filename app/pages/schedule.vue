<script setup lang="ts">
/**
 * Schedule page — month-grid calendar + legend. Tapping a day opens a real
 * DutyDetailSheet (legs + logged status for duty days, friendly empty state
 * for non-duty days), replacing the old "Detail page coming soon" placeholder.
 *
 * legsByDate is sourced from the flightLegs Pinia store (the sole consumer of
 * mock-flight-legs.json), keeping the "stores are the only JSON consumers"
 * convention.
 */
import { useSchedulesStore } from '~/stores/schedules'
import { useFlightLegsStore } from '~/stores/flightLegs'

definePageMeta({ layout: 'default' })

const schedulesStore = useSchedulesStore()
const flightLegsStore = useFlightLegsStore()

const loading = useLoadingDelay(200)

// Default yearMonth to the month of schedules.json's `today` (2026-05-15 → '2026-05').
const yearMonth = ref(schedulesStore.today.slice(0, 7))

// Tap-a-date detail sheet state.
const selectedDate = ref<string | null>(null)
const selectedSchedule = computed(() =>
  selectedDate.value ? schedulesStore.scheduleByDate.get(selectedDate.value) : undefined,
)

function onSelectDate(date: string) {
  selectedDate.value = date
}

function closeModal() {
  selectedDate.value = null
}
</script>

<template>
  <div class="schedule-page">
    <header class="schedule-page__header">
      <h1 class="schedule-page__title">Schedule</h1>
    </header>

    <div class="t-skel" :class="{ 'is-revealed': !loading }">
      <div class="t-skel-skeleton is-pulsing">
        <div class="schedule-page__skeleton-grid">
          <Skeleton variant="rect" :height="40" />
          <div class="schedule-page__skeleton-cells">
            <Skeleton v-for="i in 42" :key="i" variant="rect" :height="56" radius="12" />
          </div>
        </div>
      </div>
      <div class="t-skel-content">
        <ScheduleCalendarGrid
          class="schedule-page__grid"
          :schedules="schedulesStore.schedules"
          :legend="schedulesStore.legend"
          :year-month="yearMonth"
          :today="schedulesStore.today"
          @update:year-month="yearMonth = $event"
          @select-date="onSelectDate"
        />
      </div>
    </div>

    <ScheduleLegend
      v-if="!loading"
      class="schedule-page__legend"
      :legend="schedulesStore.legend"
      :columns="2"
    />

    <!-- Tap-a-date day detail -->
    <DutyDetailSheet
      :open="selectedDate !== null"
      :schedule="selectedSchedule ?? null"
      :legend="schedulesStore.legend"
      :legs-by-date="flightLegsStore.legsByDate"
      @close="closeModal"
    />
  </div>
</template>

<style scoped lang="scss">
.schedule-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0 var(--space-4) var(--space-4);

  &__header {
    padding: var(--space-3) 0 var(--space-1);
  }

  &__title {
    margin: 0;
    font-size: var(--fs-2xl);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
  }

  &__grid,
  &__legend {
    width: 100%;
  }

  &__skeleton-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    background: var(--color-surface);
    border-radius: var(--radius-card);
    padding: var(--space-4);
    box-shadow: var(--shadow-sm);
  }

  &__skeleton-cells {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: var(--space-1);
  }
}
/* t-skel reveal lives in transitions-root.css (global). */

</style>
