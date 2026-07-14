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

/*
 * transitions.dev — skeleton reveal (14-skeleton-reveal.md).
 * Transition / opacity / filter logic + --reveal-* / --pulse-* tokens follow
 * the reference; layers share a single grid cell (grid-area: 1 / 1) so the
 * in-flow content reserves the slot height and the crossfade is layout-free.
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
    filter var(--reveal-dur) var(--reveal-ease);
}
.t-skel-content {
  z-index: 2;
  opacity: 0;
  filter: blur(var(--reveal-blur));
  transition:
    opacity var(--reveal-dur) var(--reveal-ease),
    filter var(--reveal-dur) var(--reveal-ease);
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
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: var(--pulse-min);
  }
}

@media (prefers-reduced-motion: reduce) {
  .t-skel-skeleton,
  .t-skel-content {
    transition: none !important;
  }
  .t-skel-skeleton.is-pulsing > * {
    animation: none !important;
  }
}
</style>
