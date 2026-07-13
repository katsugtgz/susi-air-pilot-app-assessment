# Composables (Pure Business Logic)

## OVERVIEW

5 pure-function composables encoding the brief's domain rules: rolling-sum chart math, document expiry badges, flight-hour limits, duty calendar derivation, loading delay. Plus `brief-verification.spec.ts` — a cross-cutting canary asserting the brief's worked examples end-to-end.

## STRUCTURE

```
app/composables/
├── useRollingSum.ts           # 14-day rolling sum + ±7-day display window for chart
├── useDocumentExpiry.ts       # Document badge logic (safe/soon/expired) per brief §3.1
├── useFlightLimits.ts         # Flight-hour limit thresholds + remaining calculations
├── useDutyCalendar.ts         # Schedule grid derivation (tick vs number badge logic)
├── useLoadingDelay.ts         # UI helper — artificial delay for loading states
├── brief-verification.spec.ts # Canary: asserts brief's CRITICAL invariants (not a unit test)
└── *.spec.ts                  # Co-located pure-function specs (no Vue mount)
```

## WHERE TO LOOK

| Need | Composable | Key Property |
|---|---|---|
| Chart data assembly | `useRollingSum` | Display window is ALWAYS ±7 days from today (2026-05-31), independent of `windowDays` toggle |
| Document badge (safe/soon/expired) | `useDocumentExpiry` | 5 worked cases: recurrent→safe, ppc→safe, license→expired, medical→soon, security→expired |
| Limit card values | `useFlightLimits` | Computes remaining hours vs regulatory thresholds |
| Calendar cell content | `useDutyCalendar` | Tick only when `count_logbooks === count_schedules` |
| Skeleton→content transition | `useLoadingDelay` | UI polish — delays content swap to avoid flash |

## CONVENTIONS (specific to this dir)

- **Naming**: `use*.ts` — exported as named function (not default export).
- **Dual export pattern** (CRITICAL): each composable exports BOTH:
  1. A **pure function** (`computeDocumentExpiry(input): Result`) — no Vue deps, unit-testable without mount
  2. A **reactive wrapper** (`useDocumentExpiry(refOrGetter): ComputedRef<Result>`) — for `<script setup>` consumers
  - The wrapper delegates to the pure function via `computed(() => computeX(toValue(...)))`.
- **`MaybeRefOrGetter<T>` + `toValue()`**: reactive wrappers accept refs, getters, or plain values. Always unwrap with `toValue()` inside `computed`.
- **Throws on invalid input**: `Number.isNaN(date.getTime())` → `throw new Error('useDocumentExpiry: invalid date...')`. No silent NaN propagation.
- **UTC midnight normalization**: date math uses `Date.UTC(year, month, day)` helper (`toUtcMidnight(d)`), NOT local time. DST boundaries don't shift day counts.
- **Pure functions have NO Vue imports** — `computeRollingSum`, `computeDocumentExpiry` are framework-agnostic.
- **Explicit imports in `.ts` files** — composables do NOT use Nuxt auto-imports (portability: they're libraries usable outside Nuxt).
- **Specs are pure-function tests** — test the `compute*` functions directly, no `@vue/test-utils` mount needed.
- **Globals enabled**: `describe`/`it`/`expect` need no imports (`vitest.config.ts` → `globals: true`).

## ANTI-PATTERNS

- **NEVER import Pinia stores** in composables — they're consumed by organisms which themselves don't touch stores. Keep the chain pure.
- **NEVER import `~/assets/data/*.json`** — composables receive data as arguments, they don't fetch.
- **NEVER add side effects** (network, storage, DOM) — pure functions only.
- **NEVER use auto-imports** here — `.ts` files keep explicit imports for portability.

## NOTES

- **`brief-verification.spec.ts` is mis-located** — it's a cross-cutting integration test (asserts brief's CRITICAL properties end-to-end), not a `brief-verification.ts` unit test. There's no matching composable. Left here as a canary; consider moving to `tests/integration/` if the dir grows.
- **`useRollingSum.spec.ts` is the highest-value test file** (29 tests) — hand-verifies the brief's worked 14-day fixture (values 1–14), asserting all 15 chart points match explicitly-computed expected values.
- **Coverage**: composables are the most thoroughly tested code — several at 100% across all four coverage metrics.
- **Consumed by molecules/organisms via props/computed** — e.g. `DocumentListItem.vue` calls `computeDocumentExpiry` inside a `computed`.
