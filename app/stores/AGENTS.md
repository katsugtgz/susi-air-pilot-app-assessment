# Pinia Stores (State + Data Layer)

## OVERVIEW

5 Pinia setup stores. Each owns one JSON mock from `app/assets/data/`, exposing typed state via `defineStore('name', () => {...})` composition syntax. These are the SOLE consumers of mock JSON — pages read from stores and pass data down to organisms as props.

## STRUCTURE

```
app/stores/
├── pilot.ts        # Pilot profile (name, pilotId, totalFlightHours, initials) ← mock-flight-hours.json
├── documents.ts    # Document list (license, medical, ppc, etc.) ← mock-documents.json
├── schedules.ts    # Schedule + legend + logbook counts + today ← mock-schedules.json
├── flightHours.ts  # Flight hours history + limits + chartBounds ← mock-flight-hours.json
└── news.ts         # News feed items ← mock-news.json
```

**Note**: `pilot.ts` and `flightHours.ts` BOTH read from `mock-flight-hours.json` (pilot profile is nested inside that file, not a separate file). All 4 JSON files use the `mock-` prefix.

## WHERE TO LOOK

| Need | Store | Notes |
|---|---|---|
| Pilot identity/header | `usePilotStore` | Profile data for `DashboardHeader` |
| Document list + badges | `useDocumentsStore` | Feeds `MyDocumentsList`; badge logic lives in `useDocumentExpiry` composable |
| Schedule grid data | `useSchedulesStore` | Feeds `ScheduleCalendarGrid` + `ScheduleLegend`; legend codes (`TRD` etc.) driven from here |
| Flight hours chart | `useFlightHoursStore` | Feeds `FlightHoursTrendChart`; limit math in `useFlightLimits` composable |
| News carousel | `useNewsStore` | Feeds `LatestNewsCarousel` |

## CONVENTIONS (specific to this dir)

- **Setup store pattern**: `defineStore('name', () => { const state = ref(...); return { state }; })` — NOT the options API (`{ state, getters, actions }`).
- **JSON imports at top**: `import pilotData from '~/assets/data/mock-flight-hours.json'` — each store imports its own mock (all prefixed `mock-`).
- **Typed state**: `ref<TYPE>(jsonData)` — types from `~/types/index.ts`. The JSON shape is asserted by the type, not runtime-validated.
- **Explicit imports in `.ts` files** (`defineStore`, `ref`, `computed` from 'pinia'/'vue') — no auto-import reliance (portability).
- **Rich computed getters**: stores expose pre-computed lookup maps, not just raw state. Pattern:
  - `legendByCode = computed<Record<string, Legend>>(() => /* build map */)`
  - `scheduleByDate = computed<Map<string, Schedule>>(() => /* build map */)`
  - `nextUpcomingSchedule = computed(() => schedules.filter(s => s.status === 1 && s.duty_date >= today).sort(...)[0] ?? undefined)`
- **ISO string compare is safe** — all dates are zero-padded `yyyy-mm-dd`, so `localeCompare` sorts correctly without Date parsing.
- **`noUncheckedIndexedAccess`-safe indexing**: use `parts[0]?.[0] ?? ''` and `[0] ?? undefined` patterns (TS 6 strict).
- **Co-located `*.spec.ts`** — test state shape, getters, actions.
- **Globals enabled** in specs: `describe`/`it`/`expect` need no imports.

## ANTI-PATTERNS

- **NEVER import these stores from atoms/molecules/organisms** — only pages and layouts may call `useXxxStore()`. Components receive data via props.
- **NEVER import `~/assets/data/*.json` outside this dir** (exception: `*.stories.ts` fixtures). Stores are the data gateway.
- **NEVER use options-store syntax** — `defineStore('name', { state, getters, actions })` is not used anywhere. Stick to setup syntax.
- **NEVER put derived UI logic in stores** — badge calculations, chart math, etc. belong in `~/composables/`. Stores hold state + simple getters only.

## NOTES

- **No persistence** — stores reset on reload. No `pinia-plugin-persistedstate`. Mock-data-only by design.
- **No async actions** — all data is synchronous JSON import. Real version would have `async function fetchXxx()` hitting `/api/*`.
- **Coverage gap**: stores are NOT in `vitest.config.ts` `coverage.include` (only `app/components/**/*.vue` + `app/composables/**/*.ts`). They have specs but aren't measured in the 98% headline.
- **Single source of truth**: when the brief mentions "TRD not TRV" or specific document badge cases, the JSON in `app/assets/data/` is authoritative — components must not hardcode these values.
