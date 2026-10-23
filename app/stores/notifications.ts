/**
 * Notifications store — owns the notification list (mock data; no backend)
 * and the persisted read state. Reuses the same `read-notification-ids`
 * storage key the pre-store DashboardHeader wrote, so existing users' read
 * state survives the refactor.
 *
 * `notifications` is a resolved view: an item reads as read when either its
 * flag is set or its id is in the persisted legacy list, so consumers (the
 * dumb DashboardHeader) only ever look at `item.read`.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { usePersistedState } from '~/composables/usePersistedState'
import type { NotificationItem } from '~/types'

// Dummy notifications for the bell dropdown. Mixed read/unread so the
// unread badge is meaningful.
const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Duty starts in 2 hours',
    body: 'PDG → PLM, Airbus ATR 72-600. Report by 14:30 LT.',
    time: '12m ago',
    variant: 'info',
  },
  {
    id: 'n2',
    title: 'Schedule change',
    body: 'PKU → BTH leg added to tomorrow\'s roster.',
    time: '1h ago',
    variant: 'warning',
  },
  {
    id: 'n3',
    title: 'Medical certificate expires soon',
    body: '14 days remaining — renew before 22 July 2026.',
    time: 'Yesterday',
    variant: 'warning',
  },
  {
    id: 'n4',
    title: 'Flight log verified',
    body: 'Cruise log for flight SJO-320 has been countersigned.',
    time: '2 days ago',
    read: true,
    variant: 'success',
  },
]

export const useNotificationsStore = defineStore('notifications', () => {
  // Clone so demo items are pristine per store instance (tests re-create the
  // store; without the copy markAllRead would bleed across instances).
  const items = ref<NotificationItem[]>(DEMO_NOTIFICATIONS.map((n) => ({ ...n })))

  const readIds = usePersistedState<string[]>('read-notification-ids', [])

  /** Read-resolved view: legacy persisted ids fold into `read`. */
  const notifications = computed<NotificationItem[]>(() =>
    items.value.map((n) => (n.read || readIds.value.includes(n.id) ? { ...n, read: true } : n)),
  )

  const unreadItems = computed(() => notifications.value.filter((n) => !n.read))
  const unreadCount = computed(() => unreadItems.value.length)

  function markRead(id: string) {
    const item = items.value.find((n) => n.id === id)
    if (item) item.read = true
    if (!readIds.value.includes(id)) {
      readIds.value = [...readIds.value, id]
    }
  }

  function markAllRead() {
    for (const n of unreadItems.value) markRead(n.id)
  }

  return { notifications, unreadItems, unreadCount, markRead, markAllRead }
})
