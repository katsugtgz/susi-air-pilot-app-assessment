import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import AppearanceSheet from './AppearanceSheet.vue'

// Node 22 declares an experimental `localStorage` global that shadows
// happy-dom's window.localStorage and returns undefined unless
// --localstorage-file is passed. Install a Map-backed shim so useTheme's
// persistence path runs under vitest. Mirrors the pattern in
// usePersistedState.spec.ts.
beforeAll(() => {
  if (typeof window === 'undefined' || window.localStorage) return
  const store = new Map<string, string>()
  const shim: Storage = {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key) {
      return store.has(key) ? (store.get(key) as string) : null
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key) {
      store.delete(key)
    },
    setItem(key, value) {
      store.set(key, String(value))
    },
  }
  Object.defineProperty(window, 'localStorage', {
    value: shim,
    configurable: true,
    writable: true,
  })
})

// BottomSheet teleports to <body>; unmount between tests so DOM selectors
// don't see stale instances from prior tests.
const wrappers: Array<VueWrapper<unknown>> = []
afterEach(() => {
  while (wrappers.length) {
    wrappers.pop()?.unmount()
  }
  document.body.innerHTML = ''
})

function mountSheet(options: Parameters<typeof mount>[1] = {}) {
  const w = mount(AppearanceSheet, options) as VueWrapper<unknown>
  wrappers.push(w)
  return w
}

describe('AppearanceSheet', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    // happy-dom does not implement matchMedia by default — install a stub
    // so useTheme's system-mode tracking can run during the tests.
    if (!window.matchMedia) {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }) as unknown as typeof window.matchMedia
    }
  })

  it('mounts and renders three radio rows', () => {
    mountSheet({ props: { open: true } })
    const rows = document.querySelectorAll('.appearance-sheet__row')
    expect(rows.length).toBe(3)
    expect(document.body.textContent ?? '').toContain('Light')
    expect(document.body.textContent ?? '').toContain('Dark')
    expect(document.body.textContent ?? '').toContain('System')
  })

  it('marks the current preference as active (radiogroup semantics)', async () => {
    // useTheme stores the raw preference string (no JSON) — match that format.
    window.localStorage.setItem('susi:theme', 'dark')
    mountSheet({ props: { open: true } })
    await flushPromises()

    const rows = document.querySelectorAll<HTMLButtonElement>('.appearance-sheet__row')
    const darkRow = Array.from(rows).find((r) =>
      (r.textContent ?? '').startsWith('Dark'),
    ) as HTMLButtonElement
    expect(darkRow).toBeTruthy()
    expect(darkRow.getAttribute('aria-checked')).toBe('true')
    expect(darkRow.classList.contains('appearance-sheet__row--active')).toBe(true)
  })

  it('clicking a row updates the preference and applies data-theme', async () => {
    mountSheet({ props: { open: true } })
    await flushPromises()

    const rows = document.querySelectorAll<HTMLButtonElement>('.appearance-sheet__row')
    const lightRow = Array.from(rows).find((r) =>
      (r.textContent ?? '').startsWith('Light'),
    ) as HTMLButtonElement
    lightRow.click()
    await flushPromises()

    expect(window.localStorage.getItem('susi:theme')).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('emits close via the BottomSheet close handler', async () => {
    const wrapper = mountSheet({ props: { open: true } })
    await flushPromises()
    const backdrop = document.querySelector('.bottom-sheet__backdrop') as HTMLElement
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('close')).toBeDefined()
  })
})
