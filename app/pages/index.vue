<script setup lang="ts">
/**
 * Sign In page — uses the auth layout (no bottom nav).
 * Submit persists a demo session (Pilot ID as the identifier) via the session
 * store, then navigates to /home. The global auth middleware guards the rest
 * of the app against unsigned-in visitors.
 */
import { navigateTo } from '#app'

definePageMeta({ layout: 'auth' })

const sessionStore = useSessionStore()

const loading = ref(false)
const error = ref('')

// Inline CRD contact alert — replaces the intimidating window.alert.
// Shown when the user clicks "Need help? Contact CRD" inside SignInForm.
const showCrdAlert = ref(false)

interface Credentials {
  pilotId: string
  password: string
}

async function onSubmit(creds: Credentials) {
  // Simulate a brief network round-trip for UX feedback, then establish the
  // session and navigate.
  loading.value = true
  error.value = ''
  try {
    await new Promise((resolve) => setTimeout(resolve, 500))
    sessionStore.signIn(creds.pilotId)
    await navigateTo('/home')
  } catch {
    loading.value = false
    error.value = 'Something went wrong. Please try again.'
  }
}

function onContactCrd() {
  showCrdAlert.value = true
}
</script>

<template>
  <div class="sign-in-page">
    <Alert
      v-if="showCrdAlert"
      variant="info"
      title="Need help?"
      dismissible
      class="sign-in-page__alert"
      @dismiss="showCrdAlert = false"
    >
      Contact the <strong>Crew Roster Desk (CRD)</strong> at
      <strong>+62 21 5590 0010</strong> — available 24/7.
    </Alert>

    <SignInForm :loading="loading" :error="error" @submit="onSubmit" @contact-crd="onContactCrd" />
  </div>
</template>

<style scoped lang="scss">
.sign-in-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  &__alert {
    width: 100%;
  }
}
</style>
