<script setup lang="ts">
/**
 * Schedule page — month-grid calendar + legend. Tap-a-date surfaces a
 * placeholder modal per brief §5 ("Detail page coming soon").
 */
import { useSchedulesStore } from '~/stores/schedules'

definePageMeta({ layout: 'default' })

const schedulesStore = useSchedulesStore()

const loading = useLoadingDelay(400)

// Default yearMonth to the month of schedules.json's `today` (2026-05-15 → '2026-05').
const yearMonth = ref(schedulesStore.today.slice(0, 7))

// Tap-a-date placeholder modal state.
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

    <!-- Tap-a-date placeholder modal -->
    <Transition name="modal">
      <div v-if="selectedDate" class="schedule-page__modal-backdrop" @click.self="closeModal">
        <div class="schedule-page__modal" role="dialog" aria-modal="true">
          <header class="schedule-page__modal-header">
            <h2 class="schedule-page__modal-title">{{ selectedDate }}</h2>
            <button
              type="button"
              class="schedule-page__modal-close"
              aria-label="Close"
              @click="closeModal"
            >
              ×
            </button>
          </header>
          <div class="schedule-page__modal-body">
            <p v-if="selectedSchedule" class="schedule-page__modal-text">
              {{ selectedSchedule.base_name }} · {{ selectedSchedule.duty_type }} ·
              {{ selectedSchedule.count_schedules }} duty/duties planned
            </p>
            <p v-else class="schedule-page__modal-text">No duty scheduled.</p>
            <p class="schedule-page__modal-coming-soon">Detail page coming soon.</p>
          </div>
        </div>
      </div>
    </Transition>
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

  // Modal
  &__modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(14, 33, 56, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    z-index: 100;
  }

  &__modal {
    width: 100%;
    max-width: 360px;
    background: var(--color-surface);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    transform-origin: center;
    will-change: transform, opacity;
  }

  &__modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  &__modal-title {
    margin: 0;
    font-size: var(--fs-md);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
  }

  &__modal-close {
    background: transparent;
    border: 0;
    font-size: 24px;
    line-height: 1;
    color: var(--color-text-secondary);
    cursor: pointer;

    &:hover {
      color: var(--color-text-primary);
    }
  }

  &__modal-body {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__modal-text {
    margin: 0;
    font-size: var(--fs-base);
    color: var(--color-text-primary);
  }

  &__modal-coming-soon {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--color-text-secondary);
    font-style: italic;
  }
}

.modal-enter-active {
  transition: opacity var(--modal-open-dur) var(--modal-ease);
}
.modal-leave-active {
  transition: opacity var(--modal-close-dur) var(--modal-ease);
}
.modal-enter-active .schedule-page__modal {
  transition:
    transform var(--modal-open-dur) var(--modal-ease),
    opacity   var(--modal-open-dur) var(--modal-ease);
}
.modal-leave-active .schedule-page__modal {
  transition:
    transform var(--modal-close-dur) var(--modal-ease),
    opacity   var(--modal-close-dur) var(--modal-ease);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .schedule-page__modal {
  transform: scale(var(--modal-scale));
  opacity: 0;
}
.modal-leave-to .schedule-page__modal {
  transform: scale(var(--modal-scale-close));
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .schedule-page__modal,
  .modal-leave-active .schedule-page__modal {
    transition: none !important;
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
</style>
