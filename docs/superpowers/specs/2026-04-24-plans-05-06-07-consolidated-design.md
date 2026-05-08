# Plans 05 + 06 + 07 — Consolidated Design Spec

**Date:** 2026-04-24
**Scope:** Guide Inbox cleanup (Plan 05) + Guide Photo Library & Route Builder (Plan 06) + Homepage v2 as Exchange Portal (Plan 07)
**Source material:**
- `.claude/bek-sessions/active/conversation.md` + `conversation-summary.md` (live brainstorm)
- `.claude/prompts/out/plan-05-task-{1..4}.md` (BEK's Plan 05 prompts, written 22:18-22:20 before daemon restart)
- `.claude/prompts/out/plan-06.md` + `plan-06-task-{1..4}.md`
- `.claude/prompts/out/plan-07.md` + `plan-07-task-{1..3}.md`

This spec critiques what BEK produced and fills the gaps. BEK's task prompts stay as the dispatch artifacts; this document is the canonical design they should match.

---

## 1. Product narrative — what changes after all three plans land

A guide opens `/guide` and sees a clean Входящие list. Each request card shows everything needed to triage: a type badge (Своя группа or Сборная группа), destination, dates in Russian, a separate time line, group size with capacity (`4 из 8 чел.` for open groups), a mandatory budget, and interests as compact tags. No more "Сводка" card at the top. No "Подробнее" link. Filter dropdown reads "Все направления".

Guide clicks "Предложить цену" → the response panel slides in. At the top: the traveler's full description plus interests chips so the guide knows what to pitch. Below that: the offer form — but now the form has a route builder sourced from the guide's own photo library (Plan 06). Guide picks 3-5 location photos from their Portfolio, sets a start date + time + total duration; end time auto-calculates. Submits. Offer lands in the DB with `route_stops`, `route_duration_minutes`, `starts_at`, `ends_at` all populated.

Guide has a new nav item `Портфолио` between Календарь and Профиль. On that page they upload location photos with captions, reorder, delete. Their public profile page (`/guides/[slug]`) now shows the grid below their description.

A new traveler visits `/` — no marketing page anymore. Instead: a full request-creation form embedded in the hero. Mode toggle (Своя группа / Сборная группа) is the first control. Destination autocomplete. Interests tiles 3×N. Budget. Submit. If guest: inline auth Dialog opens, sign-in or sign-up as traveler, request is created on success, redirects to `/traveler/requests/{id}`. No separate auth page, no redirect dance.

---

## 2. Terminology lock (do not deviate)

| Concept | Canonical Russian | Code enum | DB column |
|---|---|---|---|
| Private group (one traveler books a guide privately) | **Своя группа** | `mode: "private"` | `open_to_join = false` |
| Open/assembly group (strangers can pool money) | **Сборная группа** | `mode: "assembly"` | `open_to_join = true` |
| Guide response panel (side slide-out) | **Панель отклика** | `BidFormPanel` | — |

**Drift found in BEK's prompts:** Plan 05 Task 2 and Task 3 label the non-assembly option as `Приватный тур`. That violates the terminology lock. Fix: rename every `Приватный тур` → `Своя группа` in both prompts before dispatch.

---

## 3. Database facts (verified)

From BEK's Supabase Management API inspection (Plan 05 Task 1 context):

- `traveler_requests` has:
  - `open_to_join boolean` (drives the mode badge — **not** a `format_preference` column)
  - `interests text[]` (postgres array of slugs)
  - `start_time time`, `end_time time` — PostgREST returns `"HH:MM:SS"`, must slice to `"HH:MM"`
  - `group_capacity int`, `participants_count int`
  - `budget_minor int` (kopecks)
- `guide_offers` already has `starts_at timestamptz` and `ends_at timestamptz` columns that are nullable and currently never populated. Plan 06 Task 4 starts populating them.

**No schema changes for Plan 05 or Plan 07.** Plan 06 Task 1 adds:
- `guide_location_photos` table (id, guide_id FK, storage_asset_id FK, location_name, sort_order, created_at) with RLS
- `storage_asset_kind` enum gains `"guide-portfolio"`
- `guide_offers` gains `route_stops jsonb NOT NULL DEFAULT '[]'`, `route_duration_minutes int` (nullable)

---

## 4. Canonical interest slug set

Locked by Plan 05 Task 1 (authoritative source for all three plans):

```
history, architecture, nature, food, art,
active, adventure, religion, kids, unusual, nightlife
```

Russian labels (used in Plan 05 Task 2, Plan 05 Task 3, Plan 07 Task 2):

| Slug | Label |
|---|---|
| `history` | История |
| `architecture` | Архитектура |
| `nature` | Природа |
| `food` | Гастрономия |
| `art` | Искусство |
| `active` | Активный отдых |
| `adventure` | Активный отдых |
| `religion` | Религия |
| `kids` | Для детей |
| `unusual` | Необычное |
| `nightlife` | Ночная жизнь |

`adventure` duplicates `active`'s label on purpose — legacy slug mapped to same category. Do not add a new label.

---

## 5. Plan 05 — Guide Inbox (4 tasks)

### Intent
Fix the data mapping layer so request cards show real information. Clean up the inbox screen around what guides need to triage quickly. Move full description into the response panel. Delete orphan routes.

**Frontend only.** No DB changes. Easy to verify in one pass.

### Task 05-1 — Fix `RequestRecord` + `mapRequestRow`
**File:** `src/data/supabase/queries.ts` (modify only)

**BEK's prompt is correct.** Preserve as-is with these additions the prompt missed:

1. **Russian date rendering.** Session decision: dates must display as `"15 мая"` (single) or `"15 мая – 20 мая"` (range). BEK's prompt keeps the legacy `formatDateLabel` fallback — which is not Russian-formatted.
   - Add a new file `src/lib/dates.ts` with `formatRussianDateRange(startsOn, endsOn?)` producing the above.
   - Update `mapRequestRow` to use it for the non-meta path: `dateLabel: meta.dateRangeLabel ?? formatRussianDateRange(row.starts_on, row.ends_on)`.
   - Also export `formatTimeRange(start?, end?)` → `"10:00 – 14:00"` / `"10:00"` / `""`.

2. **Budget mandatory.** Session decision: `budgetLabel` never says "По договорённости".
   - Replace `budgetLabel: budgetMinor ? ${formatRub(budgetRub)} / чел. : "По договорённости"` with unconditional `${formatRub(budgetRub)} / чел.`.

3. BEK's `mode: "private" | "assembly"` enum and `interests: string[]` additions stay as specified.

### Task 05-2 — Inbox screen cleanup
**File:** `src/features/guide/components/requests/guide-requests-inbox-screen.tsx` (modify only)

**BEK's prompt covers:** delete Сводка card, rename filter label, remove "Подробнее" link, add mode badge, add interests display, add `INTEREST_LABELS` const.

**Missing from BEK's prompt (add these):**

1. **Terminology fix.** Change `"Приватный тур"` → `"Своя группа"` in the mode badge.
2. **Separate time line.** The card's meta grid currently shows `{item.dateLabel}{item.startTime ? ...}`. Split:
   - Dates row: `{item.dateLabel}` only.
   - Time row (below dates, rendered only when non-empty): `{formatTimeRange(item.startTime, item.endTime)}`.
3. **Group size "N из M чел." for open groups:**
   - Replace `{item.groupSize} чел.` with `{item.mode === "assembly" ? \`${item.groupSize} из ${item.capacity} чел.\` : \`${item.groupSize} чел.\`}`.

### Task 05-3 — Add request context block to BidFormPanel
**File:** `src/features/guide/components/requests/bid-form-panel.tsx` (modify only)

**BEK's prompt covers:** insert a block between header and form showing mode badge, interests, description (line-clamped to 3).

**Missing from BEK's prompt:**

1. **Terminology fix:** `"Приватный тур"` → `"Своя группа"`.
2. **Description should NOT be line-clamped.** Session decision: full description, no truncation — that's the whole point of moving it into the panel. Change `line-clamp-3` → remove the clamp, use `whitespace-pre-line`.
3. **Empty description case:** if `request.description` is empty, render `"Описание не указано"` in italic muted text so the missing data is visible rather than silently hidden.

### Task 05-4 — Delete vestigial pages
**Files:**
- DELETE `src/app/(protected)/guide/inbox/[requestId]/page.tsx`
- DELETE `src/app/(protected)/guide/inbox/[requestId]/loading.tsx`
- DELETE `src/app/(protected)/guide/inbox/[requestId]/offer/page.tsx`
- DELETE `src/features/guide/components/requests/guide-request-detail-screen.tsx` — **add this** (BEK's prompt keeps the orphan component)
- KEEP `src/app/(protected)/guide/inbox/[requestId]/offer/actions.ts` — still imported by BidFormPanel

BEK's "keep actions.ts in place" decision is correct — moving it to a non-route location (as I proposed earlier) is unnecessary churn.

**After all deletions, run `rg "guide-request-detail-screen"` and `rg "/guide/inbox/\[requestId\]/(page|loading|offer)"` — any remaining references must be removed.**

### Plan 05 verification

Manual smoke on `/guide` Входящие tab:
- [ ] No "Сводка по запросам" card.
- [ ] Filter dropdown: "Все направления".
- [ ] Each card: mode badge (`Своя группа` or `Сборная группа`), destination, Russian-formatted dates, **separate time line** (when present), `N чел.` for private / `N из M чел.` for assembly, budget visible (no "По договорённости"), interests chips (when present).
- [ ] No "Подробнее" button on any card.
- [ ] Clicking "Предложить цену" opens the response panel with the context block at top: mode badge, interests, **full description** (no truncation, empty-state message if blank).
- [ ] `/guide/inbox/<any-id>` returns 404.
- [ ] `/guide/inbox/<any-id>/offer` returns 404.

---

## 6. Plan 06 — Guide Photo Library & Route Builder (4 tasks)

### Intent
Guides can upload a library of location photos. When bidding on a request, they assemble a route from that library and set a total duration. Public profile shows the photo grid.

### Task 06-1 — DB migration + types
**BEK's prompt is correct. No changes needed.**

Migration `supabase/migrations/20260424000001_guide_photo_library.sql`:
- Adds `guide-portfolio` to `storage_asset_kind` enum.
- Creates `guide_location_photos` with guide-scoped FOR ALL RLS + public SELECT RLS.
- Adds `route_stops jsonb NOT NULL DEFAULT '[]'` and `route_duration_minutes int` to `guide_offers`.

Types update in `src/lib/supabase/types.ts`: `StorageAssetKindDb`, new `GuideLocationPhotoRow`, two fields on `GuideOfferRow`.

### Task 06-2 — Portfolio page
**BEK's prompt is correct.** Creates:
- `src/data/guide-assets/supabase-client.ts` — 4 CRUD functions: `listGuideLocationPhotos`, `insertGuideLocationPhoto`, `deleteGuideLocationPhoto`, `updateGuideLocationPhotoOrder`.
- `src/app/(protected)/guide/portfolio/page.tsx` — auth-guarded server page.
- `src/features/guide/components/portfolio/guide-portfolio-screen.tsx` — upload + grid + delete + drag-to-reorder.
- Nav link insertion in `src/components/shared/site-header.tsx`: `{ href: "/guide/portfolio", label: "Портфолио" }` between Календарь and Профиль.

### Task 06-3 — Public guide profile photo grid
**BEK's prompt is correct.** Modifies:
- `src/data/supabase/queries.ts` — add `getGuideLocationPhotos(supabase, guideId)`.
- `src/app/(site)/guides/[slug]/page.tsx` — fetch photos via `Promise.all`, pass to screen.
- `src/features/guide/components/public/guide-profile-screen.tsx` — add `photos` prop.
- NEW: `src/features/guide/components/public/guide-photo-grid.tsx` — grid with img + caption, hidden when empty.

### Task 06-4 — BidFormPanel route builder
**BEK's prompt is largely correct** but has two cross-plan risks:

**Risk A (critical): collides with Plan 05 Task 3.** Both tasks modify `src/features/guide/components/requests/bid-form-panel.tsx`. Plan 05 Task 3 adds the context block; Plan 06 Task 4 adds the route builder + date/time/duration inputs. **Merge order must be: Plan 05 Task 3 FIRST, then Plan 06 Task 4.** The consolidated spec mandates this sequence. Plan 06 Task 4's implementer must preserve the context block added by Plan 05 Task 3 — insert route builder fields into the form section, do not touch the header or context block.

**Risk B (flag): Task 4 quietly starts populating `starts_at` / `ends_at` on `guide_offers`.** These columns already existed but were never populated. After this task, offers carry explicit timestamps — distinct from `traveler_requests.starts_at/ends_at`. Any downstream code reading "excursion start time" must decide whether to read from offer or request. **Deferred out of scope, but worth adding to `SOT.md` or `.claude/sot/DECISIONS.md` as a pending consistency decision.**

**Risk C (minor): MSK timezone handling.** BEK's prompt includes the HOT rule for `+03:00` offset (AP-010). Implementer must follow this verbatim — do not use `new Date().toISOString()`.

Task 4 also adds `formatDurationMinutes` to `src/lib/dates.ts`. That's the **same file** Plan 05 Task 1's additions should create. Coordinate: Plan 05 Task 1 creates the file with `formatRussianDateRange` + `formatTimeRange`; Plan 06 Task 4 appends `formatDurationMinutes` to the existing file.

### Plan 06 verification

- [ ] Migration applied; `\d guide_location_photos` shows table with RLS.
- [ ] `/guide/portfolio` renders; guide can upload, name, reorder, delete photos.
- [ ] Public `/guides/[slug]` shows photo grid between description and listings (hidden when empty).
- [ ] BidFormPanel has: route builder section (pick from portfolio), date input, start time input, total duration selectors, end time displayed read-only.
- [ ] Submitting a bid writes `route_stops`, `route_duration_minutes`, `starts_at`, `ends_at` to `guide_offers`.

---

## 7. Plan 07 — Homepage v2 (3 tasks)

### Intent
Stop being a marketing page; become the booking portal. Homepage = full request form. Guests can fill before auth; auth Dialog opens on submit; after auth, request is created and user redirects to their request detail page.

### Task 07-1 — HomepageAuthGate Dialog
**BEK's prompt is correct.** New file: `src/features/homepage/components/homepage-auth-gate.tsx`. Client component. Props: `{ open, onOpenChange, onAuthSuccess }`. Sign-in uses browser client; sign-up MUST use `signUpAction` (HOT ADR-014 / ERR-029 — never `supabase.auth.signUp` from client). Role hardcoded `"traveler"`.

### Task 07-2 — HomepageRequestForm
**BEK's prompt is correct in shape.** New file: `src/features/homepage/components/homepage-request-form.tsx`. Schema mirrors `traveler-request-create-form.tsx` — `mode: "private" | "assembly"` (matches Plan 05 Task 1's enum), interests, destination (datalist autocomplete), dates, group size, budget, notes. Destinations prop driven by `getDestinations`. On submit (guest): open HomepageAuthGate. On submit (authed): call `createTravelerRequestAction`.

### Task 07-3 — Hero + shell + route swap
**BEK's prompt is correct.** Creates `homepage-hero-form.tsx` wrapping HomepageRequestForm. Swaps `HomePageHero2` → `HomePageHeroForm` in `homepage-shell2.tsx`. Root route `src/app/(home)/page.tsx` switches from `HomePageShell` → `HomePageShell2` and fetches destinations + open requests. Removes the dead `/listings` link from `homepage-hero2.tsx` (the "View ready tours" link that pointed to a hidden section — Alex confirmed removal).

### Plan 07 verification

- [ ] `/` shows headline + full form + discovery feed (no marketing blocks).
- [ ] Mode toggle is the first form element; both options equally prominent.
- [ ] Guest submits → AuthGate opens → register/sign-in → dialog closes → request created → redirects to `/traveler/requests/{id}`.
- [ ] Authed user submits → request created directly → same redirect.
- [ ] `/home2` still works unchanged (parallel route preserved for Anzor's experiments).
- [ ] No more `/listings` link anywhere on the homepage.

---

## 8. Cross-plan dependency DAG

```
Plan 05 Task 1 (RequestRecord + mode + interests + dates.ts)
├── Plan 05 Task 2 (inbox screen redesign)
├── Plan 05 Task 3 (BidFormPanel context block) ──┐
└── Plan 07 Task 2 (HomepageRequestForm)          │
                                                  │
Plan 05 Task 4 (delete pages) [after Task 2]      │
                                                  ▼
Plan 06 Task 1 (DB migration + types)           Plan 06 Task 4 (BidFormPanel route builder)
├── Plan 06 Task 2 (portfolio page) ─────────────┘   [REQUIRES Plan 05 Task 3 merged]
├── Plan 06 Task 3 (public photo grid)
└── Plan 06 Task 4 (BidFormPanel route builder)
    [REQUIRES Plan 06 Task 1 + Task 2 + Plan 05 Task 3]

Plan 07 Task 1 (AuthGate, no deps)
├── Plan 07 Task 2 (HomepageRequestForm) [REQUIRES Task 1 + Plan 05 Task 1's mode enum]
└── Plan 07 Task 3 (hero + shell wire-up) [REQUIRES Task 1 + Task 2]
```

### Mandatory merge order

1. **Plan 05 Task 1** — foundational. Everything downstream needs the new `mode`, `interests`, `dates.ts`.
2. **Plan 05 Task 2** + **Plan 05 Task 4** (parallel OK — independent files).
3. **Plan 05 Task 3** — BidFormPanel context block.
4. **Plan 06 Task 1** — DB migration + types.
5. **Plan 06 Task 2** + **Plan 06 Task 3** (parallel OK).
6. **Plan 06 Task 4** — BidFormPanel route builder. Must land AFTER Plan 05 Task 3. Implementer must preserve the context block.
7. **Plan 07 Task 1** (AuthGate).
8. **Plan 07 Task 2** (HomepageRequestForm).
9. **Plan 07 Task 3** (hero + route swap).

Plan 06 and Plan 07 can interleave after Plan 05 is fully done — 06 and 07 touch disjoint files until the final e2e verification.

---

## 9. Collisions & resolutions

| Conflict | Resolution |
|---|---|
| Plan 05 Task 3 and Plan 06 Task 4 both modify `bid-form-panel.tsx` | Merge 05-T3 first. 06-T4 implementer reads the merged file before touching it (per INVESTIGATION RULE in every prompt). Context block stays intact; route builder is added inside the form section below the header/context divider. |
| `src/lib/dates.ts` — Plan 05 Task 1 creates it, Plan 06 Task 4 appends to it | 05-T1 creates with `formatRussianDateRange` + `formatTimeRange`. 06-T4 appends `formatDurationMinutes` to the existing file. Both prompts use `MODIFY` semantics on the shared file. |
| Mode enum `"private" \| "assembly"` used across Plan 05, Plan 07 | Consistent in BEK's prompts. Keep. Map from DB's `open_to_join boolean` in all read paths. |
| Interest slug list — Plan 05 Task 1 defines `VALID_INTEREST_SLUGS` internal; Plan 05 Task 2 / Plan 05 Task 3 define `INTEREST_LABELS` map; Plan 07 Task 2 defines `INTEREST_OPTIONS` with icons | Three overlapping maps. Acceptable — they serve different layers (DB validation, guide-side display labels, traveler-side form tiles). Document the divergence so a future refactor can DRY them. **Recommend later:** extract `src/features/interests/interests.ts` as single source of truth. Not in scope here. |

---

## 10. Gaps BEK missed — explicit enumeration

These are all confirmed in the session transcript but absent from BEK's task prompts:

1. **Russian date format** (session: "15 мая", "15 мая – 20 мая"). Not implemented. Adding via `src/lib/dates.ts` in Plan 05 Task 1.
2. **Separate time line on the card** (session: "time as separate labeled field"). Not implemented. Adding in Plan 05 Task 2.
3. **`N из M чел.` for open groups** (session: explicit). Not implemented. Adding in Plan 05 Task 2.
4. **Budget mandatory** (session: "by agreement" is not acceptable). Not implemented — legacy fallback preserved. Fixing in Plan 05 Task 1.
5. **Terminology drift** (`Приватный тур` vs `Своя группа`). Fixing in Plan 05 Task 2 + Task 3.
6. **Full description without truncation** (session: "description without truncation"). BEK uses `line-clamp-3`. Fixing in Plan 05 Task 3.
7. **Empty description user-visible fallback** (not explicitly in session; inferred from "missing data should surface, not hide"). Adding in Plan 05 Task 3.
8. **Delete `guide-request-detail-screen.tsx`** component (orphan after its page is deleted). Adding to Plan 05 Task 4.

---

## 11. What's NOT in any of these plans

Deferred explicitly:
- Advanced destination filter (categories beyond cities — villages/mountains/etc.). Session says "label fix only for now".
- Traveler-facing display of `route_stops` on an offer. Plan 06 calls this "Plan 07+".
- Reordering route stops after submission.
- Photo editing / cropping in portfolio.
- Integration of `guide_offers.starts_at/ends_at` with calendar / notifications.
- DRY-ing the three interest slug/label maps.
- Cleanup of `homepage-shell.tsx` + v1 components (Plan 07 says "cleanup deferred").

---

## 12. End-to-end verification (run after all 11 tasks merged)

**As Guide `guide@test`:**
1. Open `/guide` → Входящие shows clean cards with badges, Russian dates, time line, `N из M чел.`, budget, interests. Filter dropdown "Все направления".
2. Open `/guide/portfolio` → upload 3 location photos with captions. Reorder them. Delete one.
3. Open public `/guides/guide@test` → see photo grid with captions.
4. Back on `/guide` → click "Предложить цену" on any request.
5. Response panel: top section shows mode badge + interests + full traveler description.
6. Below: date input, start time, total duration selectors (hours + minutes), auto-calculated end time, route builder (pick from portfolio), price, message, valid until.
7. Submit → offer created; inspect `guide_offers` row — `route_stops`, `route_duration_minutes`, `starts_at`, `ends_at`, `price_minor`, `message` all populated correctly.
8. `/guide/inbox/<any-id>` → 404. `/guide/inbox/<any-id>/offer` → 404.

**As Guest (no session):**
1. Open `/` → see headline + embedded request form.
2. Pick `Сборная группа` mode → fields expand.
3. Fill destination (autocomplete), dates, interests tiles, group size, budget.
4. Submit → AuthGate Dialog opens.
5. Sign up → Dialog closes → request is created → redirect to `/traveler/requests/{id}`.

**As authed Traveler `traveler@test`:**
1. Open `/` → see same form.
2. Submit → no dialog; direct request creation; redirect to `/traveler/requests/{id}`.

**All surfaces:**
- `bun run typecheck` zero errors.
- `bun run lint` zero new errors.
- `bun run test:run` existing tests pass.

---

## 13. Rollout risks

| Risk | Mitigation |
|---|---|
| Terminology inconsistency leaks to production (`Приватный тур` in code, `Своя группа` in product) | Pre-merge grep sweep: `rg "Приватный тур"` must return zero hits outside archived docs. |
| Plan 06 Task 4 overwrites Plan 05 Task 3's context block | Implementer follows INVESTIGATION RULE, reads merged file first. Code review: context block must still exist in BidFormPanel after 06-T4 lands. |
| Plan 05 Task 1 changes `RequestRecord` shape — breaks unrelated consumers | TypeScript is the contract. `bun run typecheck` catches any breakage. `mode` and `interests` are required (non-optional) — intentionally strict so consumers break loudly if they forget to handle them. |
| Homepage swap (Plan 07 Task 3) breaks `/` for all users at once | Feature branch; manual smoke before merge; `/home2` preserved as fallback in case a rollback is needed. |
| `starts_at/ends_at` now populated on offers but downstream reads request.starts_at | Flag for SOT: pending decision. Not a blocker for these three plans; may surface in Plan 08+. |
| `src/lib/dates.ts` — two tasks touch the same new file | 05-T1 creates it; 06-T4 appends. Explicit in task prompt order. Dispatcher must respect it. |

---

## 14. Out of scope (deferred to future plans)

- Chat integration on accepted offers (Plan 08 candidate)
- Notification system for accepted/rejected offers
- Offer expiry cron
- Multi-currency support
- Analytics on form conversion
- Mobile PWA considerations (Plan 07 builds mobile-first but no PWA shell)
- Editing submitted offers
- Request status transitions beyond `open / booked / cancelled / expired`
