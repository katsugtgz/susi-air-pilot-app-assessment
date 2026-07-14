<script setup lang="ts">
/**
 * ChatMessage
 * Single chat bubble. `user` role aligns right; `assistant` role aligns left
 * with a small sparkles glyph. Text is rendered with `white-space: pre-wrap`
 * so streamed line breaks stay intact without pulling in a markdown lib.
 */
interface Props {
  role: 'user' | 'assistant'
  text: string
}
defineProps<Props>()
</script>

<template>
  <li class="chat-message" :class="`chat-message--${role}`">
    <span v-if="role === 'assistant'" class="chat-message__avatar" aria-hidden="true">
      <Icon name="sparkles" :size="14" />
    </span>
    <p class="chat-message__bubble">{{ text }}</p>
  </li>
</template>

<style scoped lang="scss">
.chat-message {
  display: flex;
  gap: var(--space-2);
  margin: 0;
  max-width: 100%;

  &--user {
    flex-direction: row-reverse;
    align-self: flex-end;
  }

  &--assistant {
    align-self: flex-start;
  }

  &__avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(204, 26, 58, 0.08);
    color: var(--color-red);
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__bubble {
    margin: 0;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-lg);
    font-size: var(--fs-base-sm);
    line-height: 1.4;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: anywhere;
    max-width: min(80%, 280px);
  }

  &--user &__bubble {
    background: var(--color-red);
    color: #fff;
    border-bottom-right-radius: var(--space-1);
  }

  &--assistant &__bubble {
    background: var(--color-surface-alt);
    color: var(--color-text-primary);
    border-bottom-left-radius: var(--space-1);
  }
}
</style>
