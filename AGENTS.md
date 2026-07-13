# PROJECT KNOWLEDGE BASE

**Generated:** 2026-07-14
**Commit:** f7181c7
**Branch:** main

## OVERVIEW

Mobile-first Nuxt 4 PWA for Susi Air pilots. Three surfaces (Sign In, Home dashboard, Schedule calendar) wired against committed JSON mocks — no backend, no auth. Built as a technical assessment. ~98% coverage, 314 specs + 128 story smoke tests, deployable to Vercel.

## STRUCTURE

```
.
├── app/                    # Nuxt 4 srcDir (all app code lives here)
│   ├── components/{atoms,molecules,organisms}/  # Atomic design — see app/components/AGENTS.md
│   ├── composables/        # 5 pure-function composables — see app/composables/AGENTS.md
│   ├── stores/             # 5 Pinia setup stores — see app/stores/AGENTS.md
│   ├── pages/              # 5 routes: index(Sign In), home, schedule, logbook(stub), more(stub)
│   ├── layouts/            # default.vue (with BottomNav), auth.vue (bare)
│   ├── plugins/pwa.client.ts  # SW registration, client-only, skips dev
│   ├── assets/data/        # 4 JSON mocks: documents, flight-hours, schedules, news
│   ├── assets/scss/tokens.scss  # Design tokens (SCSS vars + CSS custom props)
│   ├── types/index.ts      # Shared types for all 4 JSON shapes + UI helpers
│   ├── utils/format.ts     # Nuxt 4 auto-imported util
│   └── app.vue             # Root: <NuxtLayout><NuxtPage/></NuxtLayout> + transitions
├── public/                 # manifest.webmanifest, sw.js (hand-rolled PWA), pwa-*.png, logo
├── .storybook/             # main.ts, preview.ts, test-runner.ts
├── tests/setup-canvas-mock.ts  # Stubs canvas for chart.js under happy-dom
├── scripts/generate-pwa-icons.mjs  # sharp-based icon generator (manual, not CI)
├── nuxt.config.ts          # Modules, head/meta, fonts, pathPrefix:false
├── vitest.config.ts        # Mirrors Nuxt auto-imports via unplugin-*
└── eslint.config.mjs       # Flat config via @nuxt/eslint (withNuxt wrapper)
```

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Add a component | `app/components/{atoms,molecules,organisms}/` | Pick layer by contract — see `app/components/AGENTS.md` |
| Add a route | `app/pages/*.vue` | File-based routing. Stubs: `logbook`, `more` |
| Add business logic | `app/composables/use*.ts` | Pure functions. Co-located `.spec.ts` |
| Add/modify data | `app/assets/data/*.json` → `app/stores/*.ts` | Stores are the ONLY JSON consumers (except `.stories.ts`) |
| Change design tokens | `app/assets/scss/tokens.scss` | SCSS vars + CSS custom props (`--fw-bold`, `--shadow-sm`, etc.) |
| Register a plugin | `app/plugins/*.client.ts` | `.client` suffix = browser-only |
| PWA behavior | `public/sw.js` + `app/plugins/pwa.client.ts` + `public/manifest.webmanifest` | Hand-rolled (NOT `@vite-pwa/nuxt`) |
| Storybook config | `.storybook/main.ts` | Stories glob: `app/components/**/*.stories.ts` |
| CI pipeline | `.github/workflows/ci.yml` | 3 jobs: lint+typecheck, test+coverage, storybook smoke |

## CONVENTIONS

- **No semicolons, single quotes, 100-col, trailing commas** — `.prettierrc.json`
- **`<script setup lang="ts">`** — Composition API only, no Options API
- **Auto-imports**: `ref`, `computed`, `watch`, all components, all composables, all stores are auto-imported in `.vue` files. **Do NOT write explicit imports for these** in `<script setup>`. `.ts` files (composables/stores/specs) DO keep explicit imports for portability.
- **Path aliases**: `~` and `@` both resolve to `./app/` (e.g. `~/assets/data/news.json`)
- **Components registered by bare filename**: `pathPrefix: false` means `<SignInForm />` not `<OrganismsSignInForm />`
- **BEM in scoped SCSS**: `block__element--modifier`, max one level of `&__element` nesting. One block per component.
- **Co-located tests**: `*.spec.ts` next to source. Globals enabled (`describe`/`it`/`expect` — no imports).
- **Co-located stories**: `*.stories.ts` next to source (Storybook 10)
- **Node 22+** (but no `.nvmrc` or `engines` field — run `node --version`)

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER import stores inside atoms/molecules/organisms** — only pages pull from Pinia. Organisms receive data via props.
- **NEVER import `assets/data/*.json` outside `app/stores/`** (exception: `*.stories.ts` fixtures)
- **NEVER hardcode schedule codes** like "DTY"/"TRD" — drive from `legend[]` JSON prop (asserted by `ScheduleLegend.spec.ts`)
- **NEVER use `!important`** in SCSS — none exists in the codebase
- **NEVER suppress types** (`as any`, `@ts-ignore`, `@ts-expect-error`) — TS 6 strict + `noUncheckedIndexedAccess`
- **NEVER add `console.log`** to production code (one intentional `console.warn` in `pwa.client.ts:20`)
- **NEVER use `@vite-pwa/nuxt`** — breaks `@nuxt/kit` dedup with Nuxt 4 (documented in README)
- **NEVER use Tailwind/UnoCSS** — BEM/SCSS only, per brief

## UNIQUE STYLES

- **Hand-rolled PWA** (~80 lines across `public/sw.js` + `manifest.webmanifest` + `plugins/pwa.client.ts`). Rejected `@vite-pwa/nuxt` due to Nuxt 4 kit conflicts. Cache-first shell, network-first nav.
- **Mirrored auto-imports**: `vitest.config.ts` and `.storybook/main.ts` both re-wire `unplugin-auto-import` + `unplugin-vue-components` to match Nuxt's behavior (since they don't run inside Nuxt).
- **`defineExpose` for testability**: `FlightHoursTrendChart.vue` exposes `{ chartData, chartOptions }` so specs can read structured chart data without parsing canvas pixels.
- **`brief-verification.spec.ts`** (in `app/composables/`) — cross-cutting integration test asserting the brief's worked examples. Not a composable unit test; lives there as a canary.
- **Coverage scope is narrow**: `vitest.config.ts` measures only `app/components/**/*.vue` + `app/composables/**/*.ts`. Stores, utils, pages, layouts are NOT measured. The "~98% coverage" claim is scoped.
- **Three relaxed ESLint rules**: `vue/multi-word-component-names: off` (pages are single-word), `@typescript-eslint/no-explicit-any: warn` (not error), `vue/no-v-html: off`.

## COMMANDS

```bash
npm install                # Node 22+; postinstall runs `nuxt prepare`
npm run dev                # Dev server :3000 (lands on Sign In at /)
npm run build              # Production build → .output/
npm run generate           # Static build alternative
npm run preview            # Serve last build on :3000
npm test                   # Vitest one-shot (all specs)
npm run test:watch         # Vitest watch mode
npm run test:coverage      # v8 coverage report
npm run test:storybook:ci  # Boot Storybook + run Playwright smoke tests (headless Chromium)
npm run storybook          # Storybook dev :6006
npm run build-storybook    # Static Storybook → storybook-static/
npm run typecheck          # nuxt prepare && vue-tsc --noEmit
npm run lint               # eslint . --fix
npm run format             # prettier --write "**/*.{ts,vue,scss,json,md}"
npm run generate-pwa-icons # Regenerate public/pwa-*.png from public/susi-air-logo.png
```

## NOTES

- **Sign In has no auth** — any input navigates to `/home` (per brief). Real auth is future work.
- **No `server/` directory** — no Nitro API. All data is mock JSON. Future: `/api/*` routes.
- **No `middleware/`** — no route guards.
- **No `error.vue`** — falls back to Nuxt default error page.
- **Deployment**: Vercel auto-detects Nuxt preset. Two projects: app + Storybook (overridden build command). No `vercel.json` in repo — config lives in Vercel dashboard.
- **CI never runs `npm run build`** — only lint/typecheck/test/storybook. Build regressions surface at Vercel deploy.
- **Stale README ref**: `scripts/strip-redundant-imports.mjs` documented but doesn't exist.
- **Committed tooling dirs**: `.omo/`, `.tokensave/` are agent artifacts, not project code. Should be `.gitignore`d.
- **Deep dive**: `README.md` is exhaustive (243 lines) — read it for full rationale on every architectural decision.
