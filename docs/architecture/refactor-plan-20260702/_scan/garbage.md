# Garbage / Dead-Code / Hygiene Scan — provodnik-app

Scope: read-only scan for dead/legacy/dev/demo code, dependency sprawl, feature-flag &
nav mismatch, repo hygiene. Paths absolute-from-repo-root unless noted.

## 1. Dev / demo routes

Only two dev routes exist, both correctly prod-gated and noindex:

- `src/app/dev/guide-templates-wireframe/page.tsx` — static UX wireframe (route templates /
  bid picker). Gated: `if (process.env.NODE_ENV === "production") notFound();` (line ~ default
  export). `metadata.robots = {index:false,follow:false}`. Not linked/imported anywhere
  (grep for `guide-templates-wireframe` outside `src/app/dev/` = 0 hits).
- `src/app/dev/req-cards/page.tsx` (+ `page.test.tsx`) — request-card sample gallery. Same
  gating: `if (process.env.NODE_ENV === "production") notFound();` (line 283), noindex.
  No external references.

Both are safe in prod (return 404) but are pure prototypes — deletion candidates once UX
signed off. No sitemap/nav entries. No other scratch/demo pages found under src/app.

## 2. Feature flags — `src/lib/flags.ts`

14 flags, all `envFlag = z.enum(["0","1"]).catch("0")` → **default OFF (0)**. Non-test
product usage (grep `flags.X` / `isEnabled` excluding *.test / __tests__):

| Flag | non-test product uses | Status |
|------|----------------------|--------|
| FEATURE_TR_TOURS | 1 | alive (listings/[id]) |
| FEATURE_TR_KPI | 0 | **DEAD — no reader** |
| FEATURE_TR_NOTIFICATIONS | 2 | alive |
| FEATURE_TR_REPUTATION | 0 | **DEAD — only referenced in a test** |
| FEATURE_TR_PERIPHERALS | 0 | **DEAD — no reader anywhere** |
| FEATURE_TR_HELP | 0 | **DEAD — no reader (see mismatch below)** |
| FEATURE_TR_PAYMENT | 1 | alive (help category gating) |
| FEATURE_TR_FAVORITES | 6 | alive |
| FEATURE_TR_PARTNER | 2 | alive |
| FEATURE_TR_REFERRALS | 4 | alive |
| FEATURE_TR_QUIZ | 0 | **DEAD — no reader** |
| FEATURE_TR_DISPUTES | 7 | alive |
| FEATURE_DEPOSITS | 0 | **DEAD — no reader** |
| FEATURE_PUBLIC_CATALOG | 7 | alive |

**6 dead flags** (defined + parsed but never read in product code): FEATURE_TR_KPI,
FEATURE_TR_REPUTATION, FEATURE_TR_PERIPHERALS, FEATURE_TR_HELP, FEATURE_TR_QUIZ,
FEATURE_DEPOSITS. Since default is 0 and there is no reader, these are permanently-off dead
branches (the "on" behaviour does not exist).

### Flag/nav/doc mismatches
- **`.env.example` is stale**: documents `FEATURE_TR_HELP=1  # /help ... + footer link`, but
  `src/app/(site)/help/page.tsx` never reads FEATURE_TR_HELP (it gates only the *payment*
  category on FEATURE_TR_PAYMENT, line 38). `/help` is always reachable regardless of the flag.
- **`NAV_FLAG_BY_HREF`** (`src/lib/navigation.ts:169`) maps `/favorites`→FEATURE_TR_FAVORITES
  and `/referrals`→FEATURE_TR_REFERRALS, but **neither href is present in any exported nav
  array** (they were removed from the traveler avatar menu — see comment at
  travelerAccountMenu). So `filterNavItemsByHiddenHrefs` has nothing to filter for these two:
  the flag-hiding contract is effectively moot / defensive-only.

### Nav ↔ route mismatches (`src/lib/navigation.ts` ROUTES)
Several ROUTES entries are defined but **referenced nowhere** (0 hits for `ROUTES.<key>` across
src, and absent from every nav array export):
- `ROUTES.search` (`/search`) — **and `/search` has no `page.tsx` at all** (nonexistent route).
- `ROUTES.auth`, `ROUTES.messages`, `ROUTES.notifications`, `ROUTES.myBookings` (`/bookings`),
  `ROUTES.favorites`, `ROUTES.referrals`, `ROUTES.listings`, `ROUTES.destinations` — orphaned
  definitions (0 `ROUTES.X` refs; catalog ones intentionally hidden but the ROUTES objects are
  still dead weight). `/bookings` has no index page either (only `/bookings/[bookingId]`).
- `/guide/stats` route exists (`src/app/(protected)/guide/stats/page.tsx`) but has **no ROUTES
  entry / nav link**.

## 3. Dependency sprawl (`package.json` deps vs import sites in src)

Import-site counts (grep `['"]<pkg>` across src incl. css):

- **0 imports — removal candidates:**
  - `@fontsource-variable/inter`
  - `@fontsource/cormorant-garamond`
  - `@fontsource/geist-mono`
  These 3 fontsource packages are unused — `src/app/layout.tsx` loads fonts via
  `next/font/google` (`Onest`, `Geist_Mono`), not fontsource. Dead deps.
  - `@tanstack/react-query-devtools` — 0 imports (no `ReactQueryDevtools` anywhere). Dead dep.
- **1 import each (thin, but legit):** `clsx` + `tailwind-merge` (both only in
  `src/lib/utils.ts` `cn()`), `cmdk` (only `src/components/ui/command.tsx`), `react-day-picker`,
  `react-markdown`, `resend` (`src/lib/email/resend-client.ts`), `@upstash/redis`
  (`src/lib/upstash/redis.ts`), `tw-animate-css` (css only).
- **Unusual:** `radix-ui` meta-package (19 files) is used *alongside* — no individual
  `@radix-ui/react-*` packages in deps, so that is consistent (single meta-package). Fonts are
  double-sourced conceptually (fontsource installed but next/font actually used). Single date
  lib (`date-fns`, 4 sites) — no duplication there.

## 4. Dead-code signals

- **`src/features/homepage-classic/*`** — name says "classic/legacy" but it is the **LIVE
  homepage**: `src/app/(home)/page.tsx` (serves `/`) renders `HomePageShell2Classic`. Meanwhile
  `docs`/`DECISIONS.md` ADR claims the opposite (see §5). Confusing but NOT dead.
- Three homepage variants coexist: `/` → homepage-classic (live); `/ai` → `features/homepage`
  AI conversation (`HeroConversation`, OpenRouter LLM); `/form` → `permanentRedirect("/")`
  stub (`src/app/(home)/form/page.tsx`). `/form` is a legacy redirect placeholder.
- **Unused shadcn/ui components (0 external imports):**
  `src/components/ui/{booking-card,faq-accordion,form-step-section,kpi-card,radio-group,
  seat-progress-bar,section,toggle,what-happens-next}.tsx`.
- No `*.old / *.bak / *.orig / *-v1 / *-wip` files. (`src/lib/copy.ts` matched a `*copy*`
  glob but is a legitimate i18n strings file, not garbage.)
- `src/app/__tests__/` contains only `tokens.test.ts` (legit). No commented-out route blocks
  found.

## 5. Repo hygiene — root clutter

Root-level dirs/files beyond a standard Next app:
- `audits/2026-05-12-ppfs-stage1/` — dated audit artifact.
- `task-audit-2026-07-01/opus_admin_users_console_report.md` — one-off agent report at root.
- `.design-sync/` (NOTES.md, compiled.css, ds-styles.css, previews, shims) — design tooling.
- `.opencode/skills`, `.cursor/` (REDESIGN-TASK.md, mockups, rules, skills, surfaces.json),
  `.cursorignore` — multiple competing agent-tool configs (.claude + .cursor + .opencode).
- `DECISIONS.md` at root duplicates `.claude/sot` + `docs/decisions/`. **It is STALE/contradicts
  code**: its ADR says "features/homepage serves / ; homepage-classic serves /form; remove
  homepage-classic when /form traffic ~0" — but in reality `/` renders homepage-classic and
  `/form` is a redirect to `/`. The documented intent is inverted vs. actual routing.
- `docs/` is large (16+ subdirs incl. `_stale/`, several dated qa/ audit folders).

### eslint-baseline + lint-ratchet — what tech debt is suppressed?
- `.eslint-baseline.json` (generated 2026-05-09): **totals errors=0, warnings=2**. Only two
  files carry 1 warning each:
  - `src/features/booking/components/BookingFormTabs.tsx` (1 warning)
  - `src/features/profile/components/PersonalSettingsForm.tsx` (1 warning)
- `scripts/lint-ratchet.mjs` runs ESLint over `.` and fails CI if error/warning counts exceed
  the committed baseline (ratchet-down; `--update` to re-baseline). It suppresses nothing new —
  it just prevents regressions above the 2-warning floor. Very small suppressed debt.

## 6. TODO / FIXME / HACK / @deprecated density

Across src (*.ts/*.tsx): **effectively zero.** TODO=0, FIXME=0, HACK=0, @deprecated=0.
`XXX`=4 hits, all false positives (phone-number masks in `src/lib/pii/mask.ts` + its test).
Codebase is unusually clean of inline debt markers.

## Top removal candidates (summary)
1. 4 unused deps: 3× @fontsource/* + @tanstack/react-query-devtools.
2. 6 dead feature flags (KPI, REPUTATION, PERIPHERALS, HELP, QUIZ, DEPOSITS).
3. 9 unused ui/ components.
4. ~9 orphaned ROUTES entries + `/search` nonexistent route; `/guide/stats` missing nav.
5. Stale docs: `.env.example` FEATURE_TR_HELP note; root `DECISIONS.md` homepage ADR.
6. 2 dev prototype routes (safe, prod-gated) — delete when UX finalized.
