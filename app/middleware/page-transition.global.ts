/**
 * Picks the page-transition direction per navigation, mirroring the tab order
 * of the bottom nav: moving to a higher-index tab slides forward, a lower one
 * slides back, and anything off the ladder (sign-in, sign-out, unknown routes)
 * uses a plain fade.
 *
 * Runs as global route middleware so the name is set on `to.meta` *before* the
 * transition begins — the base `pageTransition` is enabled in nuxt.config, and
 * here we only override its `name`. Native Nuxt transitions coordinate with
 * layout swaps, so this survives the auth → default layout change on login.
 */
const ROUTE_ORDER: Record<string, number> = {
  '/': 0,
  '/home': 1,
  '/schedule': 2,
  '/logbook': 3,
  '/more': 4,
}

export default defineNuxtRouteMiddleware((to, from) => {
  // `pageTransition: false` (transitions disabled) — nothing to name.
  if (typeof to.meta.pageTransition === 'boolean') return

  const toOrder = ROUTE_ORDER[to.path] ?? -1
  const fromOrder = ROUTE_ORDER[from.path] ?? -1

  let name = 'page-fade'
  if (to.path !== '/' && toOrder !== -1 && fromOrder !== -1 && toOrder !== fromOrder) {
    name = toOrder > fromOrder ? 'page-forward' : 'page-back'
  }

  to.meta.pageTransition = { name, mode: 'out-in' }
})
