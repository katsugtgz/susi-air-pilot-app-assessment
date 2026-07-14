<script setup lang="ts">
/**
 * CopilotSheet
 * Bottom-sheet chat dialog for the AI Copilot. role=dialog + aria-modal,
 * Esc + backdrop close, focus moves into the dialog on open, scrollable
 * message list (user right / assistant left via ChatMessage). Shows the four
 * template prompt chips when the conversation is empty. A live typing
 * indicator pulses while the assistant is streaming.
 *
 * The composable is injected via props (messages/isStreaming/error/send) so
 * the component stays Storybook-friendly and unit-testable without touching
 * `fetch`. The bubble that owns the composable passes it down.
 */
import type { CopilotMessage } from '~/composables/useCopilotChat'

interface Props {
  open: boolean
  messages: CopilotMessage[]
  isStreaming: boolean
  error: string | null
  /** Template chips shown when messages is empty. */
  prompts?: string[]
}
const props = withDefaults(defineProps<Props>(), {
  prompts: () => [
    'When is my next flight?',
    'Which documents expire soon?',
    'How many hours left this month?',
    'Summarize the latest crew news',
  ],
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'send', text: string): void
}>()

const draft = ref('')
const listRef = ref<HTMLElement | null>(null)
const dialogRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const isEmpty = computed(() => props.messages.length === 0)

function close() {
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    event.stopPropagation()
    close()
  }
}

function onSubmit() {
  const text = draft.value.trim()
  if (!text || props.isStreaming) return
  emit('send', text)
  draft.value = ''
}

function onChip(prompt: string) {
  if (props.isStreaming) return
  emit('send', prompt)
}

function focusInput() {
  // Focus moving INTO the dialog on open is the WCAG 2.1 dialog pattern.
  inputRef.value?.focus()
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      previouslyFocused = (document.activeElement as HTMLElement) ?? null
      // Move focus in on next paint (after the dialog mounts).
      setTimeout(focusInput, 0)
      document.addEventListener('keydown', onKeydown, true)
    } else {
      document.removeEventListener('keydown', onKeydown, true)
      previouslyFocused?.focus?.()
    }
  },
  { immediate: true },
)

// Auto-scroll to the newest message as it streams in.
watch(
  () => props.messages.map((m) => m.text).join('|'),
  () => {
    const el = listRef.value
    if (el) el.scrollTop = el.scrollHeight
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown, true)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="copilot-sheet">
      <div
        v-if="open"
        class="copilot-sheet__backdrop"
        @click.self="close"
      >
        <section
          ref="dialogRef"
          class="copilot-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="AI Copilot"
        >
          <header class="copilot-sheet__header">
            <span class="copilot-sheet__title">
              <Icon name="sparkles" :size="16" decorative /> Copilot
            </span>
            <button
              type="button"
              class="copilot-sheet__close"
              aria-label="Close copilot"
              @click="close"
            >
              <Icon name="x" :size="18" decorative />
            </button>
          </header>

          <div v-if="isEmpty" class="copilot-sheet__empty">
            <p class="copilot-sheet__empty-title">Ask me anything about your pilot data.</p>
            <div class="copilot-sheet__prompts">
              <button
                v-for="prompt in prompts"
                :key="prompt"
                type="button"
                class="copilot-sheet__prompt"
                :disabled="isStreaming"
                @click="onChip(prompt)"
              >
                {{ prompt }}
              </button>
            </div>
          </div>

          <ul v-else ref="listRef" class="copilot-sheet__messages">
            <ChatMessage
              v-for="msg in messages"
              :key="msg.id"
              :role="msg.role"
              :text="msg.text"
            />
            <li v-if="isStreaming" class="copilot-sheet__typing">
              <span class="copilot-sheet__typing-dot" />
              <span class="copilot-sheet__typing-dot" />
              <span class="copilot-sheet__typing-dot" />
            </li>
          </ul>

          <p v-if="error" class="copilot-sheet__error" role="alert">{{ error }}</p>

          <form class="copilot-sheet__form" @submit.prevent="onSubmit">
            <input
              ref="inputRef"
              v-model="draft"
              type="text"
              class="copilot-sheet__input"
              placeholder="Ask the copilot…"
              autocomplete="off"
              :disabled="isStreaming"
            >
            <button
              type="submit"
              class="copilot-sheet__send"
              aria-label="Send message"
              :disabled="!draft.trim() || isStreaming"
            >
              <Icon name="send" :size="16" decorative />
            </button>
          </form>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.copilot-sheet {
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
  height: min(78dvh, 600px);
  background: var(--color-bg);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
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

    &:hover {
      background: var(--color-surface-alt);
      color: var(--color-text-primary);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }
  }

  &__empty {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-6) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    align-items: stretch;
  }

  &__empty-title {
    margin: 0;
    text-align: center;
    color: var(--color-text-secondary);
    font-size: var(--fs-base);
  }

  &__prompts {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__prompt {
    width: 100%;
    text-align: left;
    padding: var(--space-3);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: var(--fs-base-sm);
    font-weight: var(--fw-medium);
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;

    &:hover:not(:disabled) {
      background: var(--color-surface-alt);
      border-color: var(--color-text-muted);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }
  }

  &__messages {
    list-style: none;
    margin: 0;
    padding: var(--space-3) var(--space-4);
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__typing {
    align-self: flex-start;
    display: inline-flex;
    gap: 4px;
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface-alt);
    border-radius: var(--radius-lg);
    border-bottom-left-radius: var(--space-1);
  }

  &__typing-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-text-secondary);
    animation: copilot-typing 1.2s ease-in-out infinite;

    &:nth-child(2) { animation-delay: 0.15s; }
    &:nth-child(3) { animation-delay: 0.3s; }
  }

  &__error {
    margin: 0;
    padding: var(--space-2) var(--space-4);
    font-size: var(--fs-sm);
    color: var(--color-danger);
    background: rgba(204, 26, 58, 0.06);
  }

  &__form {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    padding-bottom: max(var(--space-3), env(safe-area-inset-bottom));
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
  }

  &__input {
    flex: 1;
    height: 40px;
    padding: 0 var(--space-3);
    background: var(--color-surface-alt);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: var(--fs-base);

    &:focus {
      outline: none;
      border-color: var(--color-red);
      box-shadow: var(--shadow-focus);
    }

    &:disabled {
      opacity: 0.6;
    }

    &::placeholder {
      color: var(--color-text-muted);
    }
  }

  &__send {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--color-red);
    border: 0;
    border-radius: 50%;
    color: #fff;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s ease;

    &:hover:not(:disabled) {
      background: var(--color-red-dark);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
    }
  }
}

@keyframes copilot-typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-3px); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .copilot-sheet__typing-dot { animation: none !important; }
}

.copilot-sheet-enter-active {
  transition: opacity var(--modal-open-dur, 200ms) ease;
}
.copilot-sheet-leave-active {
  transition: opacity var(--modal-close-dur, 150ms) ease;
}
.copilot-sheet-enter-active .copilot-sheet {
  transition:
    transform var(--modal-open-dur, 200ms) ease,
    opacity   var(--modal-open-dur, 200ms) ease;
}
.copilot-sheet-leave-active .copilot-sheet {
  transition:
    transform var(--modal-close-dur, 150ms) ease,
    opacity   var(--modal-close-dur, 150ms) ease;
}
.copilot-sheet-enter-from,
.copilot-sheet-leave-to {
  opacity: 0;
}
.copilot-sheet-enter-from .copilot-sheet,
.copilot-sheet-leave-to .copilot-sheet {
  transform: translateY(20%);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .copilot-sheet-enter-active,
  .copilot-sheet-leave-active,
  .copilot-sheet-enter-active .copilot-sheet,
  .copilot-sheet-leave-active .copilot-sheet {
    transition: none !important;
  }
}
</style>
