<script setup lang="ts">
/**
 * Icon
 * Thin wrapper around @lucide/vue. Defaults to 1.75 stroke width to stay
 * inside the brief's "1.5–2px stroke, line-style only" requirement.
 *
 * Tree-shaking: import ONLY the named icons used across app + stories.
 * The previous `import * as icons` pulled the whole lucide namespace and
 * defeated tree-shaking (~hundreds of unused components). This explicit map
 * keeps the bundle to exactly what we render.
 */
import {
  Home,
  Calendar,
  Book,
  MoreHorizontal,
  Bell,
  Clock,
  LogOut,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  X,
  Check,
  FileText,
  Plane,
  ChevronLeft,
  ChevronRight,
} from '@lucide/vue'

// The complete set of icons rendered anywhere in app + stories. Adding a new
// icon means adding its named import here — this is the tree-shaking boundary.
const ICON_MAP = {
  Home,
  Calendar,
  Book,
  MoreHorizontal,
  Bell,
  Clock,
  LogOut,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  X,
  Check,
  FileText,
  Plane,
  ChevronLeft,
  ChevronRight,
} as const

interface Props {
  name: string
  size?: number | string
  strokeWidth?: number
  decorative?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  size: 20,
  strokeWidth: 1.75,
  decorative: false,
})

const resolved = computed(() => {
  // lucide exports are PascalCase, e.g. `Plane`, `AlertTriangle`. Allow
  // kebab (`alert-triangle`), snake, and PascalCase from the caller.
  const table = ICON_MAP as Record<string, unknown>
  const pascal = props.name
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
  if (table[pascal]) return table[pascal]
  if (table[props.name]) return table[props.name]
  // Case-insensitive fallback (e.g. caller passed "HOME").
  const key = Object.keys(table).find((k) => k.toLowerCase() === props.name.toLowerCase())
  return key ? table[key] : null
})
</script>

<template>
  <component
    :is="resolved"
    v-if="resolved"
    class="icon"
    :class="{ 'icon--decorative': decorative }"
    :size="size"
    :stroke-width="strokeWidth"
    :aria-hidden="decorative ? 'true' : undefined"
  />
  <span v-else class="icon icon--missing" :aria-label="name">?</span>
</template>

<style scoped lang="scss">
.icon {
  display: inline-block;
  flex-shrink: 0;
  color: currentColor;

  &--missing {
    width: 20px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed var(--color-text-muted);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    font-size: var(--fs-xs);
  }
}
</style>
