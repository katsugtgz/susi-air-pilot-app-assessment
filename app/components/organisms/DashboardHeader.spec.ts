import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import DashboardHeader from './DashboardHeader.vue'

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

// Track mounts so afterEach can unmount every wrapper. DashboardHeader
// registers `keydown`/`click` listeners on `document`; without explicit
// unmount those leak across tests and steal events (e.g. focus assertions).
const wrappers: Array<VueWrapper<unknown>> = []
afterEach(() => {
  while (wrappers.length) {
    wrappers.pop()?.unmount()
  }
})

function mountHeader(options: Parameters<typeof mount>[1] = {}) {
  const w = mount(DashboardHeader, options) as VueWrapper<unknown>
  wrappers.push(w)
  return w
}

describe('DashboardHeader', () => {
  beforeEach(() => {
    window.localStorage.clear()
    // happy-dom may not implement matchMedia — required by no component here,
    // but install a stub for any future consumer. Safe no-op if already present.
    if (!window.matchMedia) {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia
    }
  })

  it('renders the BrandLogo', () => {
    const wrapper = mountHeader({ props: { pilotName: 'John Doe' } })
    expect(wrapper.find('img[src="/susi-air-logo.png"]').exists()).toBe(true)
  })

  it('renders Avatar with the pilot name', () => {
    const wrapper = mountHeader({ props: { pilotName: 'John Doe' } })
    expect(wrapper.find('.avatar').exists()).toBe(true)
    expect(wrapper.find('.avatar__fallback').text()).toBe('JD')
  })

  it('always shows the bell; badge only appears when there are unread notifications', () => {
    const none = mountHeader({ props: { pilotName: 'X', notifications: [] } })
    expect(none.find('.dashboard-header__notif').exists()).toBe(true)
    expect(none.find('.dashboard-header__notif-badge').exists()).toBe(false)

    const allRead = mountHeader({
      props: { pilotName: 'X', notifications: [{ id: 'a', title: 'A', read: true }] },
    })
    expect(allRead.find('.dashboard-header__notif').exists()).toBe(true)
    expect(allRead.find('.dashboard-header__notif-badge').exists()).toBe(false)

    const unread = mountHeader({
      props: {
        pilotName: 'X',
        notifications: [
          { id: 'a', title: 'A' },
          { id: 'b', title: 'B', read: true },
          { id: 'c', title: 'C' },
        ],
      },
    })
    expect(unread.find('.dashboard-header__notif-badge').text()).toBe('2')
  })

  it('emits tap-notifications when bell clicked', async () => {
    const wrapper = mountHeader({ props: { pilotName: 'X', notifications: [] } })
    await wrapper.find('.dashboard-header__notif').trigger('click')
    expect(wrapper.emitted('tap-notifications')).toHaveLength(1)
  })

  it('opens the notifications dropdown on bell click', async () => {
    const wrapper = mountHeader({
      props: {
        pilotName: 'X',
        notifications: [{ id: 'n1', title: 'Duty reminder', body: 'Soon', time: 'now' }],
      },
    })
    await wrapper.find('.dashboard-header__notif').trigger('click')
    const dropdown = wrapper.find('.dashboard-header__notif-dropdown')
    expect(dropdown.exists()).toBe(true)
    expect(dropdown.text()).toContain('Duty reminder')
  })

  it('shows an empty-state message when the bell is opened with no notifications', async () => {
    const wrapper = mountHeader({ props: { pilotName: 'X', notifications: [] } })
    await wrapper.find('.dashboard-header__notif').trigger('click')
    expect(wrapper.find('.dashboard-header__notif-empty').text()).toMatch(/caught up/i)
  })

  it('opens only one dropdown at a time — opening notifications closes profile', async () => {
    const wrapper = mountHeader({ props: { pilotName: 'X', pilotId: 'PSA-1', notifications: [] } })
    await wrapper.find('.dashboard-header__avatar-btn').trigger('click')
    expect(wrapper.find('.dashboard-header__logout').exists()).toBe(true)
    expect(wrapper.find('.dashboard-header__notif-dropdown').exists()).toBe(false)

    await wrapper.find('.dashboard-header__notif').trigger('click')
    expect(wrapper.find('.dashboard-header__notif-dropdown').exists()).toBe(true)
    expect(wrapper.find('.dashboard-header__logout').exists()).toBe(false)
  })

  describe('welcome block (pilot name + total flight hours)', () => {
    it('renders a "Welcome back," greeting when pilotName is provided', () => {
      const wrapper = mountHeader({ props: { pilotName: 'John Doe' } })
      expect(wrapper.find('.dashboard-header__greeting').text()).toBe('Welcome back,')
      expect(wrapper.find('.dashboard-header__name').text()).toBe('John Doe')
    })

    it('omits the welcome block entirely when no pilotName is provided', () => {
      const wrapper = mountHeader({})
      expect(wrapper.find('.dashboard-header__welcome').exists()).toBe(false)
    })

    it('formats totalFlightHours with thousands separator + "h" suffix (1444.5 → "1,444.5h")', () => {
      const wrapper = mountHeader({
        props: { pilotName: 'John', totalFlightHours: 1444.5 },
      })
      expect(wrapper.find('.dashboard-header__hours').text()).toContain('1,444.5h')
      expect(wrapper.find('.dashboard-header__hours').text()).toContain('total flight time')
    })

    it('formats whole-number hours without trailing .0 (1444 → "1,444h")', () => {
      const wrapper = mountHeader({
        props: { pilotName: 'John', totalFlightHours: 1444 },
      })
      expect(wrapper.find('.dashboard-header__hours').text()).toContain('1,444h')
    })

    it('hides the hours stat when totalFlightHours is not provided', () => {
      const wrapper = mountHeader({ props: { pilotName: 'John' } })
      expect(wrapper.find('.dashboard-header__hours').exists()).toBe(false)
    })
  })

  describe('profile dropdown', () => {
    it('is closed initially', () => {
      const wrapper = mountHeader({ props: { pilotName: 'John Doe', pilotId: 'PSA-1042' } })
      expect(wrapper.find('.dashboard-header__dropdown').exists()).toBe(false)
      expect(wrapper.find('.dashboard-header__avatar-btn').attributes('aria-expanded')).toBe('false')
    })

    it('opens on avatar click and emits tap-avatar', async () => {
      const wrapper = mountHeader({ props: { pilotName: 'John Doe', pilotId: 'PSA-1042' } })
      await wrapper.find('.dashboard-header__avatar-btn').trigger('click')
      expect(wrapper.find('.dashboard-header__dropdown').exists()).toBe(true)
      expect(wrapper.find('.dashboard-header__avatar-btn').attributes('aria-expanded')).toBe('true')
      expect(wrapper.emitted('tap-avatar')).toHaveLength(1)
    })

    it('renders pilot name and ID in the dropdown', async () => {
      const wrapper = mountHeader({ props: { pilotName: 'John Doe', pilotId: 'PSA-1042' } })
      await wrapper.find('.dashboard-header__avatar-btn').trigger('click')
      expect(wrapper.find('.dashboard-header__dropdown-name').text()).toBe('John Doe')
      expect(wrapper.find('.dashboard-header__dropdown-id').text()).toBe('Pilot ID · PSA-1042')
    })

    it('emits logout and closes when logout button clicked', async () => {
      const wrapper = mountHeader({ props: { pilotName: 'John', pilotId: 'PSA-1' } })
      await wrapper.find('.dashboard-header__avatar-btn').trigger('click')
      await wrapper.find('.dashboard-header__logout').trigger('click')
      expect(wrapper.emitted('logout')).toHaveLength(1)
      expect(wrapper.find('.dashboard-header__dropdown').exists()).toBe(false)
    })

    it('closes on Escape key', async () => {
      const wrapper = mountHeader({ props: { pilotName: 'John', pilotId: 'PSA-1' } })
      await wrapper.find('.dashboard-header__avatar-btn').trigger('click')
      expect(wrapper.find('.dashboard-header__dropdown').exists()).toBe(true)

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.dashboard-header__dropdown').exists()).toBe(false)
    })

    it('closes on outside click', async () => {
      const wrapper = mountHeader({ props: { pilotName: 'John', pilotId: 'PSA-1' } })
      await wrapper.find('.dashboard-header__avatar-btn').trigger('click')
      expect(wrapper.find('.dashboard-header__dropdown').exists()).toBe(true)

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.dashboard-header__dropdown').exists()).toBe(false)
    })

    it('toggles closed when avatar clicked while open', async () => {
      const wrapper = mountHeader({ props: { pilotName: 'John', pilotId: 'PSA-1' } })
      const btn = wrapper.find('.dashboard-header__avatar-btn')
      await btn.trigger('click')
      expect(wrapper.find('.dashboard-header__dropdown').exists()).toBe(true)
      await btn.trigger('click')
      expect(wrapper.find('.dashboard-header__dropdown').exists()).toBe(false)
    })

    it('omits the ID line when pilotId is not provided', async () => {
      const wrapper = mountHeader({ props: { pilotName: 'John' } })
      await wrapper.find('.dashboard-header__avatar-btn').trigger('click')
      expect(wrapper.find('.dashboard-header__dropdown-id').exists()).toBe(false)
    })
  })

  describe('notification read state (persisted)', () => {
    it('clicking an item marks it read and removes it from the unread count', async () => {
      const wrapper = mountHeader({
        props: {
          pilotName: 'X',
          notifications: [
            { id: 'a', title: 'A' },
            { id: 'b', title: 'B' },
          ],
        },
      })
      await wrapper.find('.dashboard-header__notif').trigger('click')
      expect(wrapper.find('.dashboard-header__notif-badge').text()).toBe('2')

      // Click the first notification item button.
      const items = wrapper.findAll('.dashboard-header__notif-item')
      expect(items.length).toBe(2)
      await items[0]!.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.dashboard-header__notif-badge').text()).toBe('1')
      const stored = window.localStorage.getItem('susi:read-notification-ids')
      expect(stored).not.toBeNull()
      expect(JSON.parse(stored!)).toContain('a')
    })

    it('survives reload — persisted read ids count as read on remount', async () => {
      window.localStorage.setItem('susi:read-notification-ids', JSON.stringify(['a']))
      const wrapper = mountHeader({
        props: {
          pilotName: 'X',
          notifications: [
            { id: 'a', title: 'A' },
            { id: 'b', title: 'B' },
          ],
        },
      })
      // 'a' is persisted-as-read → only 'b' counts as unread.
      expect(wrapper.find('.dashboard-header__notif-badge').text()).toBe('1')
    })

    it('"Mark all as read" clears the unread count and persists every unread id', async () => {
      const wrapper = mountHeader({
        props: {
          pilotName: 'X',
          notifications: [
            { id: 'a', title: 'A' },
            { id: 'b', title: 'B', read: true },
            { id: 'c', title: 'C' },
          ],
        },
      })
      await wrapper.find('.dashboard-header__notif').trigger('click')
      expect(wrapper.find('.dashboard-header__notif-badge').text()).toBe('2')

      const markAll = wrapper.find('.dashboard-header__mark-all')
      expect(markAll.exists()).toBe(true)
      await markAll.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.dashboard-header__notif-badge').exists()).toBe(false)
      const stored = JSON.parse(window.localStorage.getItem('susi:read-notification-ids')!) as string[]
      expect(stored).toEqual(expect.arrayContaining(['a', 'c']))
    })

    it('does not show "Mark all as read" when there are no unread items', async () => {
      const wrapper = mountHeader({
        props: {
          pilotName: 'X',
          notifications: [{ id: 'a', title: 'A', read: true }],
        },
      })
      await wrapper.find('.dashboard-header__notif').trigger('click')
      expect(wrapper.find('.dashboard-header__mark-all').exists()).toBe(false)
    })
  })

  describe('a11y — dropdown semantics', () => {
    it('does NOT use role=menu on dropdowns (replaced with labelled groups)', async () => {
      const wrapper = mountHeader({
        props: { pilotName: 'John', pilotId: 'PSA-1', notifications: [] },
      })
      await wrapper.find('.dashboard-header__avatar-btn').trigger('click')
      const profileDropdown = wrapper.find('.dashboard-header__dropdown')
      expect(profileDropdown.attributes('role')).toBeFalsy()
    })

    it('uses aria-haspopup="true" (not "menu") on triggers', () => {
      const wrapper = mountHeader({ props: { pilotName: 'John' } })
      expect(wrapper.find('.dashboard-header__notif').attributes('aria-haspopup')).toBe('true')
      expect(wrapper.find('.dashboard-header__avatar-btn').attributes('aria-haspopup')).toBe('true')
    })

    it('notification items are buttons (not role=menuitem)', async () => {
      const wrapper = mountHeader({
        props: {
          pilotName: 'X',
          notifications: [{ id: 'a', title: 'A' }],
        },
      })
      await wrapper.find('.dashboard-header__notif').trigger('click')
      const item = wrapper.find('.dashboard-header__notif-item')
      expect(item.element.tagName).toBe('BUTTON')
      expect(item.attributes('role')).toBeFalsy()
    })

    it('Escape restores focus to the bell after closing the notifications dropdown', async () => {
      // attachTo: document.body so the bell lives in the live DOM — focus()
      // on a detached element is a no-op in browser semantics.
      const wrapper = mountHeader({
        props: {
          pilotName: 'X',
          notifications: [{ id: 'a', title: 'A' }],
        },
        attachTo: document.body,
      })
      const bell = wrapper.find('.dashboard-header__notif')
      await bell.trigger('click')
      expect(wrapper.find('.dashboard-header__notif-dropdown').exists()).toBe(true)

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.dashboard-header__notif-dropdown').exists()).toBe(false)
      expect(document.activeElement).toBe(bell.element)
    })
  })

  describe('scroll-elevation', () => {
    it('is flat at the top and gains shadow once scrolled', async () => {
      const wrapper = mountHeader({ props: { pilotName: 'X' } })
      expect(wrapper.classes()).not.toContain('dashboard-header--scrolled')

      // happy-dom exposes scrollY as a writable property.
      Object.defineProperty(window, 'scrollY', { value: 50, writable: true, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      await wrapper.vm.$nextTick()
      expect(wrapper.classes()).toContain('dashboard-header--scrolled')

      Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      await wrapper.vm.$nextTick()
      expect(wrapper.classes()).not.toContain('dashboard-header--scrolled')
    })
  })
})
