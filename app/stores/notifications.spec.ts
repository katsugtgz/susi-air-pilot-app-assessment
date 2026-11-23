import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationsStore } from './notifications'

// localStorage shim comes from tests/setup-local-storage.ts.

describe('useNotificationsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.localStorage.clear()
  })

  it('seeds the demo notification list with a mix of read/unread', () => {
    const store = useNotificationsStore()
    expect(store.notifications.length).toBeGreaterThan(0)
    expect(store.unreadCount).toBeGreaterThan(0)
    expect(store.unreadCount).toBeLessThan(store.notifications.length)
  })

  it('markRead finalizes an item as read and drops it from the unread count', () => {
    const store = useNotificationsStore()
    const before = store.unreadCount
    const unreadId = store.notifications.find((n) => !n.read)!.id
    store.markRead(unreadId)
    expect(store.notifications.find((n) => n.id === unreadId)!.read).toBe(true)
    expect(store.unreadCount).toBe(before - 1)
  })

  it('markAllRead clears the unread count', () => {
    const store = useNotificationsStore()
    expect(store.unreadCount).toBeGreaterThan(0)
    store.markAllRead()
    expect(store.unreadCount).toBe(0)
    expect(store.notifications.every((n) => n.read)).toBe(true)
  })

  it('markAllRead persists every id under the legacy key (survives reload)', async () => {
    const store = useNotificationsStore()
    const unread = store.unreadItems.map((n) => n.id)
    expect(unread.length).toBeGreaterThan(0)
    store.markAllRead()
    await nextTick()
    const stored = JSON.parse(window.localStorage.getItem('susi:read-notification-ids')!) as string[]
    expect(unread.every((id) => stored.includes(id))).toBe(true)
  })

  it('persists read ids under the legacy susi:read-notification-ids key', async () => {
    const store = useNotificationsStore()
    const unreadId = store.notifications.find((n) => !n.read)!.id
    store.markRead(unreadId)
    await nextTick()
    expect(JSON.parse(window.localStorage.getItem('susi:read-notification-ids')!)).toContain(unreadId)
  })

  it('rehydrates read state from the legacy key across store re-creation (refresh)', async () => {
    // Simulate an existing user: the pre-store DashboardHeader already wrote
    // read ids here. A fresh store must honour them.
    const seed = useNotificationsStore()
    const unreadIds = seed.notifications.filter((n) => !n.read).map((n) => n.id)
    window.localStorage.setItem('susi:read-notification-ids', JSON.stringify(unreadIds))

    setActivePinia(createPinia())
    const recreated = useNotificationsStore()
    expect(recreated.unreadCount).toBe(0)
  })

  it('resolveNotifications marks persisted read ids on externally supplied items', async () => {
    const store = useNotificationsStore()
    const external = [
      { id: 'action-1', title: 'Expiring medical', read: false },
      { id: 'action-2', title: 'Next duty', read: false },
    ]

    store.markRead('action-1')
    await nextTick()

    const resolved = store.resolveNotifications(external)
    expect(resolved[0]!.read).toBe(true)
    expect(resolved[1]!.read).toBe(false)
  })

  it('markAllRead with explicit ids persists external notification ids across store re-creation', async () => {
    const store = useNotificationsStore()
    store.markAllRead(['ext-1', 'ext-2'])
    await nextTick()

    setActivePinia(createPinia())
    const recreated = useNotificationsStore()
    const resolved = recreated.resolveNotifications([
      { id: 'ext-1', title: 'One', read: false },
      { id: 'ext-2', title: 'Two', read: false },
    ])
    expect(resolved.every((n) => n.read)).toBe(true)
  })
})
