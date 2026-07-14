/**
 * Pure redirect decider for the auth middleware.
 *
 * Extracted from `auth.global.ts` so the decision table can be unit-tested
 * without the Nuxt runtime (`defineNuxtRouteMiddleware` / `navigateTo` are not
 * available under plain Vitest). The middleware imports and calls this.
 *
 * @param isAuthed whether the visitor has a persisted session
 * @param path     the route path being navigated to
 * @returns the path to redirect to, or `null` to allow the navigation through
 */
export function resolveAuthRedirect(isAuthed: boolean, path: string): string | null {
  if (!isAuthed && path !== '/') return '/'
  if (isAuthed && path === '/') return '/home'
  return null
}
