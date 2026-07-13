# Atomic Design Components

## OVERVIEW

30 components across 3 atomic layers. Each layer has a strict contract on what it may import/call. Pages are the composition root — they pull from Pinia stores and pass data as props.

## STRUCTURE

```
app/components/
├── atoms/       # 11 primitives — pure props, no stores, no composables
├── molecules/   # 9 compositions — atoms + at most 1 pure composable, no stores
└── organisms/   # 10 sections — props-driven, composables OK, NO direct store access
```

## ATOMIC CONTRACTS (enforced by convention, asserted by specs)

| Layer | Props In | Emits Out | Composables | Pinia Stores | JSON Imports |
|---|---|---|---|---|---|
| **atoms** | yes | yes | **NEVER** | **NEVER** | **NEVER** |
| **molecules** | yes | yes | ≤1 pure composable | **NEVER** | **NEVER** |
| **organisms** | yes | yes | yes (pure) | **NEVER** (pages pass data down) | **NEVER** |
| **pages** | — | — | yes | **YES** (composition root) | via stores only |

Violations break Storybook isolation and testability. The "no store access below page" rule is what keeps organisms Storybook-friendly (pass props directly, no mocking).

## WHERE TO LOOK

| Need | Component | Layer |
|---|---|---|
| Button / input / icon | `BaseButton`, `BaseInput`, `Icon` | atoms |
| Alert / badge / chip / avatar | `Alert`, `Badge`, `Chip`, `Avatar` | atoms |
| Progress (bar/ring) / skeleton | `ProgressBar`, `ProgressRing`, `Skeleton` | atoms |
| Brand logo | `BrandLogo` | atoms |
| Form field wrapper | `FormField` | molecules |
| Calendar day (tick vs number logic) | `CalendarDay` | molecules |
| Document item (expiry badge) | `DocumentListItem` (calls `computeDocumentExpiry`) | molecules |
| News / flight route / limit card | `NewsCard`, `FlightRoute`, `LimitCard` | molecules |
| Sign in form | `SignInForm` | organisms |
| Dashboard header / bottom nav | `DashboardHeader`, `BottomNavigation` (in `layouts/default.vue`) | organisms |
| Schedule grid / legend | `ScheduleCalendarGrid`, `ScheduleLegend` | organisms |
| Flight hours chart | `FlightHoursTrendChart` (chart.js + vue-chartjs) | organisms |
| News carousel / docs list | `LatestNewsCarousel`, `MyDocumentsList` | organisms |

## CONVENTIONS (specific to this dir)

- **`<script setup lang="ts">`** with Composition API — no Options API anywhere.
- **Props**: `interface Props { ... }` then `withDefaults(defineProps<Props>(), { variant: 'primary', ... })`. Never use runtime defaults object.
- **Emits**: `defineEmits<{ (e: 'click', payload: MouseEvent): void }>()` — typed call signatures.
- **Slots**: named slots for composition — `<slot name="icon" />` + default `<slot />`. Use `$slots.icon` conditional check in template.
- **Auto-imports apply**: drop `import { ref, computed } from 'vue'` and component imports. `.vue` files rely on Nuxt auto-imports (mirrored in Vitest/Storybook via `unplugin-*`).
- **BEM in `<style scoped lang="scss">`**: `block__element--modifier`. Block name = filename kebab-case (e.g. `BaseButton.vue` → `.base-button`, `Alert.vue` → `.alert`). Max ONE level of `&__element` / `&--modifier` nesting.
- **`:deep()` for slotted content**: style projected `<slot />` content via `:deep(strong) { ... }` — see `Alert.vue`.
- **Per-variant mapping objects**: variant-specific config (icons, colors) as `const ICON_BY_VARIANT: Record<Variant, string> = { info: 'info', ... }` — declarative, one place.
- **Design tokens via CSS custom properties**: `var(--fw-bold)`, `var(--shadow-sm)`, `var(--color-red)`, etc. Don't hardcode values that exist as tokens. **Exception**: chart.js colors are hardcoded (chart.js needs raw values, not CSS vars).
- **A11y patterns**: `:focus-visible { box-shadow: var(--shadow-focus) }` + `:active:not(.disabled) { transform: translateY(0.5px) }` on interactive atoms.
- **Icons via `<Icon name="lucide-name" />`** — wraps `@lucide/vue`, defaults to `strokeWidth: 1.75` (within brief's 1.5–2px rule). Line-style only.
- **Chart tree-shaking**: `FlightHoursTrendChart.vue` registers only used chart.js components (`Title, Tooltip, PointElement, LineElement, LinearScale, CategoryScale, Filler`) — NOT `chart.js/auto`.
- **Chart exposure pattern**: `defineExpose({ chartData, chartOptions })` so specs read structured data without canvas parsing. Follow this for any chart component.
- **`animation: { duration: 0 }`** in chart options — deterministic for tests (no async animation waits).
- **Co-located files per component**: `<Name>.vue` + `<Name>.spec.ts` + `<Name>.stories.ts`. All three expected for every component.

## ANTI-PATTERNS

- **NEVER import `~/stores/*` or call `useXxxStore()` in atoms/molecules/organisms** — data flows in via props only.
- **NEVER import `~/assets/data/*.json`** — stores are the sole JSON consumers (exception: `*.stories.ts` fixtures).
- **NEVER hardcode schedule codes** (`TRD`, `DTY`, etc.) — drive from the `legend[]` prop. `ScheduleLegend.spec.ts` asserts `TRD` (never `TRV`).
- **NEVER use utility classes** (Tailwind/UnoCSS) — BEM/SCSS only.
- **NEVER exceed one level of BEM nesting** — `&__element { &--modifier {} }` is the max. Deeper = refactor.
- **NEVER use `!important`** — zero occurrences in codebase.

## NOTES

- **Naming inconsistency**: `BaseButton.vue` and `BaseInput.vue` carry a `Base` prefix; the other 9 atoms do not (Alert, Avatar, Badge, BrandLogo, Chip, Icon, ProgressBar, ProgressRing, Skeleton). README lists them as "Button"/"Input". Not yet normalized — pick the prevailing bare-name convention when adding new atoms.
- **`pathPrefix: false`** in `nuxt.config.ts` registers components by bare filename: `<SignInForm />` not `<OrganismsSignInForm />`. Names must be unique across the 3 subdirs.
- **Storybook stories** can import JSON directly (they're test fixtures, not production code).
- **`defineExpose`** is used to expose internal reactive state for spec assertions — see `FlightHoursTrendChart.spec.ts`.
