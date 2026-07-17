# Susi Air Pilot Companion Design System

## 0. Research Log

- Current app audit: read `app/assets/scss/tokens.scss`, `app/components/AGENTS.md`, `BaseButton`, `Badge`, `LimitCard`, `RangeToggleGroup`, `UpcomingFlightCard`, `ScheduleCalendarGrid`, `DashboardHeader`, `home.vue`, `schedule.vue`, and `default.vue`. Extracted the live token set, atomic contracts, mobile app shell, mixed surface depth, light/dark theme, focus behavior, skeleton reveal, range pill, calendar slide, and bottom sheet patterns.
- GitHub benchmarks, parent summary: `web-logbook` favors dense verified-entry tables and audit trails; `crewcal` favors calendar-first rosters and fast change visibility; `chart-viewer` favors lightweight trend scanning over heavy dashboards; didapatria comparator favors compact mobile-first airline companion flows. Takeaway: the app needs a first-glance operational brief, not a decorative dashboard.
- Aviation human factors, parent summary: Endsley situation awareness maps to perception, comprehension, projection; NASA interruption recovery stresses resumption cues after task breaks; FAA display clarity is inspiration for readable hierarchy and low ambiguity, not a compliance claim; NN/g visibility of system status and recognition over recall support explicit freshness, deltas, and next actions.
- Direction chosen: Remote Ops Briefing. Calm daylight cockpit-paper surfaces, navy structure, Susi red only for action or danger, cyan for information and charts. Signature moment: every session answers what next, what changed, and what needs attention before the pilot scrolls.
- Scope limits: this repository is a static technical assessment using committed JSON mocks. It isn't live ops software, isn't FAA-compliant avionics, doesn't provide flight-critical decision support, and must not imply live integrations unless a backend is added.

## 1. Atmosphere & Identity

Remote Ops Briefing feels like a calm daylight dispatch sheet on a cockpit clipboard: bright paper, crisp navy structure, sparse red action, cyan data glints, and enough mixed depth to show what is pinned, current, or actionable. The product's signature is the briefing stack: a top-of-session read that separates next duty, changed items, and attention items so a returning pilot can recover context after an interruption without hunting through the app.

The voice is operational, direct, and humble. This app is a static demo over mock JSON. It can show sample freshness, sample schedule deltas, sample AI responses, and sample sync states, but it must label them as demo states unless a real backend exists.

Primary personas:

- Line pilot between legs: needs the next duty, report timing, documents, and changed items with one-handed mobile use in glare or low time.
- Training captain or crew lead: needs roster context, verification status, logbook quality, and exceptions without memorizing codes.
- Crew scheduling reviewer: needs calendar density, change visibility, legends, and readable status while checking multiple dates.
- Assessor or product reviewer: needs to see the assessment constraints clearly, especially mock data, no auth, no live ops, and no compliance claim.

## 2. Color

### Palette

All colors come from `app/assets/scss/tokens.scss`. Product code must use these CSS custom properties or the paired SCSS variables, not raw values. Chart.js is the existing exception where raw color values are required by the library.

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Structure/navy | `--color-navy` | `#0e2138` | `#f1f5f9` | Brand structure, primary text where semantic alias isn't available |
| Action/red | `--color-red` | `#cc1a3a` | `#f87171` | Primary CTA, active tabs, action affordance, unread badge |
| Action/red hover | `--color-red-dark` | `#a3142f` | `#ef4444` | Primary hover, danger hover |
| App background | `--color-bg` | `#f5f6f8` | `#0b1626` | Page shell, daylight cockpit-paper field |
| Surface/paper | `--color-surface` | `#ffffff` | `#16243a` | Cards, panels, sheets, nav |
| Surface/soft paper | `--color-surface-alt` | `#f9fafb` | `#1f3047` | Inputs, toggle tracks, hover fills, nested rows |
| Text/primary | `--color-text-primary` | `#0e2138` | `#f1f5f9` | Headings, body, key numbers |
| Text/secondary | `--color-text-secondary` | `#5d6673` | `#94a3b8` | Labels, helper text, inactive controls |
| Text/muted | `--color-text-muted` | `#667085` | `#64748b` | Timestamps, disabled-like metadata, low-priority labels |
| Border/default | `--color-border` | `#e5e7eb` | `#2a3b54` | Dividers, card separators, sheet rules |
| Success | `--color-success` | `#1fbf8f` | `#2dd4bf` | Verified, safe, complete |
| Warning | `--color-warning` | `#f59e0b` | `#fbbf24` | Soon, changed, caution |
| Danger | `--color-danger` | `#cc1a3a` | `#f87171` | Expired, destructive, critical attention |
| Information/cyan | `--color-chart-accent` | `#22c5e8` | `#38d9f5` | Charts, information highlights, freshness cues |
| Safe foreground | `--color-safe-fg` | `#0b745a` | `#2dd4bf` | Safe badge text |
| Safe tint | `--color-safe-bg` | `rgba(31, 191, 143, 0.12)` | `rgba(45, 212, 191, 0.16)` | Safe badge background |
| Soon foreground | `--color-soon-fg` | `#965e08` | `#fbbf24` | Soon badge text |
| Soon tint | `--color-soon-bg` | `rgba(245, 158, 11, 0.14)` | `rgba(251, 191, 36, 0.16)` | Soon badge background |
| Expired tint | `--color-expired-bg` | `rgba(204, 26, 58, 0.08)` | `rgba(248, 113, 113, 0.16)` | Expired badge background |
| Overlay/subtle | `--color-overlay` | `rgba(14, 33, 56, 0.06)` | `rgba(255, 255, 255, 0.05)` | Hover fills, shimmer, low tint |
| Overlay/strong | `--color-overlay-strong` | `rgba(14, 33, 56, 0.1)` | `rgba(255, 255, 255, 0.08)` | Stronger hover, active fills |

### Rules

- Navy owns structure. Use it for hierarchy, headings, labels, and app chrome through text or semantic tokens.
- Red is scarce. Use it only for primary actions, active controls, danger, and unread urgency. Don't use red as decoration.
- Cyan is informational. Use it for chart focus, data freshness, sync, and neutral live-state explanation. Don't use cyan for CTA.
- Warning and danger must be separate. Warning means attention soon or changed. Danger means blocked, expired, destructive, or requires immediate action.
- Preserve light and dark. Every new surface must work under `:root` and `[data-theme='dark']` without adding raw untracked values.
- Schedule legend colors can come from mock data only when presented as schedule data. They don't become global design tokens unless reused as design roles.

## 3. Typography

### Font Stack

- Primary: `--font-sans`, `Plus Jakarta Sans`, `Inter`, `system-ui`, `-apple-system`, `Segoe UI`, `sans-serif`.
- Mono: none currently installed or used. Don't introduce one for one-off labels.
- Serif: none.

### Scale

| Level | Token | Size | Weight | Line Height | Tracking | Usage |
|-------|-------|------|--------|-------------|----------|-------|
| Page title | `--fs-3xl` | `28px` | `--fw-bold` or `--fw-extrabold` | 1.15 to 1.25 | tight only when needed | Top-level page headings, major briefing headline |
| Section title | `--fs-2xl` | `22px` | `--fw-bold` | 1.2 to 1.3 | 0 | Page section headers |
| Card title | `--fs-xl` | `20px` | `--fw-bold` | 1.25 to 1.35 | 0 | Main card titles, route names |
| Emphasis | `--fs-lg` | `18px` | `--fw-semibold` or `--fw-bold` | 1.35 | 0 | Month label, highlighted metric |
| Body large | `--fs-md` | `16px` | `--fw-regular` to `--fw-bold` | 1.45 to 1.55 | 0 | Readable values, form text, time values |
| Body | `--fs-base` | `14px` | `--fw-regular` to `--fw-semibold` | 1.5 | 0 | Default app copy |
| Body small | `--fs-base-sm` | `13px` | `--fw-regular` to `--fw-semibold` | 1.4 to 1.5 | 0 | Secondary rows, controls, compact metadata |
| Caption | `--fs-sm` | `12px` | `--fw-medium` to `--fw-semibold` | 1.35 to 1.45 | 0 to `0.04em` | Labels, timestamps, nav labels |
| Micro label | `--fs-xs` | `11px` | `--fw-semibold` or `--fw-bold` | 1.3 to 1.4 | `0.02em` to `0.04em` | Badges, overlines, weekday labels |

### Rules

- Body text doesn't go below `--fs-base-sm` unless it's a badge, weekday, or metadata already covered by `--fs-xs` or `--fs-sm`.
- Uppercase is reserved for operational labels: `Next duty`, badge labels, weekdays, time labels.
- Numeric values use `--fw-bold` and tabular clarity where the browser font supports it.
- Copy should answer status directly: `Verified`, `Upcoming`, `Expires soon`, `Demo data`, `Last updated from mock data`.
- Don't introduce new font families or raw sizes. Extend this section first if a real new text role appears.

## 4. Spacing & Layout

### Base Unit

The base unit is `4px`. Use the existing spacing tokens. Raw browser mechanics such as `auto`, `%`, `minmax()`, `clamp()`, viewport units, and safe-area environment variables are allowed when they describe layout behavior rather than design intent.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Calendar cell gaps, icon-to-label, tight badge internals |
| `--space-2` | `8px` | Inline groups, compact lists, nav padding, chip gaps |
| `--space-3` | `12px` | Default internal gaps, compact cards, form grouping |
| `--space-4` | `16px` | Page side padding, card padding, section gaps |
| `--space-5` | `20px` | Comfortable internal rhythm, used via SCSS token if needed |
| `--space-6` | `24px` | Sign-in card padding, medium button x-padding |
| `--space-8` | `32px` | Large button x-padding, wide section gap |
| `--space-10` | `40px` | Large vertical separation, rare |
| `--space-12` | `48px` | Major separation, rare |
| `$space-16` | `64px` | Available SCSS token, not emitted as CSS var today |

### Radius And Controls

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `8px` | Small controls, compact cells |
| `--radius-md` | `12px` | Inputs, medium cards, list rows |
| `--radius-card` | `14px` | Default cards, skeleton cards, schedule panels |
| `--radius-lg` | `16px` | Large panels and sheets |
| `--radius-pill` | `24px` | Buttons, segmented controls |
| `--radius-full` | `9999px` | Avatars, circular icon buttons, dots |
| `--control-height-sm` | `32px` | Small buttons and compact controls |
| `--control-height-md` | `40px` | Default buttons and fields |
| `--control-height-lg` | `48px` | Primary mobile actions |

### Responsive Grid

- App shell: `default.vue` is a centered single-column mobile-first shell.
- Widths: `480px` default max, `600px` at `640px`, `760px` at `768px`, `920px` at `1024px`.
- Page padding: `--space-4` horizontal on app pages. Preserve safe-area padding for sticky nav and bottom sheets.
- Cards: stack on phones. Use two-column grids only when each card remains readable at `375px` and doesn't cause horizontal scroll.
- Calendar: fixed seven-column grid using `repeat(7, minmax(0, 1fr))` with `--space-1` gaps.
- Scroll ownership: page owns vertical scroll. Bottom nav and bottom sheets are fixed or sticky surfaces; sheets own their internal body scroll.

### Rules

- Mobile is the primary cockpit. Design first at `375px`, then improve for `768px` and `1280px`.
- Preserve one-handed paths. Primary actions must fit in the lower thumb zone or be reachable through the bottom nav or sheet footer.
- Use `100dvh`, not `100vh`, for full-height shells.
- Primary content must never hide behind bottom nav. Keep `--space-nav-height` reservation in layout.
- Empty, loading, long label, and offline states must keep the same grid footprint where possible to reduce interruption cost.

## 5. Components

Document components before implementation. Existing components keep their atomic contracts: atoms are presentational only, molecules compose atoms and at most one pure composable, organisms receive data by props, pages pull from stores. No component below a page imports Pinia stores or mock JSON.

### BaseButton

- **Structure**: `<button class="base-button base-button--variant base-button--size">` with optional spinner, optional icon slot, label slot.
- **Variants**: primary, secondary, ghost, danger. Sizes: sm, md, lg. Full-width supported.
- **Spacing**: gap `--space-2`; x-padding `--space-4`, `--space-6`, or `--space-8`; heights use control tokens.
- **States**: default, hover, active `translateY(0.5px)`, focus-visible `--shadow-focus`, disabled, loading.
- **Accessibility**: native button, disabled attribute while disabled or loading, visible focus.
- **Motion**: background, color, border, shadow at `150ms`; active transform at `50ms`; spinner rotates. Add reduced-motion handling if spinner use becomes persistent.
- **Layout**: cluster primitive.

### BaseInput And FormField

- **Structure**: label/help/error wrapper around a tokenized input.
- **Variants**: text-like fields currently used for sign-in and logbook forms.
- **Spacing**: field stacks use `--space-2` to `--space-4`; controls use `--control-height-md` or `--control-height-lg`.
- **States**: default, focus, disabled, error, helper.
- **Accessibility**: label association required, error copy announced where rendered, focus ring visible.
- **Motion**: focus and border color only.
- **Layout**: stack primitive.

### Badge, Chip, Alert

- **Structure**: compact inline status with dot or icon plus label.
- **Variants**: safe, soon, expired, neutral for badges; info, success, warning, danger for alerts and notification icons.
- **Spacing**: `--space-1` inner gap, `--space-2` horizontal padding, pill radius.
- **States**: badges are static; alert close or action states must follow BaseButton rules if added.
- **Accessibility**: badge text must not rely on color alone; icons decorative unless the icon is the only status cue.
- **Motion**: badge count may use existing `t-badge` scale only when count appears or changes.
- **Layout**: inline cluster.

### Navigation Shell

- **Structure**: `default-layout` with `OfflineBanner`, centered `main`, `BottomNavigation`, lazy client-only `CopilotBubble`.
- **Variants**: authenticated shell and auth shell.
- **Spacing**: centered max-width column, page side padding `--space-4`, bottom reservation with `--space-nav-height` and safe-area inset.
- **States**: active route, offline banner visible, copilot present or absent, keyboard focus.
- **Accessibility**: bottom nav has `aria-label="Primary"`; active route must be announced by nav item semantics.
- **Motion**: page transitions only when they preserve position and respect reduced motion.
- **Layout**: app shell with page scroll owner.

### DashboardHeader

- **Structure**: sticky header with logo, notification trigger, avatar/profile trigger, dropdown panels.
- **Variants**: flat at top, scrolled with `--shadow-sm`, notification dropdown, profile dropdown.
- **Spacing**: header clusters use `--space-2` and `--space-3`; dropdown rows use `--space-3`.
- **States**: unread, read, empty, open, closed, focus, Escape close with focus return.
- **Accessibility**: disclosure buttons use `aria-expanded`; dropdowns are labelled groups, not menu roles unless full menu keyboard behavior is added.
- **Motion**: dropdown transform and opacity only; no layout animation.
- **Layout**: sticky app-bar plus popover panels.

### UpcomingFlightCard

- **Structure**: `article` with overline, status badge, `FlightRoute`, optional dep/arr footer.
- **Variants**: verified, upcoming, empty fallback supplied by parent.
- **Spacing**: card gap `--space-4`, padding `--space-4`, footer top padding `--space-3`.
- **States**: default, active, focus if made keyboard interactive. If it opens details, it must become a button or link equivalent.
- **Accessibility**: route and time labels must remain text, not icon-only.
- **Motion**: active nudge and shadow reduction only.
- **Layout**: stack with footer split cluster.

### ScheduleCalendarGrid And CalendarDay

- **Structure**: month header, previous/next icon buttons, weekday row, 6 by 7 day grid, `CalendarDay` cells.
- **Variants**: today, out-of-month, duty, non-duty, logged, selected if added.
- **Spacing**: panel padding `--space-4`, gaps `--space-1` and `--space-3`.
- **States**: hover, active scale on nav, focus-visible, empty date, duty date, tap opens `DutyDetailSheet`.
- **Accessibility**: month nav buttons have labels; day cells must expose date and duty text without relying on color or tick shape alone.
- **Motion**: month slide `180ms` transform and opacity; reduced-motion fallback required if this pattern changes.
- **Layout**: fixed calendar grid.

### BottomSheet Family

- **Structure**: backdrop, sheet, handle, optional header, close button, body, optional footer.
- **Variants**: duty detail, logbook entry, appearance, licenses, notification preferences, copilot sheet.
- **Spacing**: outer side padding `--space-3`, body stacks `--space-3` to `--space-4`, safe-area bottom padding.
- **States**: open, closed, focus trap, Escape close, backdrop click, empty, error, loading if data-backed.
- **Accessibility**: modal semantics, labelled title, focus return to opener, keyboard close.
- **Motion**: translate and opacity only, disabled for reduced motion.
- **Layout**: fixed overlay with sheet as internal scroll owner.

### HoursToLimitSection, LimitCard, ProgressRing, FlightHoursTrendChart

- **Structure**: section header, range segmented control, chart, limit cards.
- **Variants**: safe, warning, danger, loading skeleton, reduced motion.
- **Spacing**: section card padding `--space-4`; cards grid gap `--space-3`; card padding `--space-4` and `--space-3`.
- **States**: range active, chart loading, card warning, card danger, reduced motion.
- **Accessibility**: progress values need text equivalents; chart color can't be the only data cue.
- **Motion**: number tween and ring transition `400ms`; chart animation is deterministic or disabled in tests and reduced motion.
- **Layout**: stack plus responsive card grid.

### RangeToggleGroup

- **Structure**: `role="tablist"`, button tabs, measured active pill.
- **Variants**: default options 1W, 1M, 3M, 6M, 1Y; active/inactive.
- **Spacing**: track padding `2px`, option padding `--space-2` and `--space-3`.
- **States**: hover inactive, active, focus-visible.
- **Accessibility**: `aria-selected` per tab. Add arrow-key navigation if this becomes a full tab widget across panels.
- **Motion**: active pill transform and width using transition tokens; reduced motion removes transitions.
- **Layout**: segmented control.

### Documents, Logbook, News, Settings Lists

- **Structure**: section header plus list rows or carousel cards.
- **Variants**: empty, loading, verified/pending, expired/soon/safe, destructive settings row.
- **Spacing**: list gaps `--space-2` or `--space-3`; cards use `--radius-card`.
- **States**: row hover, focus, active, selected if a sheet opens.
- **Accessibility**: rows that open sheets are buttons; non-interactive rows aren't fake buttons.
- **Motion**: carousel changes and row state transitions must be transform/opacity only.
- **Layout**: stack, scroll row, or carousel viewport.

### DataFreshnessStrip

- **Structure**: a narrow strip below `DashboardHeader` or at top of relevant sections with icon, freshness label, source label, and optional details action.
- **Variants**: demo, fresh, stale, offline, error. In this assessment, default to demo and name mock JSON source.
- **Spacing**: height follows content, padding `--space-2` `--space-3`, gap `--space-2`, radius `--radius-md` if card-contained.
- **States**: default demo, offline visible, stale warning, error danger, focus if details action exists.
- **Accessibility**: `role="status"` for meaningful changes; text must include source and time, not just color.
- **Motion**: enter via opacity only; no pulsing freshness indicators.
- **Layout**: inline cluster that wraps at `375px`.

### ActionCenter

- **Structure**: briefing panel with three groups: next, changed, needs attention. Each group contains one primary row and optional secondary rows.
- **Variants**: no action, one urgent action, multiple actions, loading, demo.
- **Spacing**: panel padding `--space-4`; group gap `--space-3`; row gap `--space-2`.
- **States**: empty, warning, danger, action available, dismissed only if a real state store exists.
- **Accessibility**: use headings for the three groups; actions are buttons or links; don't hide urgent text behind icons.
- **Motion**: row updates crossfade with opacity/filter like the existing skeleton reveal. No attention pulse unless a critical live integration exists.
- **Layout**: briefing stack. This is the signature moment.

### SyncStatusPill

- **Structure**: small pill with sync icon, label, and optional timestamp.
- **Variants**: demo, synced, syncing, offline, stale, failed.
- **Spacing**: `--space-1` gap, `--space-2` horizontal padding, `--radius-full`.
- **States**: syncing, success, warning, error, focus if clickable.
- **Accessibility**: visible text says `Demo data`, `Synced`, `Offline`, `Stale`, or `Failed`. `aria-live="polite"` only when status can change live.
- **Motion**: syncing spinner may rotate; respect reduced motion. Static demo state doesn't animate.
- **Layout**: inline cluster for header, strip, or card footer.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Press | `50ms` | `ease` | Button/card active nudge |
| Micro | `150ms` | `ease` or `ease-out` | Hover, color, border, shadow |
| Calendar | `180ms` | `ease` | Month slide transform/opacity |
| Reveal | existing `--reveal-dur` | existing `--reveal-ease` | Skeleton to content crossfade |
| Range pill | existing `--tabs-dur` | existing `--tabs-ease` | Segmented active pill |
| Numeric emphasis | `400ms` | cubic ease-out | Limit remaining number tween |

### Rules

- Motion must serve recovery or affordance: reveal loaded content, show active range, explain month direction, confirm press, or show a status change.
- Animate `transform`, `opacity`, `filter`, color, border, and shadow. Don't animate layout properties except the existing measured range pill width pattern.
- Respect `prefers-reduced-motion` for skeletons, range pill, chart/ring changes, sheets, and any future sync or freshness motion.
- No decorative pulsing for operational urgency. A critical alert can use placement, text, color role, and focus order instead.
- Every interactive element needs hover where hover exists, active feedback, and focus-visible.
- Interruption recovery matters: if a user returns after a sheet, dropdown, or route change, the surface should still show the last meaningful state or a clear current state.

## 7. Depth & Surface

### Strategy

Use mixed depth: daylight paper surfaces, subtle navy shadows, thin borders, and tonal nested rows. The goal is cockpit-paper clarity, not glossy glass or flat SaaS cards.

| Level | Token | Value | Usage |
|-------|-------|-------|-------|
| Hairline | `--color-border` | `#e5e7eb` light, `#2a3b54` dark | Dividers, footer separators, sheet lines |
| Surface | `--color-surface` | theme mapped | Default cards, nav, sheets |
| Nested surface | `--color-surface-alt` | theme mapped | Toggle tracks, hover rows, nested panels |
| Shadow/xs | `--shadow-xs` | tokenized | Active compressed card, active pill |
| Shadow/sm | `--shadow-sm` | tokenized | Default card, sticky nav/header after scroll |
| Shadow/md | `--shadow-md` | tokenized | Floating copilot, raised overlays |
| Focus halo | `--shadow-focus` | tokenized red halo | Keyboard focus on controls |

### Rules

- Cards use `--color-surface`, `--radius-card`, and usually `--shadow-sm`.
- Nested rows use `--color-surface-alt` before adding heavier shadow.
- Sticky or floating elements earn elevation only when they overlap or detach from content.
- Dark mode stays navy, not pure black. Keep surface separation through theme tokens.
- Avoid glass blur. It doesn't match Remote Ops Briefing and weakens clarity.
- Don't add raw shadow values. Extend `tokens.scss` and this section first if a new elevation level is needed.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- Target WCAG 2.2 AA. Body text contrast minimum is 4.5:1. Large text and UI graphics minimum is 3:1.
- Full keyboard reachability is required for buttons, nav, sheets, dropdowns, tabs, calendar days, settings rows, and future ActionCenter rows.
- Focus must be visible with `--shadow-focus` or a stronger tokenized equivalent.
- Status can't rely on color alone. Use visible labels, dots plus text, icons plus text, or row copy.
- Touch targets should be at least `44px` where practical. If a compact control is smaller, its containing row must provide the target.
- Reduced motion must preserve all information. It may remove transitions, never remove content or state.
- Screen readers need stable names for icon buttons: month nav, notification bell, avatar/profile, sheet close, sync details, copilot.
- Cognitive accessibility: keep the briefing order stable as next, changed, needs attention. Don't move urgent items unpredictably after a pilot returns from interruption.
- Live/demo boundary: static mock data must be labelled when freshness, sync, AI, or operational status appears. No copy may imply live dispatch integration without a backend.
- Compliance boundary: this app is not FAA-certified, not avionics, not an electronic flight bag compliance artifact, and not flight-critical decision support. FAA display clarity principles inspire readable hierarchy only.

### Accepted Debt

No accepted design debt. New debt must be added here only with location, affected users, reason, owner, and exit criteria.

| Item | Location | Why accepted | Owner / Exit |
|------|----------|--------------|--------------|
| None | All surfaces | No accepted accessibility, persona, or design-system debt | Keep table empty until user accepts specific debt |

### Implementation Contract

- No raw untracked design values in new UI. Use this file and `tokens.scss` first.
- Preserve light and dark themes for every new component.
- Document new reusable primitives here before writing product code.
- Keep static demo and live ops language separate.
- Don't add dependencies or copy external designs for this direction.
