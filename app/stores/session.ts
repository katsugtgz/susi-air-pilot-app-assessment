/**
 * Session store — demo-only client-side auth state.
 *
 * Persists the signed-in pilot's identifier (the Pilot ID entered on Sign In)
 * to localStorage via `usePersistedState`, so a refresh keeps you in. There is
 * no real backend or password check; this exists purely so the demo behaves
 * like a logged-in app (route guard + sign-out).
 */
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { usePersistedState } from '~/composables/usePersistedState'

export const useSessionStore = defineStore('session', () => {
  const pilotId = usePersistedState<string | null>('session:pilotId', null)

  const isAuthenticated = computed(() => pilotId.value !== null)

  function signIn(value: string) {
    pilotId.value = value
  }

  function signOut() {
    pilotId.value = null
  }

  return { pilotId, isAuthenticated, signIn, signOut }
})
