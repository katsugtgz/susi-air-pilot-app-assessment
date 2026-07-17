# Susi Air Pilot Companion App

> Mobile-first Nuxt 4 PWA for Susi Air pilots — Sign In, dashboard, calendar, logbook, profile, and a floating AI Copilot assistant. All data is mock JSON; no backend or auth. Built as a technical assessment.

**Live demo:** <https://susi-air-pilot-app-assessment-nu.vercel.app/> · [Upstream app](https://susi-air-pilot-app-assessment.vercel.app/) · [Storybook](https://susi-air-pilot-app-assessment-story.vercel.app/)

Builds on upstream `main` @ `f7181c7` (Sign In / Home / Schedule base, atomic design, brief-locked business rules). This fork adds a motion-design layer, icon tree-shaking, accessibility hardening, a Remote Ops Briefing design system, and a transparent demo-provenance layer.

## Product story

This app is built to read like a **Remote Ops Briefing** — one screen that answers *"what next, what changed, what needs attention"* before the pilot scrolls. Every surface surfaces data freshness and demo status honestly, so an interviewer can trust what they see in 30 seconds.

**Design contract** lives in [`DESIGN.md`](./DESIGN.md) — 8 sections covering the navy/red/cyan palette, typography scale, spacing tokens, motion system, responsive breakpoints (375 / 768 / 1280), accessibility constraints (WCAG 2.2 AA, keyboard nav, reduced-motion), and the banned patterns that keep the codebase clean.

**Truthful demo layer** — three composables derive all dynamic content from the existing mock JSON, so nothing is faked:

- `useDemoTimeline` — computes data provenance (latest snapshot date, source count, human status text) so every page can show *when* this data is from.
- `useUpcomingDutyPreview` — derives the next duty's route, STD/STA, flight number, and aircraft from the real `flightLegs` store, replacing the upstream hardcoded placeholder route.
- `useActionItems` — ranks a pilot's open actions (next duty, expiring/expired documents, incomplete logbook) into a single actionable list.

Three primitives render that truth:

- `DataFreshnessStrip` — compact banner showing data source + snapshot date.
- `SyncStatusPill` — honest status badge (`demo` / `cached` / `offline`) with timestamp.
- `ActionCenter` — ranked action list with typed navigation intents (open duty detail, go to documents, open logbook).

## Features

**Core surfaces**

- **Sign In** (`/`) — no auth; any input navigates to `/home` per brief. A visible **Demo mode** alert upfront sets honest expectations.
- **Home dashboard** (`/home`) — Remote Ops Briefing layout: data freshness strip, sync status pill, next duty (real route + times from flight legs), ranked action center, flight-hours trend chart (fixed ±7-day display window, 1w / 1m / 3m / 6m / 1y range toggle), hours-to-limit cards (28 / 90 / 365-day + annual thresholds), document list with expiry badges, latest news carousel. Desktop gets a 2-column operations grid (≥768px) while preserving mobile reading order.
- **Schedule** (`/schedule`) — month calendar grid, tick-vs-number badges driven by the `legend[]` JSON prop (never hardcoded codes), tap-a-date detail modal, legend, data freshness header with viewing-month context.
- **Logbook** (`/logbook`) — month-grouped qualifying entries (`count_logbooks > 0`) derived from the schedules store via the pure `useLogbookEntries` composable. Each row shows date, duty badge tinted from the legend color, base, flight counts, and a verified / pending status. Summary strip: entries / verified / total flight hours.
- **More** (`/more`) — pilot profile header (name, ID, total hours from the pilot store) + transparent Demo & data status section + grouped settings menu (Account / Preferences / About) built from the `SettingsListItem` molecule. Sign out returns to `/`.
- **Documents** (`/documents`) — filterable document list with expiry badges and warning windows.

**AI Copilot** — floating, draggable assistant bubble that opens a chat sheet. Powered by Gemini via `@google/genai`:

- Mini in-memory RAG over the mock data (top-5 chunk retrieval; full-corpus fallback when embeddings aren't precomputed).
- Click-to-ask prompt templates for common pilot questions.
- SSE token streaming.
- Function calling: the model may invoke `lookupFlightByDate(date)` to read the schedules mock.
- API key rotation with retry-on-429 (round-robin across `NUXT_GEMINI_API_KEYS`).
- 503-graceful when no key is configured.

**Polish**

- Token-driven motion system (vendored transitions.dev layer) across page transitions, limit-card digits, skeleton → content crossfades, range-toggle pill, badges, modals, and chart redraws — every animation has a `prefers-reduced-motion` fallback.
- Shared skeleton-reveal + chart-crossfade CSS utilities (`app/assets/css/`).
- Icon tree-shaking restored (named-import map replaces the full `@lucide/vue` namespace).
- Lazy-loaded, async-decoded news images.
- Hand-rolled installable PWA (cache-first shell + network-first nav).
- `UpcomingFlightCard` is now keyboard-accessible (renders as `<button>` when `actionable`) and opens the duty detail sheet on select.

## Quick start

```bash
npm install        # Node 22+
npm run dev        # http://localhost:3000 (lands on Sign In at /)
npm test           # Vitest one-shot (561 specs)
```

Other scripts: `build` · `preview` · `test:coverage` · `test:storybook:ci` · `storybook` · `build-storybook` · `typecheck` · `lint` · `format` · `generate-pwa-icons`.

## AI Copilot setup

1. Copy `.env.example` to `.env`.
2. Set `NUXT_GEMINI_API_KEYS` (comma-separated; round-robins, retries the next key only on HTTP 429). A single `NUXT_GEMINI_API_KEY` is supported as a fallback.
   - Keys map to **server-only** `runtimeConfig.gemini*` in `nuxt.config.ts` — they are **never** exposed to the client bundle. Do not move them to `.public`.
3. *(Optional)* `npm run build-embeddings` precomputes the RAG corpus vectors into `server/data/embeddings.json`. Works without a key — it writes `embedding: null` per chunk and the chat endpoint falls back to full-corpus context.

With no keys configured the app runs normally; `/api/chat` returns `503 AI copilot is not configured` and the Copilot surfaces degrade gracefully.

## Architecture

| Layer | Choice |
|---|---|
| Framework | Nuxt 4 (SSR + Nitro) |
| View | Vue 3 + `<script setup lang="ts">` |
| State | Pinia (`@pinia/nuxt`) |
| Styling | SCSS + BEM (`block__element--modifier`), shared tokens in `tokens.scss` |
| Fonts | `@nuxt/fonts` (Plus Jakarta Sans, self-hosted) |
| Icons | `@lucide/vue` (line-style, 1.75px stroke) |
| Charts | `chart.js@4` + `vue-chartjs@5` (tree-shaken) |
| AI | `@google/genai` (Gemini), Nitro `server/api/chat.post.ts` |
| Component dev | Storybook 10 |
| Unit tests | Vitest 4 + `@vue/test-utils` + happy-dom |
| Story tests | `@storybook/test-runner` (Playwright) |

**Atomic design** — three layers with strict contracts:

- **Atoms** (13) — presentational primitives; props in, emits out; never touch stores or composables.
- **Molecules** (13) — atom compositions + at most one pure composable; no store access.
- **Organisms** (19) — section-level; receive data via props (semi-smart), consume pure composables.

**Folder layout**

```text
app/
├── components/{atoms,molecules,organisms}/  # 13 / 13 / 19 — atomic design
├── composables/          # 14 pure-compute fns, each co-located with *.spec.ts
├── stores/               # 8 Pinia setup stores — ONLY JSON consumers
├── pages/                # index(Sign In), home, schedule, logbook, more, documents
├── layouts/              # default.vue (BottomNav), auth.vue (bare)
├── assets/{data,scss,css}/  # 4 JSON mocks + tokens.scss + shared CSS utilities
└── plugins/pwa.client.ts # SW registration (skips dev)
server/
├── api/chat.post.ts      # SSE streaming endpoint
└── utils/{gemini,rag}.ts # key rotation + RAG
public/                   # manifest.webmanifest, sw.js, logo, pwa-*.png
scripts/build-embeddings.mjs  # precompute RAG vectors
DESIGN.md                 # Remote Ops Briefing design system contract
```

**Pages are the composition root** — they pull from Pinia stores and pass data as props, keeping organisms Storybook-friendly and store-mock-free.

- **14 pure-compute composables** (`useRollingSum`, `useDocumentExpiry`, `useDocumentFilter`, `useFlightLimits`, `useDutyCalendar`, `useDutyDetail`, `useLoadingDelay`, `useLogbookEntries`, `useCopilotChat`, `usePersistedState`, `useTheme`, `useDemoTimeline`, `useUpcomingDutyPreview`, `useActionItems`) — unit-tested independently of Vue.
- **8 Pinia stores** are the **only** consumers of `assets/data/*.json` (stories / specs excepted).
- **Nitro server routes** power the Copilot: `server/api/chat.post.ts` (SSE streaming), `server/utils/gemini.ts` (key rotation + retry-on-429), `server/utils/rag.ts` (embed + retrieve).
- **Auto-imports** (`ref` / `computed` / components / composables / stores) are mirrored into Vitest and Storybook via `unplugin-auto-import` + `unplugin-vue-components`; `components: pathPrefix:false` registers by bare filename.
- **Hand-rolled PWA** (~80 lines across `public/manifest.webmanifest`, `public/sw.js`, `plugins/pwa.client.ts`) — `@vite-pwa/nuxt` was rejected for Nuxt 4 `@nuxt/kit` dedup conflicts.

## Demo-provenance layer

Three composables + three primitives make the mock-data provenance transparent and the dashboard feel alive without faking live integrations:

| Composable | Responsibility |
|---|---|
| `useDemoTimeline` | Derives latest snapshot date + source count + status text from the three locked mock dates (schedule `2026-05-15`, documents/hours `2026-05-31`). |
| `useUpcomingDutyPreview` | Finds the next duty on/after `today`, then resolves the first leg's departure/arrival ICAO, STD/STA, flight number, and aircraft from the `flightLegs` store. |
| `useActionItems` | Ranks open actions: next duty (opens detail sheet), expiring/expired documents (→ `/documents`), incomplete logbook (→ `/logbook`). Emits typed navigation intents. |

| Primitive | Role |
|---|---|
| `DataFreshnessStrip` | Compact banner: data sources + snapshot date. |
| `SyncStatusPill` | Honest status badge: `demo` / `cached` / `offline` + timestamp. |
| `ActionCenter` | Ranked action list with typed `(navigate, payload)` events. |

## Testing

Three layers, each catching a different bug class:

1. **Unit specs** (Vitest + happy-dom) — pure-function tests for the composables. `useRollingSum.spec.ts` hand-verifies the brief's ±7-day window example across all chart points. `brief-verification.spec.ts` is a cross-cutting canary asserting the brief's worked examples.
2. **Component specs** (`@vue/test-utils`) — mount + assert on rendered output. `FlightHoursTrendChart` exposes `{ chartData, chartOptions }` via `defineExpose` so specs read structured data without parsing canvas pixels.
3. **Story smoke tests** (`@storybook/test-runner` + Playwright) — every story visited in headless Chromium; catches integration bugs unit tests miss.

**561 specs across 71 files**, ~98% statement coverage (scoped to `app/components/**` + `app/composables/**`). CI (`.github/workflows/ci.yml`) runs lint + typecheck + coverage + storybook smoke.

## Deployment (Vercel)

- **App:** Vercel auto-detects the Nuxt preset — zero config. Add `NUXT_GEMINI_API_KEYS` (and optionally the model overrides) under Project → Settings → Environment Variables.
- **Storybook:** second Vercel project, build command `npm run build-storybook`, output dir `storybook-static/`.

CI never runs `npm run build`; build regressions surface at deploy.

## Interviewer walkthrough

1. **Sign In** (`/`) — read the Demo mode alert. Enter anything, land on Home.
2. **Home** (`/home`) — top to bottom: data freshness strip (sources + snapshot date), sync status pill (`demo`), next duty card (real route + times from flight legs, not a placeholder), action center (ranked: next duty → docs → logbook), flight-hours chart, hours-to-limit cards, documents, news. Tap the next duty card → duty detail sheet opens with full leg breakdown. Resize to ≥768px → operations grid goes 2-column.
3. **Schedule** (`/schedule`) — freshness header with viewing-month context. Tap any dated cell → duty detail modal with legs. Legend drives badge colors (no hardcoded codes).
4. **Logbook** (`/logbook`) — month-grouped entries with verified/pending status and summary strip.
5. **More** (`/more`) — Demo & data status section (transparency), profile, settings sheets. App version badge.
6. **AI Copilot** — floating bubble (bottom-right). Opens chat sheet. Ask "what's my next flight?" → Gemini reads the schedules mock via function calling.

## License

Technical test for Susi Air. Brand assets belong to PT ASI Pujiastuti Aviation. Source is unlicensed — evaluation only.
