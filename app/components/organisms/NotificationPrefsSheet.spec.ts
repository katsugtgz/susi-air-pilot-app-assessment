import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import NotificationPrefsSheet from './NotificationPrefsSheet.vue'

// Node 22 + happy-dom: window.localStorage is undefined without
// --localstorage-file. Install a Map-backed shim (same approach as
// usePersistedState.spec.ts).
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
  const w = mount(NotificationPrefsSheet, options) as VueWrapper<unknown>
  wrappers.push(w)
  return w
}

describe('NotificationPrefsSheet', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders three notification preference rows', async () => {
    mountSheet({ props: { open: true } })
    await flushPromises()
    const rows = document.querySelectorAll('.notification-prefs-sheet__row')
    expect(rows.length).toBe(3)
  })

  it('shows the default toggle states from usePersistedState', async () => {
    window.localStorage.clear()
    mountSheet({ props: { open: true } })
    await flushPromises()

    const switches = document.querySelectorAll<HTMLButtonElement>('.toggle-switch')
    expect(switches.length).toBe(3)
    // Defaults: scheduleChanges=true, documentExpiry=true, companyNews=false
    expect(switches[0]?.getAttribute('aria-checked')).toBe('true')
    expect(switches[1]?.getAttribute('aria-checked')).toBe('true')
    expect(switches[2]?.getAttribute('aria-checked')).toBe('false')
  })

  it('persists toggle changes to localStorage', async () => {
    mountSheet({ props: { open: true } })
    await flushPromises()

    const switches = document.querySelectorAll<HTMLButtonElement>('.toggle-switch')
    switches[2]?.click()
    await flushPromises()

    const stored = window.localStorage.getItem('susi:notification-prefs')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!) as {
      scheduleChanges: boolean
      documentExpiry: boolean
      companyNews: boolean
    }
    expect(parsed.companyNews).toBe(true)
  })

  it('emits close when the underlying sheet closes', async () => {
    const wrapper = mountSheet({ props: { open: true } })
    await flushPromises()
    const backdrop = document.querySelector('.bottom-sheet__backdrop') as HTMLElement
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('close')).toBeDefined()
  })
})
