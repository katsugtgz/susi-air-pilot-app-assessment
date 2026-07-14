<script setup lang="ts">
/**
 * CopilotBubble
 * Floating, draggable round button that opens the AI Copilot bottom sheet.
 * Tap emits 'open' / opens the sheet; drag (pointer move > DRAG_THRESHOLD) is
 * suppressed from tap, and on release the bubble snaps to the nearest
 * horizontal viewport edge with a smooth CSS transition.
 *
 * Position is persisted to localStorage (key 'copilot-bubble-pos') so the
 * pilot's chosen spot survives reloads. Stays within the viewport (and above
 * the BottomNavigation safe area).
 *
 * Mount client-only + lazy (Lazy prefix or defineAsyncComponent) — never SSR'd.
 * The idle pulse respects `prefers-reduced-motion`.
 */
import { useCopilotChat } from '~/composables/useCopilotChat'

const STORAGE_KEY = 'copilot-bubble-pos'
const DRAG_THRESHOLD = 6 // px — move further than this and we treat it as drag.
const BUBBLE_SIZE = 56
const EDGE_MARGIN = 16

const emit = defineEmits<{ (e: 'open'): void }>()

const isSheetOpen = ref(false)
const { messages, isStreaming, error, send } = useCopilotChat()

const x = ref(0)
const y = ref(0)
const initialized = ref(false)

let dragging = false
let dragStartX = 0
let dragStartY = 0
let dragStartBubbleX = 0
let dragStartBubbleY = 0
let dragMoved = false
let pointerId: number | null = null

function clampToViewport(posX: number, posY: number): { x: number; y: number } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390
  const vh = typeof window !== 'undefined' ? window.innerHeight : 844
  // Reserve room for the sticky bottom nav (default layout sets
  // --space-nav-height, 72px); env(safe-area-inset-bottom) isn't readable
  // from JS, so the nav-height reserve doubles as the safe-area buffer.
  const navHeight = 72

  const maxX = vw - BUBBLE_SIZE - EDGE_MARGIN
  const maxY = vh - BUBBLE_SIZE - navHeight
  return {
    x: Math.min(Math.max(EDGE_MARGIN, posX), Math.max(EDGE_MARGIN, maxX)),
    y: Math.min(Math.max(EDGE_MARGIN, posY), Math.max(EDGE_MARGIN, maxY)),
  }
}

function defaultPosition(): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: EDGE_MARGIN, y: 320 }
  // Default to bottom-right above the bottom nav.
  return clampToViewport(window.innerWidth - BUBBLE_SIZE - EDGE_MARGIN, window.innerHeight - BUBBLE_SIZE - 88)
}

function loadPosition(): void {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { x?: number; y?: number }
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        const clamped = clampToViewport(parsed.x, parsed.y)
        x.value = clamped.x
        y.value = clamped.y
        initialized.value = true
        return
      }
    }
  } catch {
    // localStorage unavailable or malformed; fall through to default.
  }
  const def = defaultPosition()
  x.value = def.x
  y.value = def.y
  initialized.value = true
}

function persistPosition(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: x.value, y: y.value }))
  } catch {
    // Best-effort — private mode etc.
  }
}

function snapToNearestEdge(): void {
  if (typeof window === 'undefined') return
  const vw = window.innerWidth
  const leftDist = x.value
  const rightDist = vw - BUBBLE_SIZE - x.value
  const targetX = leftDist <= rightDist ? EDGE_MARGIN : vw - BUBBLE_SIZE - EDGE_MARGIN
  const clamped = clampToViewport(targetX, y.value)
  x.value = clamped.x
  y.value = clamped.y
  persistPosition()
}

function onPointerDown(event: PointerEvent) {
  // Only respond to primary pointer (left mouse / touch / pen).
  if (event.button !== undefined && event.button !== 0) return
  dragging = true
  dragMoved = false
  dragStartX = event.clientX
  dragStartY = event.clientY
  dragStartBubbleX = x.value
  dragStartBubbleY = y.value
  pointerId = event.pointerId
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging) return
  const dx = event.clientX - dragStartX
  const dy = event.clientY - dragStartY
  if (!dragMoved && Math.hypot(dx, dy) <= DRAG_THRESHOLD) return
  dragMoved = true
  const next = clampToViewport(dragStartBubbleX + dx, dragStartBubbleY + dy)
  x.value = next.x
  y.value = next.y
}

function onPointerUp(event: PointerEvent) {
  if (!dragging) return
  dragging = false
  if (pointerId !== null) {
    ;(event.currentTarget as HTMLElement).releasePointerCapture?.(pointerId)
    pointerId = null
  }
  if (!dragMoved) {
    // Tap → open the sheet.
    openSheet()
  } else {
    // Drag end → snap to nearest edge.
    snapToNearestEdge()
  }
}

function openSheet() {
  isSheetOpen.value = true
  emit('open')
}

function closeSheet() {
  isSheetOpen.value = false
}

onMounted(() => {
  loadPosition()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onResize)
  }
})

function onResize() {
  const clamped = clampToViewport(x.value, y.value)
  x.value = clamped.x
  y.value = clamped.y
  persistPosition()
}

const bubbleStyle = computed(() => ({
  left: `${x.value}px`,
  top: `${y.value}px`,
}))
</script>

<template>
  <div class="copilot-root">
    <button
      v-show="initialized"
      type="button"
      class="copilot-bubble"
      :class="{ 'copilot-bubble--snapping': !dragging }"
      :style="bubbleStyle"
      aria-label="Open AI copilot"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @click.prevent
    >
      <Icon name="sparkles" :size="22" />
    </button>

    <CopilotSheet
      :open="isSheetOpen"
      :messages="messages"
      :is-streaming="isStreaming"
      :error="error"
      @close="closeSheet"
      @send="(text) => send(text)"
    />
  </div>
</template>

<style scoped lang="scss">
.copilot-root {
  // Root is purely a holder — the bubble is positioned absolutely via
  // top/left in viewport coordinates.
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
}

.copilot-bubble {
  position: absolute;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 0;
  background: var(--color-red);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  pointer-events: auto;
  touch-action: none;
  user-select: none;
  animation: copilot-pulse 2.4s ease-in-out infinite;

  &:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus), var(--shadow-md);
  }

  &:hover {
    background: var(--color-red-dark);
  }

  &:active {
    transform: scale(0.96);
  }

  &--snapping {
    transition: left 0.25s ease, top 0.25s ease;
  }
}

@keyframes copilot-pulse {
  0%, 100% { box-shadow: var(--shadow-md), 0 0 0 0 rgba(204, 26, 58, 0.35); }
  50% { box-shadow: var(--shadow-md), 0 0 0 8px rgba(204, 26, 58, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .copilot-bubble { animation: none !important; }
  .copilot-bubble--snapping { transition: none !important; }
}
</style>
