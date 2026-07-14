<script setup lang="ts">
/**
 * CalendarDay
 * One cell of the schedule month-grid. Rendered as a real <button> for
 * keyboard accessibility (Tab reaches every day; Enter/Space activates).
 *
 * - Empty (no schedule) → blank cell, optionally faded if out of month.
 * - With schedule → cell tinted by `baseColor`, base code shown underneath.
 * - Tick vs number badge:
 *     if count_logbooks === count_schedules → green tick
 *     else                                   → number badge with count_schedules
 */

interface Props {
  date?: string // ISO yyyy-mm-dd, optional (out-of-month cells may omit)
  dayNumber?: number
  baseColor?: string
  baseName?: string
  dutyType?: string
  countSchedules?: number
  countLogbooks?: number
  isToday?: boolean
  isOutOfMonth?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  countSchedules: 0,
  countLogbooks: 0,
  isToday: false,
  isOutOfMonth: false,
})

const hasSchedule = computed(() => !!props.dutyType)
const isComplete = computed(() => props.countSchedules > 0 && props.countLogbooks === props.countSchedules)

// Build a descriptive aria-label from existing props so screen-reader users
// get the same information as sighted users without parsing visual badges.
const ariaLabel = computed(() => {
  const parts: string[] = []

  // Day + month from the ISO date, or just the number if no date.
  if (props.date) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(props.date)
    if (m) {
      // Construct a LOCAL date from the parsed components — `new Date('2026-05-01')`
      // parses as UTC midnight and renders as the previous day in zones behind UTC.
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
      parts.push(d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }))
    } else if (props.dayNumber != null) {
      parts.push(String(props.dayNumber))
    }
  } else if (props.dayNumber != null) {
    parts.push(String(props.dayNumber))
  }

  if (props.isOutOfMonth) {
    parts.push('out of month')
  }

  if (props.dutyType) {
    parts.push(props.dutyType)
  }

  if (props.countSchedules > 0) {
    parts.push(`${props.countSchedules} flight${props.countSchedules === 1 ? '' : 's'}`)
    if (props.countLogbooks > 0) {
      parts.push(`${props.countLogbooks} logged`)
    }
  }

  return parts.join(', ')
})
</script>

<template>
  <button
    type="button"
    class="calendar-day"
    :class="{
      'calendar-day--out': isOutOfMonth,
      'calendar-day--today': isToday,
      'calendar-day--empty': !hasSchedule,
    }"
    :style="baseColor && hasSchedule ? { '--day-color': baseColor } : undefined"
    :aria-label="ariaLabel"
  >
    <span class="calendar-day__number">{{ dayNumber }}</span>
    <span v-if="hasSchedule && baseName" class="calendar-day__base">{{ baseName }}</span>
    <span v-if="isComplete" class="calendar-day__tick" aria-label="All flights logged">
      <Icon name="check" :size="14" :stroke-width="2.5" />
    </span>
    <span v-else-if="hasSchedule && countSchedules > 0" class="calendar-day__count">
      {{ countSchedules }}
    </span>
  </button>
</template>

<style scoped lang="scss">
.calendar-day {
  // Button reset — the semantic <button> must not inherit UA button styles.
  appearance: none;
  background: var(--day-color, var(--color-surface));
  border: 0;
  font: inherit;
  width: 100%;
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-1);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--fs-base-sm);
  font-weight: var(--fw-medium);
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  transition: transform 0.05s ease;

  &:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }

  &:active:not(.calendar-day--out) {
    transform: scale(0.97);
  }

  // When a color is set, tint the bg lightly and use a stronger bottom band
  // for legibility against the brand palette.
  &[style*='--day-color'] {
    background: color-mix(in srgb, var(--day-color) 18%, var(--color-surface));
    border: 1px solid color-mix(in srgb, var(--day-color) 35%, transparent);
  }

  &--out {
    opacity: 0.35;
    background: transparent;
    box-shadow: none;
    border: 1px dashed var(--color-border);
  }

  &--today {
    outline: 2px solid var(--color-red);
    outline-offset: -2px;
  }

  &--empty {
    background: var(--color-surface);
  }

  &__number {
    font-size: var(--fs-base-sm);
    font-weight: var(--fw-semibold);
  }

  &__base {
    font-size: var(--fs-xs);
    font-weight: var(--fw-bold);
    color: var(--color-text-secondary);
    margin-top: 2px;
    letter-spacing: 0.02em;
  }

  &__tick {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-success);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &__count {
    position: absolute;
    top: 4px;
    right: 4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: var(--radius-full);
    background: var(--color-red);
    color: #fff;
    font-size: 10px;
    font-weight: var(--fw-bold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
}
</style>
