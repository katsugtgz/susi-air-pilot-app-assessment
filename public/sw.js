/**
 * Susi Air Pilot App — service worker.
 *
 * Strategy: cache-first for hashed build assets + precached shell,
 * network-first for navigations (falls back to cached shell when offline).
 *
 * On `activate`, old caches (any name not matching the current version)
 * are evicted. Bump CACHE_VERSION when shipping breaking changes.
 */

const CACHE_VERSION = 'v1'
const SHELL_CACHE = `susi-air-shell-${CACHE_VERSION}`
const RUNTIME_CACHE = `susi-air-runtime-${CACHE_VERSION}`

// Resources precached on install. Hashed build assets (/_nuxt/*.{js,css})
// are immutable so caching them aggressively is safe.
const PRECACHE_URLS = ['/', '/manifest.webmanifest', '/susi-air-logo.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.flatMap((key) =>
            ![SHELL_CACHE, RUNTIME_CACHE].includes(key) ? [caches.delete(key)] : [],
          )
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET; let the browser deal with POST etc.
  if (request.method !== 'GET') return

  // Same-origin only — don't intercept cross-origin requests.
  if (url.origin !== self.location.origin) return

  // Navigations (HTML pages): network-first, fall back to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
    )
    return
  }

  // Hashed build assets + fonts + images: cache-first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((response) => {
          // Don't cache opaque/error responses.
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          const copy = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => cached)
    }),
  )
})
