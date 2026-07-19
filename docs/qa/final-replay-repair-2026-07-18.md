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

### 7. Request notes («Пожелания») public exposure — High privacy → **FIXED + VERIFIED (live pre-fix repro) / live post-fix pending deploy**

Surfaced by a fresh authenticated-traveler continuation: the free-text notes field —
whose own placeholder invites *«ограничения по здоровью»* (health restrictions) — was
readable by **anonymous** visitors on the public request detail page.

- **Root cause (two leaks, traced):**
  1. **Anon (DB boundary):** `v_public_open_requests` projected
     `mask_public_contact_info(notes) AS notes` — only emails/phones masked, so
     health/personal free-text survived to `anon`. The anon detail/listing path falls
     back to this view (`getRequestById`/`getOpenRequests`).
  2. **Any authenticated non-owner (app):** RLS `traveler_requests_select` allows
     `auth.uid() IS NOT NULL AND status='open'`, so any logged-in user reads the raw
     row (incl. `notes`); the detail page then rendered it as the hero intro to
     non-members (`request-detail-screen.tsx:314`).
- **Canonical policy (new):** `canSeeRequestNotes` — notes are visible ONLY to the
  owner, an admin, or an **approved** guide. Never to anon, logged-in
  non-participants, prospective joiners, joined members; never in SEO metadata or the
  public marketplace. Public discovery keeps destination, dates, budget, group size,
  themes. (Members excluded deliberately — smallest safe choice for an underspecified
  case; the group discussion thread remains for coordination.)
- **Fix at every layer:**
  - **DB / anon boundary + retroactive remediation:** migration
    `20260719000000_privatize_request_notes.sql` reprojects the view's `notes` as
    `NULL::text`. Because a view is a live projection, this instantly stops serving
    **every already-public** request's notes to anon — the safe remediation for
    previously-public content. Safe with the current prod code (null notes → `""`).
  - **App / authenticated boundary:** the detail page gates `viewModel.notes` and the
    guide intro via `canSeeRequestNotes`; the marketplace mapper drops notes for
    non-owners; `generateMetadata` no longer echoes free-text into indexable `<meta>`.
- **Live pre-fix reproduction (prod `45f0b9ba`, self-cleaning):** created an open QA
  request with a marked sensitive note, then read it with a no-session client —
  `v_public_open_requests.notes` returned the full note verbatim, and the anonymous
  detail page rendered the marker. Both = **leak confirmed live**. Row deleted.
- **Regression:** `request-notes-visibility.test.ts` (owner/admin/approved-guide see;
  public/unapproved-guide/member do not) and the detail-page test now asserts a public
  viewer's `viewModel.notes` is `""` even when the record carries notes.
- **Note on RLS-vs-app:** the anon leak is closed at the DB boundary (the view — the
  true security boundary). Postgres RLS is row-level, so per-column privacy for
  authenticated discovery is inherently app-layer; that path is gated in the read model
  and never serializes notes to unauthorized viewers.
- **Live post-fix replay:** pending the operator-gated deploy (the view migration lands
  through the normal pipeline; no ad-hoc prod DDL was applied — no DB connection string
  in scope and prod DDL is itself gated).

### Expired-absent-from-Active proof gap → **RESOLVED**

The judge left this BLOCKED (no expired fixture; the UI blocks past dates). Resolved two
ways: (1) the existing unit test `traveler-requests.test.ts` asserts `getActiveRequests`
filters `status='open'` and never `.in([...])` that could re-admit `expired`; (2) a live
RLS proof with a **real** seeded expired record (`status='expired'`) confirmed it is
absent from the `status='open'` Active filter, then deleted. Legitimate non-production
fixture, fully cleaned.

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
bun run test:run    → 243 files, 1374 tests passed (incl. privacy + expired-Active)
bun run build       → Compiled successfully (exit 0)
git diff --check    → clean
```

Independent adversarial code review (separate agent, full diff vs zod 4.3.6 + all
callsites): **no critical/important findings; ship-ready.** Minor, accepted notes:
digit-bearing historical ЗАТО names (e.g. «Арзамас-16») are rejected (plain city name
still passes); `photoUrls` errors surface via the alert without a field-level flag.

## Release + live post-deploy proof

Operator authorized the release. Integrated via **PR #298 → `origin/main` `d5ed1bde`**
(protected merge, never force). The `notes`-privacy view migration was applied to prod as
targeted SQL via the Supabase Management API query endpoint (idempotent `CREATE OR REPLACE
VIEW`; **not** `db push`), and the migration ledger was repaired
(`schema_migrations` version `20260719000000` recorded). Reversible: the prior view
definition lives in migration `20260703000100`.

Live production proof (headless Chromium against `provodnik.app`, post-deploy):

| Check | Result |
|---|---|
| Blocker #1 — Shanghai card | `"Шанхай"`, **no «Россия»** (all cards; e.g. `"Элиста"`) |
| Blocker #2 — garbage destination | rejected live: *«Укажите название места буквами, например «Казань» или «Шанхай».»* |
| #3 — non-numeric budget | *«Укажите бюджет числом, например 5000.»*; no raw `NaN` |
| #7 — anon notes (data layer) | `v_public_open_requests.notes` returns **`null`** (was full text) |
| #7 — anon notes (rendered) | anonymous detail page **omits** the seeded sensitive note; page still loads |
| Auth lifecycle | create → Active → cancel → absent → delete (self-cleaning) |
| Expired absent from Active | real `expired` record excluded from the `status='open'` filter |
| 1440 / 375 | zero console/page errors; `/requests` 375 horizontal overflow = 0px |

All self-cleaning proofs left no data behind. No secret was printed.

## Remaining count & terminal verdict

- Findings requiring code repair: **7/7 fixed, verified locally AND on production.**
  Expired-Active proof gap resolved.
- Open items: **none.**

**Terminal verdict: `verified`.** All seven findings (two release blockers, budget,
authenticated lifecycle, three a11y/copy residuals, and the High notes-privacy leak) are
fixed, independently reviewed, and confirmed on live production `d5ed1bde`; the expired-
Active gap is closed with a real fixture. Not claimed from HTTP status or prose alone —
each rests on a live behavioral observation.
