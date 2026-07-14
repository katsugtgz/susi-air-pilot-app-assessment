<script setup lang="ts">
/**
 * DashboardHeader
 * Sticky app-bar for the dashboard. Per brief: brand logo + welcome message
 * with pilot name + total flight hours + avatar + notification bell.
 *
 * The bell is always visible; its unread badge is hidden when there are no
 * unread notifications. Both the bell and the avatar open their own dropdown
 * panels — opening one closes the other (single activeDropdown).
 * Dropdowns close on outside click, Escape (which also restores focus to the
 * trigger), or option-specific action.
 *
 * Read state for notifications persists across reloads via usePersistedState
 * ('read-notification-ids'), so the unread badge survives a refresh.
 *
 * a11y: dropdowns are labelled groups of buttons (NOT role=menu/menuitem —
 * those roles imply arrow-key navigation and a strict widget pattern this UI
 * doesn't implement). Escape closes and returns focus to the trigger.
 *
 * Scroll-elevation: header is flat (no shadow) when the page is at the top
 * and gains var(--shadow-sm) once the user scrolls, communicating that the
 * sticky bar is overlaying content.
 */
import type { NotificationItem } from '~/types'

interface Props {
  pilotName?: string
  pilotId?: string
  pilotAvatar?: string
  /** Total accumulated flight hours — surfaced as a glanceable stat. */
  totalFlightHours?: number
  /** Bell dropdown entries. Items are unread when `read !== true` AND their
   *  id is not in the persisted read-ids list. */
  notifications?: NotificationItem[]
}
const props = withDefaults(defineProps<Props>(), {
  notifications: () => [],
})

const emit = defineEmits<{
  (e: 'tap-notifications' | 'tap-avatar' | 'logout'): void
}>()

const initials = computed(() => {
  if (!props.pilotName) return '?'
  const parts = props.pilotName.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase() || '?'
})

const formattedHours = computed(() => {
  if (typeof props.totalFlightHours !== 'number') return ''
  const rounded = Math.round(props.totalFlightHours * 10) / 10
  const isWhole = Number.isInteger(rounded)
  const str = isWhole
    ? rounded.toLocaleString('en-US')
    : rounded.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return `${str}h`
})

// Persisted read-ids augment the per-item `read` flag from props. An item is
// unread only if BOTH the prop says so AND it isn't in this list.
const readIds = usePersistedState<string[]>('read-notification-ids', [])

const unreadItems = computed(() =>
  props.notifications.filter((n) => !n.read && !readIds.value.includes(n.id)),
)
const unreadCount = computed(() => unreadItems.value.length)

type DropdownKey = 'profile' | 'notifications'
const activeDropdown = ref<DropdownKey | null>(null)
const headerRef = ref<HTMLElement | null>(null)
const bellRef = ref<HTMLButtonElement | null>(null)
const avatarRef = ref<HTMLButtonElement | null>(null)

// Tracks the element that opened the active dropdown so Escape can return
// focus to it (WCAG 2.1 disclosure-pattern expectation).
let lastTrigger: HTMLButtonElement | null = null

function toggleDropdown(which: DropdownKey) {
  if (activeDropdown.value === which) {
    closeDropdown()
    return
  }
  lastTrigger =
    which === 'notifications' ? bellRef.value : avatarRef.value
  activeDropdown.value = which
  if (which === 'profile') emit('tap-avatar')
  else emit('tap-notifications')
}

function closeDropdown() {
  activeDropdown.value = null
}

function onLogout() {
  closeDropdown()
  emit('logout')
}

function markItemRead(id: string) {
  if (!readIds.value.includes(id)) {
    readIds.value = [...readIds.value, id]
  }
}

function markAllRead() {
  const next = new Set(readIds.value)
  for (const n of props.notifications) {
    if (!n.read) next.add(n.id)
  }
  readIds.value = Array.from(next)
}

function onNotificationClick(item: NotificationItem) {
  markItemRead(item.id)
}

function onDocumentClick(event: MouseEvent) {
  if (activeDropdown.value === null) return
  if (!headerRef.value) return
  if (!headerRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && activeDropdown.value !== null) {
    closeDropdown()
    // Restore focus to whichever trigger opened the dropdown. `lastTrigger`
    // is captured at open time so it survives the dropdown closing.
    lastTrigger?.focus?.()
    lastTrigger = null
  }
}

// Scroll-elevation: flat at the top, var(--shadow-sm) once scrolled.
const scrolled = ref(false)
function onScroll() {
  if (typeof window === 'undefined') return
  scrolled.value = window.scrollY > 4
}

const ICON_BY_VARIANT: Record<NonNullable<NotificationItem['variant']>, string> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  danger: 'alert-octagon',
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', onScroll)
  }
})

const headerClass = computed(() => ({
  'dashboard-header--scrolled': scrolled.value,
}))
</script>

<template>
  <header ref="headerRef" class="dashboard-header" :class="headerClass">
    <div class="dashboard-header__top">
      <div class="dashboard-header__brand">
        <BrandLogo :height="26" />
      </div>

      <!-- Bell — always visible. Badge hides when no unread notifications. -->
      <div class="dashboard-header__notif-wrap">
        <button
          ref="bellRef"
          type="button"
          class="dashboard-header__notif"
          :aria-label="`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`"
          :aria-expanded="activeDropdown === 'notifications'"
          aria-haspopup="true"
          @click="toggleDropdown('notifications')"
        >
          <Icon name="bell" :size="22" />
          <span
            v-if="unreadCount > 0"
            class="dashboard-header__notif-badge t-badge"
            data-open="true"
          >{{ unreadCount }}</span>
        </button>

        <Transition name="dropdown">
          <div
            v-if="activeDropdown === 'notifications'"
            class="dashboard-header__dropdown dashboard-header__notif-dropdown"
          >
            <div class="dashboard-header__dropdown-header dashboard-header__notif-header">
              <p class="dashboard-header__notif-title">Notifications</p>
              <span v-if="unreadCount > 0" class="dashboard-header__notif-count">{{ unreadCount }} new</span>
            </div>
            <div class="dashboard-header__dropdown-divider" />
            <div class="dashboard-header__notif-list">
              <p v-if="notifications.length === 0" class="dashboard-header__notif-empty">
                You're all caught up.
              </p>
              <ul v-else class="dashboard-header__notif-items" aria-label="Notifications">
                <li
                  v-for="item in notifications"
                  :key="item.id"
                  class="dashboard-header__notif-item-wrap"
                >
                  <button
                    type="button"
                    class="dashboard-header__notif-item"
                    :class="{
                      'dashboard-header__notif-item--unread': !item.read && !readIds.includes(item.id),
                    }"
                    :aria-label="`${item.title}${!item.read && !readIds.includes(item.id) ? ' (unread)' : ''}`"
                    @click="onNotificationClick(item)"
                  >
                    <span class="dashboard-header__notif-icon" :class="`dashboard-header__notif-icon--${item.variant ?? 'info'}`">
                      <Icon :name="ICON_BY_VARIANT[item.variant ?? 'info']" :size="16" />
                    </span>
                    <span class="dashboard-header__notif-content">
                      <span class="dashboard-header__notif-item-title">{{ item.title }}</span>
                      <span v-if="item.body" class="dashboard-header__notif-item-body">{{ item.body }}</span>
                      <span v-if="item.time" class="dashboard-header__notif-item-time">{{ item.time }}</span>
                    </span>
                    <span
                      v-if="!item.read && !readIds.includes(item.id)"
                      class="dashboard-header__notif-dot"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              </ul>
            </div>
            <div v-if="unreadCount > 0" class="dashboard-header__dropdown-divider" />
            <button
              v-if="unreadCount > 0"
              type="button"
              class="dashboard-header__mark-all"
              @click="markAllRead"
            >
              <Icon name="check" :size="14" decorative />
              <span>Mark all as read</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- Avatar trigger + profile dropdown -->
      <div class="dashboard-header__avatar-wrap">
        <button
          ref="avatarRef"
          type="button"
          class="dashboard-header__avatar-btn"
          aria-label="Open profile menu"
          :aria-expanded="activeDropdown === 'profile'"
          aria-haspopup="true"
          @click="toggleDropdown('profile')"
        >
          <Avatar :src="pilotAvatar" :name="pilotName" :initials="initials" size="md" />
        </button>

        <Transition name="dropdown">
          <div
            v-if="activeDropdown === 'profile'"
            class="dashboard-header__dropdown"
            aria-label="Profile menu"
          >
            <div class="dashboard-header__dropdown-header">
              <p v-if="pilotName" class="dashboard-header__dropdown-name">{{ pilotName }}</p>
              <p v-if="pilotId" class="dashboard-header__dropdown-id">Pilot ID · {{ pilotId }}</p>
            </div>
            <div class="dashboard-header__dropdown-divider" />
            <button type="button" class="dashboard-header__logout" @click="onLogout">
              <Icon name="log-out" :size="16" />
              <span>Sign out</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <div v-if="pilotName" class="dashboard-header__welcome">
      <p class="dashboard-header__greeting">Welcome back,</p>
      <h1 class="dashboard-header__name">{{ pilotName }}</h1>
      <p v-if="formattedHours" class="dashboard-header__hours">
        <Icon name="clock" :size="14" />
        <span>{{ formattedHours }} total flight time</span>
      </p>
    </div>
  </header>
</template>

<style scoped lang="scss">
@keyframes t-badge-slide-in {
  from { transform: translate(var(--badge-offset-x), var(--badge-offset-y)); }
  to   { transform: translate(0, 0); }
}

.t-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  pointer-events: none;
  will-change: transform;
}
.t-badge[data-open="true"] {
  animation: t-badge-slide-in var(--badge-slide-dur) var(--badge-slide-ease);
}

.t-badge-dot {
  display: block;
  transform-origin: center;
  transform: scale(1);
  opacity: 1;
  filter: blur(0);
  transition:
    transform var(--badge-pop-dur)  var(--badge-pop-ease),
    opacity   var(--badge-fade-dur) var(--badge-pop-ease),
    filter    var(--badge-pop-dur)  var(--badge-pop-ease);
  will-change: transform, opacity, filter;
}
.t-badge[data-open="false"] .t-badge-dot {
  transform: scale(0);
  opacity: 0;
  filter: blur(var(--badge-blur));
  transition:
    transform var(--badge-pop-close-dur)  var(--badge-close-ease),
    opacity   var(--badge-fade-close-dur) var(--badge-close-ease),
    filter    var(--badge-pop-close-dur)  var(--badge-close-ease);
}

@media (prefers-reduced-motion: reduce) {
  .t-badge, .t-badge-dot { animation: none !important; transition: none !important; }
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4) var(--space-4);
  background: var(--color-surface);
  box-shadow: transparent;
  position: sticky;
  top: 0;
  z-index: 10;
  transition: box-shadow 0.2s ease;
  border-bottom: 1px solid transparent;

  &--scrolled {
    box-shadow: var(--shadow-sm);
    border-bottom-color: var(--color-border);
  }

  &__top {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  &__brand {
    flex: 1;
    display: flex;
    align-items: center;
  }

  &__notif-wrap {
    position: relative;
  }

  &__notif {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: transparent;
    border: 0;
    border-radius: var(--radius-full);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;

    &:hover {
      background: var(--color-surface-alt);
      color: var(--color-text-primary);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }
  }

  &__notif-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: var(--radius-full);
    background: var(--color-red);
    color: #fff;
    font-size: 10px;
    font-weight: var(--fw-bold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  &__avatar-wrap {
    position: relative;
  }

  &__avatar-btn {
    padding: 0;
    background: transparent;
    border: 0;
    cursor: pointer;
    border-radius: 50%;

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }
  }

  &__welcome {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__greeting {
    margin: 0;
    font-size: var(--fs-base-sm);
    color: var(--color-text-secondary);
  }

  &__name {
    margin: 0;
    font-size: var(--fs-xl);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
    line-height: 1.2;
  }

  &__hours {
    margin: var(--space-1) 0 0;
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--fs-sm);
    color: var(--color-text-secondary);

    :deep(span) {
      font-weight: var(--fw-bold);
      color: var(--color-text-primary);
    }
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + var(--space-2));
    right: 0;
    min-width: 220px;
    background: var(--color-surface);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--color-border);
    overflow: hidden;
    z-index: 20;
  }

  &__notif-dropdown {
    width: min(320px, calc(100vw - var(--space-4) * 2));
    min-width: 0;
    right: calc(-1 * (40px + var(--space-3)));
  }

  &__notif-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
  }

  &__notif-title {
    margin: 0;
    font-size: var(--fs-md);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
  }

  &__notif-count {
    font-size: var(--fs-xs);
    color: var(--color-text-secondary);
    font-weight: var(--fw-semibold);
  }

  &__notif-list {
    max-height: min(360px, 50vh);
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  &__notif-items {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__notif-empty {
    margin: 0;
    padding: var(--space-4) var(--space-3);
    text-align: center;
    font-size: var(--fs-base-sm);
    color: var(--color-text-muted);
  }

  &__notif-item-wrap {
    border-bottom: 1px solid var(--color-border);

    &:last-child {
      border-bottom: 0;
    }
  }

  &__notif-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: var(--space-2);
    padding: var(--space-3);
    width: 100%;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: background 0.12s ease;
    font-family: inherit;

    &:hover {
      background: var(--color-surface-alt);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }

    &--unread {
      background: var(--color-overlay);
    }
  }

  &__notif-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-full);
    flex-shrink: 0;

    &--info {
      color: var(--color-text-secondary);
      background: var(--color-surface-alt);
    }
    &--success {
      color: var(--color-success);
      background: var(--color-safe-bg);
    }
    &--warning {
      color: var(--color-warning);
      background: var(--color-soon-bg);
    }
    &--danger {
      color: var(--color-red);
      background: var(--color-expired-bg);
    }
  }

  &__notif-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__notif-item-title {
    font-size: var(--fs-base);
    font-weight: var(--fw-semibold);
    color: var(--color-text-primary);
    line-height: 1.3;
  }

  &__notif-item-body {
    font-size: var(--fs-base-sm);
    color: var(--color-text-secondary);
    line-height: 1.35;
  }

  &__notif-item-time {
    margin-top: 2px;
    font-size: var(--fs-xs);
    color: var(--color-text-muted);
  }

  &__notif-dot {
    width: 8px;
    height: 8px;
    border-radius: var(--radius-full);
    background: var(--color-red);
    margin-top: 6px;
    flex-shrink: 0;
  }

  &__mark-all {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-3);
    border: 0;
    background: transparent;
    color: var(--color-red);
    font-family: inherit;
    font-size: var(--fs-base-sm);
    font-weight: var(--fw-semibold);
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: var(--color-expired-bg);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }
  }

  &__dropdown-header {
    padding: var(--space-3) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__dropdown-name {
    margin: 0;
    font-size: var(--fs-md);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
  }

  &__dropdown-id {
    margin: 0;
    font-size: var(--fs-base-sm);
    color: var(--color-text-secondary);
  }

  &__dropdown-divider {
    height: 1px;
    background: var(--color-border);
  }

  &__logout {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: transparent;
    border: 0;
    color: var(--color-red);
    font-size: var(--fs-base);
    font-weight: var(--fw-semibold);
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease;

    &:hover {
      background: var(--color-expired-bg);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
