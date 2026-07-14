<script setup lang="ts">
import type { NewsItem } from '~/types'

interface Props {
  items: NewsItem[]
  title?: string
}
const props = withDefaults(defineProps<Props>(), { title: 'Latest News' })

defineEmits<{ (e: 'select', id: string): void }>()

const scrollRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)

function onScroll() {
  const el = scrollRef.value
  if (!el || props.items.length === 0) return
  const cardWidth = el.scrollWidth / props.items.length
  activeIndex.value = Math.round(el.scrollLeft / cardWidth)
}
</script>

<template>
  <section class="latest-news-carousel">
    <header class="latest-news-carousel__header">
      <h2 class="latest-news-carousel__title">{{ title }}</h2>
    </header>
    <div class="latest-news-carousel__viewport">
      <div
        ref="scrollRef"
        class="latest-news-carousel__scroll"
        role="region"
        :aria-label="title"
        tabindex="0"
        @scroll.passive="onScroll"
      >
        <NewsCard
          v-for="(item, index) in items"
          :id="item.id"
          :key="item.id"
          :category="item.category"
          :title="item.title"
          :excerpt="item.excerpt"
          :image-url="item.imageUrl"
          :date="item.date"
          :read-time="item.readTime"
          :eager="index === 0"
          @click="$emit('select', item.id)"
        />
      </div>
    </div>
    <div v-if="items.length > 1" class="latest-news-carousel__dots" aria-hidden="true">
      <span
        v-for="(item, index) in items"
        :key="item.id"
        class="latest-news-carousel__dot"
        :class="{ 'latest-news-carousel__dot--active': index === activeIndex }"
      />
    </div>
    <span class="latest-news-carousel__sr-only" role="status" aria-live="polite">
      {{ activeIndex + 1 }} of {{ items.length }}
    </span>
  </section>
</template>

<style scoped lang="scss">
.latest-news-carousel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-2);

  &__header {
    padding: 0 var(--space-2);
  }

  &__title {
    margin: 0;
    font-size: var(--fs-lg);
    font-weight: var(--fw-bold);
    color: var(--color-text-primary);
  }

  &__viewport {
    position: relative;
  }

  &__scroll {
    display: flex;
    gap: var(--space-3);
    overflow-x: auto;
    overflow-y: hidden;
    padding: var(--space-2);
    margin: calc(-1 * var(--space-2));
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--shadow-focus);
      border-radius: var(--radius-md);
    }

    :deep(.news-card) {
      scroll-snap-align: start;
      flex-shrink: 0;
    }
  }

  &__viewport::before,
  &__viewport::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: var(--space-6);
    z-index: 1;
    pointer-events: none;
  }

  &__viewport::before {
    left: 0;
    background: linear-gradient(to right, var(--color-bg), transparent);
  }

  &__viewport::after {
    right: 0;
    background: linear-gradient(to left, var(--color-bg), transparent);
  }

  &__dots {
    display: flex;
    justify-content: center;
    gap: var(--space-2);
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: var(--radius-full);
    background: var(--color-border);
    transition:
      background var(--duration-quick) var(--ease-smooth-out),
      width var(--duration-quick) var(--ease-smooth-out);

    &--active {
      background: var(--color-chart-accent);
      width: 16px;
    }
  }

  &__sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .latest-news-carousel__dot {
    transition: none;
  }
}
</style>
