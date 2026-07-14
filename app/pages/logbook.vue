<script setup lang="ts">
/**
 * Logbook page — summary strip + per-month sections of qualifying logbook
 * entries (schedules with count_logbooks > 0) plus any user-created entries
 * persisted in the logbook store. Each row shows date, duty-type badge tinted
 * from the legend colour, base, flight counts, and a verified / pending icon.
 * User-created rows render their route + aircraft with a subtle highlight.
 *
 * Schedule data comes from the schedules store, pilot base hours from the
 * pilot store, and user entries from the persisted logbook store — merged via
 * the pure `useLogbookEntries` composable so the page stays a thin root.
 */
import { useSchedulesStore } from '~/stores/schedules'
import { usePilotStore } from '~/stores/pilot'
import { useLogbookStore } from '~/stores/logbook'
import { roundHours } from '~/utils/format'
import type { UserLogbookEntry } from '~/types'

definePageMeta({ layout: 'default' })

const schedulesStore = useSchedulesStore()
const pilotStore = usePilotStore()
const logbookStore = useLogbookStore()

const loading = useLoadingDelay(200)

const entrySheetOpen = ref(false)

const logbook = useLogbookEntries(
  () => schedulesStore.schedules,
  () => schedulesStore.legend,
  () => logbookStore.entries,
)

const totalFlightHours = computed(() =>
  roundHours(pilotStore.totalFlightHours + logbook.value.totals.hours),
)

function onSubmitEntry(payload: Omit<UserLogbookEntry, 'id'>): void {
  logbookStore.addEntry(payload)
  entrySheetOpen.value = false
}

function formattedDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * The brief permits the badge colour to be derived from the legend colour.
 * chart.js needs raw hex; here we paint the badge text + tinted background via
 * an inline CSS variable so WCAG contrast is preserved (Badge already ships a
 * AA-tested colour palette — we only change the foreground colour to match the
 * duty legend, and lighten the background to a low-opacity tint of the same
 * hue so the text remains legible).
 */
function badgeStyle(color: string): Record<string, string> {
  return { '--duty-color': color }
}
</script>

<template>
  <div class="logbook-page">
    <header class="logbook-page__header">
      <h1 class="logbook-page__title">Logbook</h1>
      <BaseButton variant="primary" size="sm" @click="entrySheetOpen = true">
        <template #icon><Icon name="file-text" :size="16" decorative /></template>
        Log flight
      </BaseButton>
    </header>

    <div class="t-skel" :class="{ 'is-revealed': !loading }">
      <div class="t-skel-skeleton is-pulsing">
        <div class="logbook-page__skeleton-summary">
          <Skeleton variant="rect" :height="76" radius="14" />
        </div>
        <div class="logbook-page__skeleton-rows">
          <Skeleton v-for="i in 6" :key="i" variant="rect" :height="56" radius="12" />
        </div>
      </div>

      <div class="t-skel-content">
        <section class="logbook-page__summary" aria-label="Logbook summary">
          <div class="logbook-page__summary-item">
            <span class="logbook-page__summary-value">{{ logbook.totals.entries }}</span>
            <span class="logbook-page__summary-label">Logbook entries</span>
          </div>
          <div class="logbook-page__summary-divider" />
          <div class="logbook-page__summary-item">
            <span class="logbook-page__summary-value">{{ logbook.totals.verified }}</span>
            <span class="logbook-page__summary-label">Verified</span>
          </div>
          <div class="logbook-page__summary-divider" />
          <div class="logbook-page__summary-item">
            <span class="logbook-page__summary-value">
              {{ totalFlightHours.toLocaleString('en-US') }}
            </span>
            <span class="logbook-page__summary-label">Flight hours</span>
          </div>
        </section>

        <p v-if="logbook.groups.length === 0" class="logbook-page__empty">
          No logbook entries yet.
        </p>

        <section
          v-for="group in logbook.groups"
          :key="group.key"
          class="logbook-page__group"
          :aria-label="`Logbook entries for ${group.label}`"
        >
          <h2 class="logbook-page__group-title">{{ group.label }}</h2>
          <ul class="logbook-page__rows">
            <li
              v-for="(row, i) in group.rows"
              :key="`${group.key}-${i}`"
              class="logbook-page__row"
              :class="{ 'logbook-page__row--user': row.isUserEntry }"
            >
              <div class="logbook-page__row-main">
                <span class="logbook-page__row-date">{{ formattedDate(row.dutyDate) }}</span>
                <template v-if="row.isUserEntry">
                  <span class="logbook-page__row-route">{{ row.route }}</span>
                  <span class="logbook-page__row-aircraft">{{ row.aircraft }}</span>
                </template>
                <template v-else>
                  <span class="logbook-page__row-duty" :style="badgeStyle(row.dutyColor)">{{
                    row.dutyLabel
                  }}</span>
                  <span class="logbook-page__row-base">{{ row.baseName }}</span>
                </template>
              </div>
              <div class="logbook-page__row-meta">
                <span v-if="row.isUserEntry" class="logbook-page__row-block">{{
                  row.blockTime
                }}</span>
                <span v-else class="logbook-page__row-counts">
                  {{ row.countLogbooks }}/{{ row.countSchedules }} flights
                </span>
                <span class="logbook-page__row-status">
                  <Icon v-if="row.verified" name="check-circle" :size="18" decorative />
                  <Icon v-else name="clock" :size="18" decorative />
                  <span class="logbook-page__row-status-text">
                    {{ row.verified ? 'Verified' : 'Pending' }}
                  </span>
                </span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <LogbookEntrySheet
      :open="entrySheetOpen"
      :default-date="schedulesStore.today"
      @close="entrySheetOpen = false"
      @submit="onSubmitEntry"
    />
  </div>
</template>

<style scoped lang="scss">
.logbook-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0 var(--space-4) var(--space-4);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) 0 var(--space-1);
  }

  &__title {
    margin: 0;
    font-size: var(--fs-2xl);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
  }

  &__summary {
    display: flex;
    align-items: stretch;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-sm);
  }

  &__summary-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 0;
  }

  &__summary-divider {
    width: 1px;
    background: var(--color-border);
  }

  &__summary-value {
    font-size: var(--fs-md);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
    white-space: nowrap;
  }

  &__summary-label {
    font-size: var(--fs-xs);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__empty {
    margin: var(--space-6) 0;
    text-align: center;
    color: var(--color-text-secondary);
    font-size: var(--fs-base);
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__group-title {
    margin: 0;
    padding: 0 var(--space-2);
    font-size: var(--fs-sm);
    font-weight: var(--fw-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-3);
    background: var(--color-surface);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-xs);
  }

  &__row-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__row-date {
    font-size: var(--fs-base-sm);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
  }

  &__row-duty {
    align-self: flex-start;
    padding: 1px var(--space-2);
    border-radius: var(--radius-full);
    font-size: var(--fs-xs);
    font-weight: var(--fw-semibold);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--duty-color, var(--color-text-secondary));
    background: color-mix(in srgb, var(--duty-color, var(--color-text-secondary)) 12%, transparent);
  }

  &__row-base {
    font-size: var(--fs-xs);
    color: var(--color-text-secondary);
    font-weight: var(--fw-medium);
  }

  &__row--user {
    border-left: 3px solid var(--color-success);
    background: color-mix(in srgb, var(--color-success) 6%, var(--color-surface));
  }

  &__row-route {
    font-size: var(--fs-base-sm);
    font-weight: var(--fw-semibold);
    color: var(--color-text-primary);
  }

  &__row-aircraft {
    font-size: var(--fs-xs);
    color: var(--color-text-muted);
  }

  &__row-block {
    font-size: var(--fs-xs);
    color: var(--color-text-secondary);
    font-weight: var(--fw-semibold);
    font-variant-numeric: tabular-nums;
  }

  &__row-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    flex-shrink: 0;
  }

  &__row-counts {
    font-size: var(--fs-xs);
    color: var(--color-text-secondary);
    font-weight: var(--fw-semibold);
  }

  &__row-status {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--fs-xs);
    color: var(--color-text-secondary);
  }

  &__row-status-text {
    white-space: nowrap;
  }

  &__skeleton-summary {
    margin-bottom: var(--space-3);
  }

  &__skeleton-rows {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
}

/*
 * transitions.dev — skeleton reveal (14-skeleton-reveal.md). Same pattern as
 * Home/Schedule: single grid cell so the swap is layout-free.
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
