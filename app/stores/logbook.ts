/**
 * Logbook store — user-created logbook entries, persisted to localStorage via
 * `usePersistedState('logbook-entries', [])`. This is the one piece of pilot
 * state that survives a reload; schedule-derived logbook rows come from the
 * schedules store + the pure `useLogbookEntries` composable.
 */
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { usePersistedState } from '~/composables/usePersistedState'
import type { UserLogbookEntry } from '~/types'

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useLogbookStore = defineStore('logbook', () => {
  const entries = usePersistedState<UserLogbookEntry[]>('logbook-entries', [])

  const count = computed(() => entries.value.length)

  function addEntry(input: Omit<UserLogbookEntry, 'id'>): UserLogbookEntry {
    const entry: UserLogbookEntry = { id: createId(), ...input }
    entries.value = [...entries.value, entry]
    return entry
  }

  function clear(): void {
    entries.value = []
  }

  return { entries, count, addEntry, clear }
})
