/**
 * Global auth middleware (client-only).
 *
 * Session lives in localStorage, so SSR cannot know whether the visitor is
 * signed in — guarding on the server would either leak a redirect flicker or
 * serve the wrong page pre-hydration. We therefore bail on the server and run
 * the decision on the client only.
 *
 * The redirect logic itself lives in the pure `resolveAuthRedirect` helper so
 * it can be unit-tested independently (see `auth.global.spec.ts`).
 */
import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useSessionStore } from '~/stores/session'
import { resolveAuthRedirect } from './resolveAuthRedirect'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const session = useSessionStore()
  const target = resolveAuthRedirect(session.isAuthenticated, to.path)
  if (target !== null) return navigateTo(target)
})
