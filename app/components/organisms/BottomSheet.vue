<script setup lang="ts">
/**
 * BottomSheet
 *
 * Generic mobile bottom-sheet dialog. Teleports to <body>, locks body scroll
 * while open, traps Tab within itself, restores focus on close, and emits
 * `close` on backdrop click or Escape. Body via default slot, optional
 * footer via named slot.
 *
 * Focus management follows the WCAG 2.1 dialog pattern (same approach as
 * CopilotSheet, generalised for arbitrary slotted content).
 */
interface Props {
  open: boolean
  title?: string
  ariaLabel?: string
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const dialogRef = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null
let savedBodyOverflow = ''

function close() {
  emit('close')
}

function isFocusable(el: Element): el is HTMLElement {
  return (
    el instanceof HTMLElement &&
    !el.hasAttribute('disabled') &&
    el.getAttribute('aria-hidden') !== 'true' &&
    el.tabIndex >= 0 &&
    el.offsetParent !== null
  )
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(isFocusable)
}

function focusIn() {
  const dlg = dialogRef.value
  if (!dlg) return
  const focusable = getFocusable(dlg)
  if (focusable.length > 0) {
    focusable[0]?.focus()
  } else {
    // No focusable child — focus the dialog itself so screen readers land
    // inside the dialog and Tab has a starting point to wrap from.
    dlg.focus()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.stopPropagation()
    close()
    return
  }
  if (event.key !== 'Tab') return

  const dlg = dialogRef.value
  if (!dlg) return
  const focusable = getFocusable(dlg)
  if (focusable.length === 0) {
    event.preventDefault()
    dlg.focus()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement as HTMLElement | null

  if (event.shiftKey) {
    if (active === first || !dlg.contains(active)) {
      event.preventDefault()
      last?.focus()
    }
  } else if (active === last || !dlg.contains(active)) {
    event.preventDefault()
    first?.focus()
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (typeof window === 'undefined') return
    if (isOpen) {
      previouslyFocused = (document.activeElement as HTMLElement) ?? null
      savedBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onKeydown, true)
      // Move focus in on the next paint (after the dialog mounts).
      setTimeout(focusIn, 0)
    } else {
      document.removeEventListener('keydown', onKeydown, true)
      document.body.style.overflow = savedBodyOverflow
      savedBodyOverflow = ''
      previouslyFocused?.focus?.()
      previouslyFocused = null
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown, true)
  if (typeof window !== 'undefined' && document.body.style.overflow === 'hidden') {
    document.body.style.overflow = savedBodyOverflow
  }
})

const labelledBy = computed(() => (props.title ? 'bottom-sheet-title' : undefined))
const dialogAriaLabel = computed(() => props.title ?? props.ariaLabel)
</script>

<template>
  <Teleport to="body">
    <Transition name="bottom-sheet">
      <div
        v-if="open"
        class="bottom-sheet__backdrop"
        @click.self="close"
      >
        <section
          ref="dialogRef"
          class="bottom-sheet"
          role="dialog"
          aria-modal="true"
          :aria-label="dialogAriaLabel"
          :aria-labelledby="labelledBy"
          tabindex="-1"
        >
          <span class="bottom-sheet__handle" aria-hidden="true" />

          <header v-if="title" class="bottom-sheet__header">
            <h2 id="bottom-sheet-title" class="bottom-sheet__title">{{ title }}</h2>
            <button
              type="button"
              class="bottom-sheet__close"
              aria-label="Close"
              @click="close"
            >
              <Icon name="x" :size="18" decorative />
            </button>
          </header>

          <div class="bottom-sheet__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="bottom-sheet__footer">
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.bottom-sheet {
  &__backdrop {
    position: fixed;
    inset: 0;
    background: rgba(14, 33, 56, 0.45);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 200;
    padding: 0 var(--space-3);
    padding-bottom: max(var(--space-3), env(safe-area-inset-bottom));
  }

  width: 100%;
  max-width: 560px;
  max-height: 90dvh;
  background: var(--color-bg);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  outline: none;

  &:focus-visible {
    box-shadow: var(--shadow-focus);
  }

  &__handle {
    display: block;
    width: 40px;
    height: 4px;
    margin: var(--space-2) auto var(--space-1);
    background: var(--color-border);
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-4) var(--space-3);
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: var(--fs-md);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
  }

  &__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: 0;
    border-radius: 50%;
    color: var(--color-text-secondary);
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
      background: var(--color-surface-alt);
      color: var(--color-text-primary);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4);
    background: var(--color-bg);
    -webkit-overflow-scrolling: touch;
  }

  &__footer {
    flex-shrink: 0;
    padding: var(--space-3) var(--space-4);
    padding-bottom: max(var(--space-3), env(safe-area-inset-bottom));
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
  }
}

.bottom-sheet-enter-active {
  transition: opacity var(--modal-open-dur, 200ms) ease;
}
.bottom-sheet-leave-active {
  transition: opacity var(--modal-close-dur, 150ms) ease;
}
.bottom-sheet-enter-active .bottom-sheet {
  transition:
    transform var(--modal-open-dur, 200ms) ease,
    opacity var(--modal-open-dur, 200ms) ease;
}
.bottom-sheet-leave-active .bottom-sheet {
  transition:
    transform var(--modal-close-dur, 150ms) ease,
    opacity var(--modal-close-dur, 150ms) ease;
}
.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  opacity: 0;
}
.bottom-sheet-enter-from .bottom-sheet,
.bottom-sheet-leave-to .bottom-sheet {
  transform: translateY(20%);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .bottom-sheet-enter-active,
  .bottom-sheet-leave-active,
  .bottom-sheet-enter-active .bottom-sheet,
  .bottom-sheet-leave-active .bottom-sheet {
    transition: none !important;
  }
}
</style>
