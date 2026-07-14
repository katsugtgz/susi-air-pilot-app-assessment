<script setup lang="ts">
/**
 * DutyDetailSheet
 *
 * Real day-detail sheet for the schedule calendar, built on `BottomSheet`.
 * Replaces the old "Detail page coming soon" placeholder modal.
 *
 * Duty days (legs present) list each sector — flight number, route, STD/STA,
 * aircraft, block time — with a check on logged legs and a "Not logged" hint
 * on the rest. Non-duty days (RLV/SCK/TRD/TRX/MED…) render a friendly empty
 * state labelled from `legend[]`. Duty codes are NEVER hardcoded — the label
 * and colour resolve from the legend prop by the schedule's `duty_type`.
 *
 * Semi-smart organism: data flows in via props, the pure `useDutyDetail`
 * composable derives legs + logged flags. No store access.
 */
import type { FlightLeg, Legend, Schedule } from '~/types'

interface Props {
  open: boolean
  schedule: Schedule | null
  legend: Legend[]
  legsByDate: Record<string, FlightLeg[]>
}
const props = defineProps<Props>()

const emit = defineEmits<{ (e: 'close'): void }>()

const detail = useDutyDetail(
  () => props.schedule,
  () => props.legsByDate,
)

const legendByCode = computed<Record<string, Legend>>(() => {
  const map: Record<string, Legend> = {}
  for (const entry of props.legend) map[entry.code] = entry
  return map
})

const dutyLabel = computed(() => {
  const code = detail.value.dutyType
  if (!code) return ''
  return legendByCode.value[code]?.label ?? code
})

const dutyColor = computed(() => {
  const code = detail.value.dutyType
  const fromLegend = code ? legendByCode.value[code]?.color : undefined
  return fromLegend ?? props.schedule?.base_color ?? ''
})

const statusLabel = computed(() => {
  if (!props.schedule) return ''
  return props.schedule.status === 2 ? 'Completed' : 'Upcoming'
})

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const titleText = computed(() => {
  const iso = detail.value.dutyDate
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso || 'Day detail'
  const [, y, mo, d] = m
  return `${Number(d)} ${MONTHS[Number(mo) - 1]} ${y}`
})

const loggedFooter = computed(() => {
  const { loggedCount, totalLegs } = detail.value
  if (totalLegs === 0) return ''
  const noun = totalLegs === 1 ? 'flight' : 'flights'
  return `${loggedCount} of ${totalLegs} ${noun} logged`
})

function chipStyle(color: string): Record<string, string> {
  return color ? { '--duty-color': color } : {}
}
</script>

<template>
  <BottomSheet :open="open" :title="titleText" aria-label="Duty day detail" @close="emit('close')">
    <div class="duty-detail">
      <div v-if="dutyLabel || statusLabel" class="duty-detail__meta">
        <span v-if="dutyLabel" class="duty-detail__chip" :style="chipStyle(dutyColor)">{{
          dutyLabel
        }}</span>
        <span v-if="statusLabel" class="duty-detail__status">{{ statusLabel }}</span>
      </div>

      <ul v-if="detail.isDutyDay" class="duty-detail__legs">
        <li
          v-for="(leg, i) in detail.legs"
          :key="`${leg.flightNumber}-${i}`"
          class="duty-detail__leg"
          :class="{ 'duty-detail__leg--logged': leg.isLogged }"
        >
          <div class="duty-detail__leg-head">
            <span class="duty-detail__flightno">{{ leg.flightNumber }}</span>
            <span class="duty-detail__route">{{ leg.from }} → {{ leg.to }}</span>
          </div>
          <div class="duty-detail__leg-body">
            <span class="duty-detail__times">{{ leg.std }} – {{ leg.sta }}</span>
            <span class="duty-detail__aircraft">{{ leg.aircraft }}</span>
            <span class="duty-detail__block">{{ leg.blockTime }}</span>
          </div>
          <span class="duty-detail__leg-status">
            <Icon v-if="leg.isLogged" name="check" :size="16" decorative />
            <span v-else class="duty-detail__not-logged">
              <Icon name="clock" :size="14" decorative />
              Not logged
            </span>
          </span>
        </li>
      </ul>

      <div v-else class="duty-detail__empty">
        <Icon name="info" :size="24" decorative />
        <p v-if="dutyLabel" class="duty-detail__empty-text">
          {{ dutyLabel }} — no flights this day.
        </p>
        <p v-else class="duty-detail__empty-text">No duty scheduled.</p>
      </div>
    </div>

    <template v-if="detail.isDutyDay && loggedFooter" #footer>
      <p class="duty-detail__footer">{{ loggedFooter }}</p>
    </template>
  </BottomSheet>
</template>

<style scoped lang="scss">
.duty-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    padding: 2px var(--space-2);
    border-radius: var(--radius-full);
    font-size: var(--fs-xs);
    font-weight: var(--fw-semibold);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--duty-color, var(--color-text-secondary));
    background: color-mix(in srgb, var(--duty-color, var(--color-text-secondary)) 12%, transparent);
  }

  &__status {
    font-size: var(--fs-xs);
    color: var(--color-text-secondary);
    font-weight: var(--fw-medium);
  }

  &__legs {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__leg {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    gap: var(--space-1) var(--space-3);
    padding: var(--space-3);
    background: var(--color-surface);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-xs);
  }

  &__leg-head {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  &__flightno {
    font-size: var(--fs-base-sm);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
    letter-spacing: 0.02em;
  }

  &__route {
    font-size: var(--fs-md);
    font-weight: var(--fw-semibold);
    color: var(--color-text-primary);
  }

  &__leg-body {
    grid-column: 1;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    font-size: var(--fs-xs);
    color: var(--color-text-secondary);
  }

  &__times {
    font-variant-numeric: tabular-nums;
    font-weight: var(--fw-medium);
  }

  &__aircraft {
    color: var(--color-text-muted);
  }

  &__block {
    font-variant-numeric: tabular-nums;
  }

  &__leg-status {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
    color: var(--color-success);
    display: inline-flex;
    align-items: center;
  }

  &__leg--logged &__leg-status {
    color: var(--color-success);
  }

  &__not-logged {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--color-text-muted);
    font-size: var(--fs-xs);
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-6) var(--space-4);
    text-align: center;
    color: var(--color-text-secondary);
  }

  &__empty-text {
    margin: 0;
    font-size: var(--fs-base);
    color: var(--color-text-secondary);
  }

  &__footer {
    margin: 0;
    text-align: center;
    font-size: var(--fs-sm);
    color: var(--color-text-secondary);
    font-weight: var(--fw-medium);
  }
}
</style>
