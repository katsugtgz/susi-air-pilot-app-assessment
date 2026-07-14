/**
 * useTheme
 *
 * Persists the user's appearance preference (`light` | `dark` | `system`),
 * resolves the effective theme, and applies it to `document.documentElement`
 * as a `data-theme` attribute so the [data-theme='dark'] CSS override kicks in.
 *
 * `system` follows the OS via `matchMedia('(prefers-color-scheme: dark)')` and
 * updates live when the OS setting changes.
 *
 * Dual-export pattern (matches the other composables):
 *   - `resolveTheme(pref, systemDark)` — pure, unit-testable without DOM.
 *   - `useTheme()` — reactive wrapper that owns the persisted ref + side
 *     effects (DOM attribute, matchMedia listener). SSR-safe: all DOM and
 *     matchMedia access is `typeof window`-guarded.
 */
import { computed, ref, watch, type Ref } from 'vue'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

/**
 * Pure resolution — `system` defers to the OS preference; explicit choices
 * win. Kept side-effect-free so it can be unit-tested without a DOM.
 */
export function resolveTheme(
  pref: ThemePreference,
  systemDark: boolean,
): ResolvedTheme {
  if (pref === 'system') return systemDark ? 'dark' : 'light'
  return pref
}

function readStoredPref(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const raw = window.localStorage.getItem(`susi:${STORAGE_KEY}`)
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  return 'system'
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyThemeAttribute(theme: ResolvedTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * Reactive wrapper for use inside <script setup>. Returns:
 *   - `preference` — writable ref to the persisted user choice.
 *   - `systemDark` — readonly ref tracking the OS preference (live).
 *   - `theme` — readonly computed effective theme ('light' | 'dark').
 *
 * Implemented as a lazily-initialised module SINGLETON: the first caller
 * creates the refs, the persist/apply `watch`, and the matchMedia listener;
 * every subsequent caller (AppearanceSheet, plugins, etc.) shares that one
 * instance. This avoids leaking a fresh matchMedia listener per `useTheme()`
 * call and keeps all consumers in sync. The listener is intentionally never
 * removed — it lives for the app's lifetime, which is correct for a singleton.
 *
 * The first call seeds `document.documentElement[data-theme]` so a late
 * hydration never leaves the page in the wrong palette. Subsequent writes
 * to `preference.value` persist + re-apply.
 */
interface ThemeState {
  preference: Ref<ThemePreference>
  systemDark: Ref<boolean>
  theme: Readonly<Ref<ResolvedTheme>>
}

let state: ThemeState | null = null

function initThemeState(): ThemeState {
  const preference = ref<ThemePreference>(readStoredPref())
  const systemDark = ref<boolean>(systemPrefersDark())
  const theme = computed(() => resolveTheme(preference.value, systemDark.value))

  // Persist + apply on any change to either input.
  watch(
    [preference, theme],
    ([nextPref, nextTheme]) => {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(`susi:${STORAGE_KEY}`, nextPref)
        } catch {
          // Quota exceeded / disabled storage — keep in-memory state.
        }
      }
      applyThemeAttribute(nextTheme)
    },
    { immediate: true },
  )

  // Track OS preference live while the user has chosen `system`.
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      systemDark.value = e.matches
    }
    // addEventListener is the standard API; addListener is the legacy Safari
    // fallback. Feature-detect rather than assume.
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler)
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(handler)
    }
  }

  return { preference, systemDark, theme }
}

export function useTheme(): ThemeState {
  return (state ??= initThemeState())
}
