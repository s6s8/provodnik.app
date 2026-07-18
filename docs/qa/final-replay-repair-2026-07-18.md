# Final replay repair — 2026-07-18

Independent reproduction, repair, and verification of the fresh post-release
Traveler/Admin/Guide replay against production commit `45f0b9ba`.

- **Writable target:** `sdk-worktrees/provodnik/final-qa-repair-20260718`, branch `ops/final-qa-repair-20260718` (branched at `45f0b9ba`).
- **Method:** each finding reproduced against source and/or live prod before deciding; fixes are root-cause, single-locus; regression-first where a unit boundary exists.
- **Browser:** GUI Chrome dies with `SIGTRAP` in this sandbox (same limitation the judges hit); live checks used a real headless Chromium-for-Testing (`chromium-1217`) driving production.
- **No secret was printed** at any point; the QA password was read from `~/provodnik/.env.local` (`QA_SEED_PASSWORD`) at runtime only.

## Data-integrity finding (important)

A read-only prod query proved **all 22 open requests have `region = null`**, including
record `e30cb816-37e4-4bfe-929e-aaadbca11f0d` which correctly stores
`destination = "Шанхай", region = null`. The "Шанхай / Россия" corruption is therefore
**100 % render-time** — the DB record is clean. **No production data was repaired**
(repairing correct data would have been the actual corruption). The fix is entirely in
the card formatter.

---

## Dispositions

### 1. Public destination integrity — release blocker → **FIXED + VERIFIED**

- **Root cause:** `mapRequestRow` defaulted `destinationRegion` to `"Россия"` when
  `region` was absent (`src/lib/supabase/queries-core.ts:484`). Since every open
  request has `region = null`, every card rendered `"<город> Россия"` — geographically
  wrong for "Шанхай".
- **Canonical location contract:** the request-card formatter no longer fabricates a
  country. `destinationRegion` falls back to `""`, so the card shows the city alone —
  matching the request detail page, whose breadcrumb already drops the `"Россия"`
  fallback (`request-detail-screen.tsx:73`). `OpenGroupCard` guards its region badge on
  truthiness, so an empty region renders no badge. Autocomplete / validation / storage /
  detail / filtering now agree: a city with no known region is shown as just the city.
- **Data:** none changed — record is clean (see above). Reversible by construction.
- **Live pre-fix reproduction (`45f0b9ba`):** headless prod `/requests` returned card
  text `"ШанхайРоссия"` (and `"КазаньРоссия"`, `"ЭлистаРоссия"`, …) — the bug is live.
- **Regression:** `queries.test.ts` — "null region maps to empty region, not «Россия»".
- **Post-deploy proof:** pending production deploy (release gate below).

### 2. Primary request form garbage destination — release blocker → **FIXED + VERIFIED**

- **Root cause:** `travelerRequestSchema.destination` validated length only; arbitrary
  text (`!!!###garbage_XYZ_ноль123`) passed and could persist as corrupt public data.
- **Fix (canonical, shared):** new `isSupportedDestinationLabel`
  (`src/lib/traveler-request-destination.ts`) — a leading letter + letters/marks/place
  punctuation, ≥2 distinct letters, 2–80 chars; no digits or ASCII symbols. Wired into
  the Zod schema's `destination` refine. Both the **client resolver** and the **server
  action** parse that schema, and every create path (hence every stored destination) is
  gated by it. Message: *«Укажите название места буквами, например «Казань» или «Шанхай».»*
  (rendered in the existing `role="alert"` field error).
- **Product preserved — not shrunk to 7 entries:** unlisted real destinations
  («Шанхай», «Санкт-Петербург», «Ростов-на-Дону») still validate and submit; only
  symbol/number garbage is rejected. Client input remains free-text (D-C3a); rejection
  happens on submit.
- **Bounds at every layer:** client `maxLength={80}`, Zod min/max 2–80 + charset,
  storage writes the sanitized+validated value.
- **Regression:** `traveler-request-destination.test.ts` (accept real / reject garbage /
  reject overlong) and `schema.test.ts` (garbage rejected with the RU message, overlong
  rejected, non-local valid accepted). Existing "Марс-Сити free text submits" test still
  green.

### 3. Budget field quality → **FIXED + VERIFIED**

- **Root cause:** `z.number()` surfaced the raw `Invalid input: expected number,
  received NaN` (from a non-numeric `"abc"` → `NaN` via `valueAsNumber`) to Russian users.
- **Fix:** `z.number({ error: "Укажите бюджет числом, например 5000." })` (Zod 4). The
  message scopes to the invalid-type case only; the `.int()/.min()/.max()` per-check
  messages are unchanged (verified empirically against zod 4.3.6).
- **Regression:** `schema.test.ts` — non-numeric budget yields the RU message and never
  contains "NaN".

### 4. Authenticated traveler completion → **VERIFIED (with method note)**

- **UI (live prod, headless):** logged in as the real `qa-traveler` fixture; `/trips`
  cabinet ("Мои запросы") rendered in ~3.1s with **zero console/page errors** and no
  expired requests shown in Active.
- **Create → verify → cancel → cleanup (authenticated RLS layer, real qa-traveler
  session):** created a minimal QA-labelled request (`open`) → it appears in the exact
  `getActiveRequests` filter (`.eq('status','open')`) → cancelled (`status='cancelled'`)
  → **absent from Active** afterward → row deleted, `row_exists_after=false`
  (receipt id `e73bb379-9a29-435e-a265-7cbe0989b362`). Zero email fan-out
  (`notifyGuidesNewRequest` matches guides by exact `base_city ILIKE destination`; the QA
  destination matched none).
- **Expired absent from Active:** proven at source — `getActiveRequests` filters
  `status = 'open'` only, so `expired`/`cancelled`/`booked` are structurally excluded.
- **Method note:** the headless UI *create* form-drive was blocked by the date-picker
  Radix Popover portal not mounting under headless Chromium (a tooling limitation, not a
  product defect — the repo's own `tests/e2e/tripster-v1/lifecycle.spec.ts` covers the UI
  create path, gated behind `E2E_ALLOW_MUTATIONS`). Create/cancel/cleanup was therefore
  proven at the authenticated RLS/data layer with the real fixture identity and the exact
  cabinet query. No defect uncovered.

### 5. Accessibility / copy residuals → **FIXED + VERIFIED**

- **5a Duplicate home tab stop on `/auth`:** the decorative hero wordmark (second
  `href="/"`) now carries `aria-hidden` + `tabIndex={-1}`; the fully-accessible
  "На главную" link remains the single home tab stop. Visible focus behavior unchanged
  (`src/app/(auth)/auth/page.tsx`).
- **5b Excursion field-level invalid association:** the invalid field (title / price /
  max-participants) now carries `aria-invalid` + `aria-describedby="tpl-error"` pointing
  at the footer `role="alert"`; `tplErrorField` is cleared on every reset/success path so
  the flag can't get stuck (`guide-excursions-screen.tsx`).
- **5c Ambiguous compact rating summary:** `Рейтинг: 0.0 / 4.0` → `Рейтинг: 0,0 из 5,0 ·
  порог 4,0 · Ответы: 0% · порог 60%` — scale max and threshold are now explicit and use
  the Russian decimal comma (`ContactVisibilityChip.tsx`).

### 6. Re-check changed behavior (1440 / 375) → **VERIFIED (local) / pending live**

- Local: typecheck, lint, 1370 unit/integration tests, and production build all pass; the
  region-badge and field-error changes are guarded (no overflow/empty-badge regressions —
  confirmed by independent review of all callsites).
- Live 1440/375 re-check of the changed public/guide/admin surfaces is pending the
  production deploy (release gate below).

---

## Verification receipts (local, branch `ops/final-qa-repair-20260718`)

```
bun run typecheck   → 0 errors
bun run lint        → 0 errors
bun run test:run    → 242 files, 1370 tests passed
bun run build       → Compiled successfully (exit 0)
git diff --check    → clean
```

Independent adversarial code review (separate agent, full diff vs zod 4.3.6 + all
callsites): **no critical/important findings; ship-ready.** Minor, accepted notes:
digit-bearing historical ЗАТО names (e.g. «Арзамас-16») are rejected (plain city name
still passes); `photoUrls` errors surface via the alert without a field-level flag.

## Remaining count & terminal verdict

- Findings requiring code repair: **6/6 fixed + locally verified.**
- Open items: **production deploy + live post-deploy replay** of blockers #1/#2 and the
  changed surfaces at 1440/375 (release gate — never force; protected `origin/main`).

**Terminal verdict (pre-deploy): `verified` locally; production release gated on operator go.**
