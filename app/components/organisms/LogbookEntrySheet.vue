<script setup lang="ts">
/**
 * LogbookEntrySheet
 *
 * Form (on BottomSheet) for adding a manual logbook entry. The organism owns
 * only field state + validation — it never imports a store. On a valid submit
 * it emits `submit` with the entry payload (minus id); the page wires that to
 * the logbook store and closes the sheet.
 *
 * The date defaults to the logbook/schedules mock's own `today` (passed in via
 * prop), never the real system date — the brief's dual-today rule.
 */
import type { UserLogbookEntry } from '~/types'
import { BLOCK_TIME_RE } from '~/composables/useLogbookEntries'

type EntryPayload = Omit<UserLogbookEntry, 'id'>

interface Props {
  open: boolean
  defaultDate: string
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: EntryPayload): void
}>()

const DEFAULT_AIRCRAFT = 'PK-BVM · C208B Grand Caravan'

const form = reactive({
  date: '',
  from: '',
  to: '',
  aircraft: '',
  blockTime: '',
  remarks: '',
})

const errors = reactive({
  date: '',
  from: '',
  to: '',
  aircraft: '',
  blockTime: '',
})

function resetForm(): void {
  form.date = props.defaultDate
  form.from = ''
  form.to = ''
  form.aircraft = DEFAULT_AIRCRAFT
  form.blockTime = ''
  form.remarks = ''
  errors.date = ''
  errors.from = ''
  errors.to = ''
  errors.aircraft = ''
  errors.blockTime = ''
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) resetForm()
  },
  { immediate: true },
)

function isValidIsoDate(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return false
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return !Number.isNaN(d.getTime())
}

function validate(): boolean {
  errors.date = isValidIsoDate(form.date) ? '' : 'Enter a valid date (yyyy-mm-dd)'
  errors.from = /^[A-Z]{3}$/.test(form.from) ? '' : 'Enter a 3-letter code'
  errors.to = /^[A-Z]{3}$/.test(form.to) ? '' : 'Enter a 3-letter code'
  errors.aircraft = form.aircraft.trim() ? '' : 'Aircraft is required'
  errors.blockTime = BLOCK_TIME_RE.test(form.blockTime.trim()) ? '' : 'Format H:mm (e.g. 1:30)'
  return !errors.date && !errors.from && !errors.to && !errors.aircraft && !errors.blockTime
}

function onSubmit(): void {
  form.from = form.from.toUpperCase()
  form.to = form.to.toUpperCase()
  if (!validate()) return

  const payload: EntryPayload = {
    date: form.date,
    from: form.from,
    to: form.to,
    aircraft: form.aircraft.trim(),
    blockTime: form.blockTime.trim(),
  }
  const remarks = form.remarks.trim()
  if (remarks) payload.remarks = remarks
  emit('submit', payload)
}

function setFrom(value: string): void {
  form.from = value.toUpperCase()
  errors.from = ''
}
function setTo(value: string): void {
  form.to = value.toUpperCase()
  errors.to = ''
}
</script>

<template>
  <BottomSheet
    :open="open"
    title="Log flight"
    aria-label="Log a flight entry"
    @close="emit('close')"
  >
    <form id="logbook-entry-form" class="entry-form" @submit.prevent="onSubmit">
      <BaseInput
        label="Date"
        placeholder="yyyy-mm-dd"
        :model-value="form.date"
        :error="errors.date"
        name="date"
        @update:model-value="
          (v: string) => {
            form.date = v
            errors.date = ''
          }
        "
      />
      <div class="entry-form__row">
        <BaseInput
          label="From"
          placeholder="PDG"
          :model-value="form.from"
          :error="errors.from"
          name="from"
          @update:model-value="setFrom"
        />
        <BaseInput
          label="To"
          placeholder="RSK"
          :model-value="form.to"
          :error="errors.to"
          name="to"
          @update:model-value="setTo"
        />
      </div>
      <BaseInput
        label="Aircraft"
        :model-value="form.aircraft"
        :error="errors.aircraft"
        name="aircraft"
        @update:model-value="
          (v: string) => {
            form.aircraft = v
            errors.aircraft = ''
          }
        "
      />
      <BaseInput
        label="Block time"
        placeholder="H:mm"
        :model-value="form.blockTime"
        :error="errors.blockTime"
        hint="Out-to-in, e.g. 1:30"
        name="blockTime"
        @update:model-value="
          (v: string) => {
            form.blockTime = v
            errors.blockTime = ''
          }
        "
      />
      <BaseInput
        label="Remarks (optional)"
        :model-value="form.remarks"
        name="remarks"
        @update:model-value="
          (v: string) => {
            form.remarks = v
          }
        "
      />
    </form>

    <template #footer>
      <div class="entry-form__actions">
        <BaseButton variant="secondary" size="sm" @click="emit('close')">Cancel</BaseButton>
        <BaseButton variant="primary" size="sm" type="submit" form="logbook-entry-form">Save entry</BaseButton>
      </div>
    </template>
  </BottomSheet>
</template>

<style scoped lang="scss">
.entry-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }
}
</style>
