<script setup lang="ts">
/**
 * UpcomingFlightCard
 * Surfaces the next duty on the dashboard. Renders route + times + status.
 * No auth/store dependency — fully presentational.
 */
import type { Schedule } from '~/types'

interface Props {
  schedule: Schedule
  /** Departure + arrival ICAO/city context for the FlightRoute molecule. */
  departure?: { icao: string; city?: string }
  arrival?: { icao: string; city?: string }
  /** Optional formatted times to display under the route. */
  departureTime?: string
  arrivalTime?: string
  /** Optional flight number for the route header. */
  flightNumber?: string
  /** Makes the card a keyboard-accessible button that opens duty details. */
  actionable?: boolean
}
const props = withDefaults(defineProps<Props>(), {})

const emit = defineEmits<{ (e: 'select', payload: Schedule): void }>()

const statusVariant = computed<'safe' | 'neutral'>(() =>
  props.schedule.status === 2 ? 'safe' : 'neutral',
)
const statusLabel = computed(() => (props.schedule.status === 2 ? 'Verified' : 'Upcoming'))

const actionLabel = computed(() => {
  const from = props.departure?.icao ?? props.schedule.base_name
  const to = props.arrival?.icao ?? props.schedule.base_name
  return `Open next duty details, ${from} to ${to}`
})

function onSelect() {
  if (!props.actionable) return
  emit('select', props.schedule)
}
</script>

<template>
  <article
    class="upcoming-flight-card"
    :class="{ 'upcoming-flight-card--actionable': actionable }"
  >
    <button
      v-if="actionable"
      type="button"
      class="upcoming-flight-card__action"
      :aria-label="actionLabel"
      @click="onSelect"
    />
    <header class="upcoming-flight-card__header">
      <span class="upcoming-flight-card__label">Next duty</span>
      <Badge :variant="statusVariant" :label="statusLabel" />
    </header>

    <FlightRoute
      :departure="departure ?? { icao: schedule.base_name }"
      :arrival="arrival ?? { icao: schedule.base_name }"
      :flight-number="flightNumber"
    />

    <footer v-if="departureTime || arrivalTime" class="upcoming-flight-card__times">
      <div class="upcoming-flight-card__time">
        <span class="upcoming-flight-card__time-label">Dep</span>
        <span class="upcoming-flight-card__time-value">{{ departureTime ?? '—' }}</span>
      </div>
      <div class="upcoming-flight-card__time upcoming-flight-card__time--arr">
        <span class="upcoming-flight-card__time-label">Arr</span>
        <span class="upcoming-flight-card__time-value">{{ arrivalTime ?? '—' }}</span>
      </div>
    </footer>
  </article>
</template>

<style scoped lang="scss">
.upcoming-flight-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  position: relative;
  background: var(--color-surface);
  border: 0;
  border-radius: var(--radius-card);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  color: inherit;
  font: inherit;
  text-align: left;
  transition: box-shadow 0.15s ease, transform 0.05s ease;

  &--actionable {
    cursor: pointer;
  }

  // Overlay button keeps the card keyboard-accessible without nesting flow
  // content (header/div/footer) inside a <button>, which is invalid HTML.
  // Press + focus states reflect on the card via :has().
  &:has(.upcoming-flight-card__action:active) {
    transform: translateY(0.5px);
    box-shadow: var(--shadow-xs);
  }

  &:has(.upcoming-flight-card__action:focus-visible) {
    outline: none;
    box-shadow: var(--shadow-focus);
  }

  &__action {
    position: absolute;
    inset: 0;
    border: 0;
    padding: 0;
    margin: 0;
    background: transparent;
    border-radius: inherit;
    cursor: pointer;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  &__label {
    font-size: var(--fs-base-sm);
    font-weight: var(--fw-semibold);
    color: var(--color-text-secondary);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  &__times {
    display: flex;
    justify-content: space-between;
    gap: var(--space-4);
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border);
  }

  &__time {
    display: flex;
    flex-direction: column;
    line-height: 1.2;

    &--arr {
      text-align: right;
      align-items: flex-end;
    }
  }

  &__time-label {
    font-size: var(--fs-xs);
    color: var(--color-text-muted);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  &__time-value {
    font-size: var(--fs-md);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
    margin-top: 2px;
  }
}
</style>
