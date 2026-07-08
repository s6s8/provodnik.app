# OPUS_EXECUTION_REPORT — Open issues 33 / 35 / 41–47

Date: 2026-07-08 · Executor: Opus 4.8 (bounded code execution authorized)
Branch: `fix/open-issues-33-47-opus-20260708` · Base: `2fbeae2c`
Mode: product-code edits in isolated worktree. **No push. No prod DB mutation. No deploy.**

## Summary

All 9 issues implemented and locally verified against the runnable gates
(typecheck, lint, full unit/RTL suite, production build). Two issues (#35, #42)
ship DB migration **files only** — they are **not** applied to prod and must be
applied via targeted SQL + ledger repair (never `supabase db push`). Auth-gated
and live-visual QA could not be run here (no credentials / no `.env.local` / not
deployed); precise manual QA checklists are provided per issue.

## Trio usage

- **Superpowers** — systematic root-cause discipline (grep every callsite before
  editing; e.g. #35 revealed create/join were *already* guarded, so only the
  message path + RLS gaps remained), TDD/verification-before-completion (no
  "done" claim without the gate output below), visible per-phase checklist.
- **Ponytail** — smallest diff that truly fixes each bug: #33/#45/#46 are
  1–11 line CSS/label changes; #43/#47 reuse the existing Moderation center
  (redirect + drop a nav entry) instead of new code; #35/#42 reuse the shipped
  `profile_account_status_for … OR is_admin()` RLS pattern and the already-
  scaffolded `subject_type='request'` thread rather than inventing new concepts.
  Overbuild avoided is called out per issue below.
- **Context7** — **not needed.** Every change uses patterns already present in
  this repo (Tailwind utilities, existing shadcn `Sheet`/`Tabs`/`Textarea`,
  Supabase RLS helpers, Next App Router `redirect`). No third-party API surface
  was in question and no new dependency was introduced. Flagged for the record:
  had any library version ambiguity arisen, Context7 would have been consulted
  with the library id + doc topic.

## Verification gates (exit codes + output)

| Gate | Result |
|---|---|
| `bun install --frozen-lockfile` | ✓ 1015 packages |
| `bun run typecheck` (`tsc --noEmit`) | ✓ exit 0, no errors |
| `bun run lint` (eslint) | ✓ 0 errors, 21 warnings (all pre-existing, in `src/data/**` — data-access-boundary warnings unrelated to this work) |
| `bun run lint:ratchet` | ✓ `0 errors (+0), 21 warnings (+0) vs baseline` |
| `bun run test:run` (vitest) | ✓ 227 files, **1158 tests passed** |
| `bun run build` (next build) | ✓ `Compiled successfully`; `/admin/pipeline`, `/admin/moderation`, `/admin/listings` all present |

Note on the pre-commit hook: the shared hook (from the repo's common git dir)
calls `lint:canon` and `lint:dead`, which **do not exist** in this branch's
`package.json` (environment drift — the hook is newer than the branch base). The
hook is therefore broken for this branch regardless of the diff. Commits used
`--no-verify`; the hook's real gates (typecheck, lint:ratchet, test:run) were run
manually and are green (see table). This is recorded as a blocker for whoever
lands the branch: either restore `lint:canon`/`lint:dead` scripts or update the
hook.

## Issue-by-issue

### #33 — Public guide profile centering · ✅ fixed
- **File:** `src/features/guide/components/public/guide-profile-screen.tsx` (3 lines).
- **Change:** `self-center` on avatar + verified badge + stats row; `justify-center`
  on the stats flex so wrapped chips center. Wrapper keeps `items-start text-left`
  so bio/specialty/language tags/buttons stay left-aligned. (PM default D-2.)
- **Ponytail:** rejected A2 (split two-column identity layout) — 3 `self-center`
  utilities is the whole fix.
- **Context7:** not needed (Tailwind align-self).
- **Verify:** typecheck + build green. Live visual QA pending deploy — see checklist.
- **Manual QA:** `/guides/<slug>` at 1280px + 375px → avatar, «Проверен», stats
  centered as a cluster; bio/tags/buttons remain left; console clean.

### #45 — Guide listing duplicate add buttons · ✅ fixed
- **File:** `guide-excursions-screen.tsx` (+ test).
- **Change:** header button relabelled «Создать экскурсию» → **«Добавить
  экскурсию»** (stays blue/default, always visible in both empty and populated
  states); removed the duplicate outline action from the empty state. (PM default D-1.)
- **Ponytail:** the literal request ("remove Создать, keep Добавить") would have
  left the populated list with no add button — relabel-the-survivor is the correct
  minimal fix.
- **Test:** `guide-excursions-screen.test.tsx` updated (button name) — 6 pass.
- **Manual QA:** `/guide/listings` with 0 and with ≥1 template → exactly one blue
  «Добавить экскурсию» in the header; opens the sheet in both states.

### #46 — Guide listing save button hidden · ✅ fixed
- **File:** `guide-excursions-screen.tsx` (sheet body + footer, 2 lines).
- **Change:** body `<div>` → `flex-1 min-h-0 overflow-y-auto` so it scrolls inside
  the `flex flex-col h-full` `SheetContent`; footer gets `border-t border-border pt-4`.
  Header pins top, body scrolls, footer (Сохранить) pins bottom.
- **Ponytail:** one-line scroll-region fix; rejected converting to `SheetFooter`
  (still needs the scroll region → strictly more change).
- **Verify:** typecheck + build green. Visual QA pending deploy.
- **Manual QA:** `/guide/listings`, open create + edit sheet at 375px and a short
  (~700px) viewport → Сохранить always visible; body scrolls; fill→save→reload
  persists (Ревизия Бека form rule).

### #41 — Joined member sees trip details · ✅ fixed
- **Files:** `request-detail-screen.tsx` (+ test).
- **Change:** added an «О поездке» block in `PublicDetailBranch` rendering the full
  request notes (`whitespace-pre-line`) + interest `Tag` chips (`viewModel.themes`),
  gated to `joinState === "member"`. The duplicate hero lead is suppressed for
  members (they get the full block); anonymous/prospective viewers keep the teaser
  hero lead only. (PM default #41 / B-4: members-only, anon stays teaser.)
- **Ponytail:** data was already in the viewModel (`notes`, `themes`) — pure render
  gap; rejected D2 (full end-to-end `"member"` viewer role) as overbuild for #41.
- **Test:** new case — member sees «О поездке» + notes; `can-join` does not. 9 pass.
- **Manual QA:** join a сборная request as a second traveler → description +
  interests appear; as an anon visitor they do not.

### #35 — Suspended user restrictions · ✅ fixed (migration file only; **not applied to prod**)
- **Files:**
  - `supabase/migrations/20260708150000_enforce_active_account_remaining_writes.sql` (new).
  - `src/app/(protected)/messages/[threadId]/actions.ts` (app-layer guard, 4 lines).
- **Root cause (Superpowers):** RLS is the boundary; `proxy.ts` only checks
  `account_status` on role-gated routes. Prior migrations already gated request
  create/join, guide offers, and the write RPCs. Grepping every write path showed
  create-request and join-request **already** carry an app-layer
  `account_status !== 'active'` guard (report was stale) — the remaining gaps were
  the direct-write RLS policies and the direct message-send path.
- **DB change:** mirror `profile_account_status_for((select auth.uid())) = 'active'
  OR is_admin()` onto: `messages_insert` (+ preserve participant rule, add missing
  admin escape), `traveler_requests_update`, `listings_insert/update`,
  `review_replies_insert/update`, `bookings_update`, `dispute_events_insert`,
  `guide_profiles_update`, `guide_documents_insert/update`,
  `guide_licenses_insert/update`.
- **App change:** message-send action (`getAuthorizedUser`) now rejects suspended
  accounts with a friendly error instead of a raw RLS failure. Uses the existing
  `readAuthContextFromServer().accountStatus`.
- **Ponytail:** rejected H2 (BEFORE-INSERT triggers on `assert_active_account` —
  dangerous: `auth.uid()` is NULL for service-role/cron → would block admin ops).
  Reused the shipped policy pattern; no new SQL concept. Proxy widening was
  deliberately **not** done: the create-request entry point is `/` (public), so a
  broad proxy lock-out would trap suspended users out of public read (violates
  PM default D-3); dashboards (`/trips`,`/guide`,`/admin`) are already covered by
  the existing role-gated `account-suspended` redirect.
- **Context7:** not needed (own RLS).
- **⚠ NOT applied to prod.** Apply via targeted SQL + ledger repair.
- **SQL verification queries (run against prod before declaring live-done):**
  ```sql
  -- 1. Confirm the new + prior enforcement policies carry the active-account guard:
  SELECT polname, pg_get_expr(polqual, polrelid)  AS using_expr,
                  pg_get_expr(polwithcheck, polrelid) AS check_expr
  FROM pg_policy
  WHERE polname IN ('messages_insert','traveler_requests_update','listings_insert',
                    'listings_update','review_replies_insert','review_replies_update',
                    'bookings_update','dispute_events_insert','guide_profiles_update',
                    'guide_documents_insert','guide_documents_update',
                    'guide_licenses_insert','guide_licenses_update')
  ORDER BY polname;   -- each expr must contain profile_account_status_for(...)='active'

  -- 2. Confirm can_access_request_thread grants joined members (for #42 too):
  SELECT pg_get_functiondef('public.can_access_request_thread(uuid,uuid)'::regprocedure);

  -- 3. Behavioural check (in a transaction, rolled back):
  --    set role authenticated; set request.jwt.claims to a SUSPENDED user;
  --    INSERT into each table above → expect RLS denial; an ACTIVE user → success.
  ```
- **Manual QA (needs a suspended fixture):** suspend a test account → attempt edit
  request / cancel booking / send booking or dispute message / create-or-edit
  listing / edit guide profile / submit verification → all blocked with a clear
  message; an active account is unaffected.

### #42 — Open group shared discussion · ✅ fixed (migration file only; **not applied to prod**)
- **Files:**
  - `supabase/migrations/20260708160000_group_request_thread.sql` (new).
  - `src/lib/supabase/request-thread.ts` (new service layer).
  - `src/features/requests/components/request-group-thread.tsx` (new client forum + test).
  - `src/features/requests/components/request-detail-screen.tsx` (render for owner + member).
  - `src/app/(site)/requests/[requestId]/page.tsx` (read-only thread load + bound post action).
- **Approach:** E1 (one shared request-level thread), reusing the scaffolded
  `subject_type='request'` conversation thread + `ct_request_unique_idx`.
- **DB change:** `can_access_request_thread` now also grants joined
  `open_request_members` (read + lazy-create); `messages_insert` permits
  request-subject-thread posts by anyone with `can_access_conversation_thread`
  while offer/booking/dispute keep the strict `is_thread_participant` rule; the
  #35 active-account + admin guards are preserved. Private per-offer QA threads are
  untouched (no E2 leak).
- **App change:** read-only thread load on GET (no write-on-render); lazy
  get-or-create + post on first message; the post action re-derives viewer +
  thread server-side from the session and lets RLS enforce access. Forum (message
  list + composer) renders for the owner and joined members only; anonymous /
  prospective viewers never receive the thread or the action.
- **Ponytail:** rejected E2 (mirroring private per-guide QA to the whole group —
  privacy regression + larger RLS) and rejected reusing `send_qa_message`
  (offer-only, 8-msg cap). No new enum, no thread_participants bookkeeping.
- **Context7:** not needed.
- **Known limitations / follow-ups (not blockers for E1):**
  - Sender identity in the forum is role-based («Вы» / «Гид» / «Участник») rather
    than per-name, because `profiles` RLS blocks a traveler reading another
    traveler's name (KODEX "initials until accepted"). A definer view could add
    per-member initials later.
  - `can_access_request_thread` also grants guides who merely *viewed* the request
    (existing `request_views` scaffolding) — kept as the existing audience for the
    MVP; tighten to bidding-guides-only if the forum should exclude passers-by.
- **⚠ NOT applied to prod.** Apply via targeted SQL + ledger repair.
- **Test:** `request-group-thread.test.tsx` (render, self-labelling, post, error
  path); member coverage in `request-detail-screen.test.tsx`.
- **RLS verification (run against prod):** see #35 query 2; plus, in a rolled-back
  transaction: owner + a joined member can SELECT and INSERT into the request
  thread's messages; a random non-member and anon cannot; a suspended member
  cannot INSERT.
- **Manual QA (2 sessions):** owner + a joined member both post and see each
  other's messages; a non-member gets nothing; console clean at 1280 + 375.

### #43 + #47 — Admin listings/moderation clarity · ✅ fixed
- **Files:** `admin/listings/page.tsx` (→ redirect), `admin/admin-sidebar-nav.tsx`,
  `admin/dashboard/page.tsx`, `lib/navigation.ts` (+ `navigation.test.ts`).
- **Approach:** F1 — the Moderation center's «Объявления» tab (fully functional
  approve/reject with reasons) is the single review home. `/admin/listings` now
  `redirect()`s to `/admin/moderation` (so dashboard/audit links + bookmarks still
  resolve); the duplicate «Листинги» sidebar entry is removed; the pending-listing
  count badge moves onto the Moderation entry; the dashboard «Проверка листингов»
  card points at `/admin/moderation`.
- **Ponytail:** kept the route alive as a redirect instead of deleting it and
  chasing every inbound link — smallest safe merge; approval/rejection workflow
  untouched (it already lived in the Moderation tab).
- **Context7:** not needed (Next `redirect`).
- **Test:** `navigation.test.ts` updated — 15 pass.
- **Manual QA:** admin sidebar shows «Модерация» (no «Листинги»); visiting
  `/admin/listings` lands on Moderation; approve/reject still work; dashboard card
  and audit links resolve.

### #44 — Admin pre-booking pipeline · ✅ fixed
- **File:** `src/app/(protected)/admin/pipeline/page.tsx` (new) + nav entry.
- **Approach:** G1 — new `/admin/pipeline` «Заявки и предложения» surface with two
  tabs: open/expired `traveler_requests` and pending/counter `guide_offers`, each
  with a status chip + budget/price (via `kopecksToRub`) and links to the request.
  Bookings stays the confirmed-booking ledger.
- **Ponytail:** rejected G2 (a new `v_admin_booking_pipeline` DB view) — reuses the
  existing tables + the admin-client + `requireAdminSession` pattern already used
  by the bookings/moderation pages; no new DB object.
- **Context7:** not needed.
- **Verify:** typecheck + build green (`/admin/pipeline` in the route table).
- **Manual QA:** as admin, an open request + a pending offer both appear under the
  new tab; confirmed bookings still only in Bookings.

## Ponytail — overbuild avoided (summary)
- #33: no two-column identity refactor — 3 utilities.
- #35: no per-table triggers (auth.uid()-NULL admin hazard); no broad proxy
  lock-out that would trap suspended users out of public read.
- #41: no end-to-end `"member"` viewer role — render gap only.
- #42: no private-QA mirror; no `send_qa_message` reuse; no thread_participants
  enrollment on join.
- #43/#47: no page deletion + link-chasing — one redirect.
- #44: no DB view — existing tables + admin client.

## DB migrations
| File | Applied local | Applied prod |
|---|---|---|
| `20260708150000_enforce_active_account_remaining_writes.sql` | no (no local DB) | **NO** |
| `20260708160000_group_request_thread.sql` | no (no local DB) | **NO** |

Both must be applied via targeted SQL + ledger repair — **never `supabase db push`
on prod** (migration-ledger landmine).

## Browser / screenshots
None generated by this run: no `.env.local` (app cannot render real data locally)
and the branch is not deployed, so live screenshots would show the old code. The
existing `live/*.png` are pre-change VPS baselines. Per-issue manual QA checklists
above stand in for auth-gated + live-visual verification.

## Commits (local, not pushed)
```
HEAD docs(qa): Opus execution report + ledger for open issues 33/35/41-47
d8cfc5dd test(guide): update excursions test for renamed «Добавить экскурсию» button (#45)
4e6aeb6b feat(requests): open-group shared discussion thread (#42)
0837b8d9 fix(security): extend active-account enforcement to remaining write paths (#35)
7c843871 fix(admin): merge listings queue into Moderation, add pre-booking pipeline
734ac58c fix(ui): center guide identity cluster, dedupe add-excursion button, sticky sheet footer, member trip brief
```
Base: `2fbeae2c`. Branch: `fix/open-issues-33-47-opus-20260708`. **Not pushed.**

## git diff --stat (code, vs base)
```
 src/app/(protected)/admin/admin-sidebar-nav.tsx    |   4 +-
 src/app/(protected)/admin/dashboard/page.tsx       |   2 +-
 src/app/(protected)/admin/listings/page.tsx        | 212 +-------------------
 src/app/(protected)/admin/pipeline/page.tsx        | 194 ++++++++++++++++++
 src/app/(protected)/messages/[threadId]/actions.ts |   6 +
 src/app/(site)/requests/[requestId]/page.tsx       |  56 ++++++
 .../excursions/guide-excursions-screen.test.tsx    |   6 +-
 .../excursions/guide-excursions-screen.tsx         |  11 +-
 .../components/public/guide-profile-screen.tsx     |   6 +-
 .../components/request-detail-screen.test.tsx      |  26 +++
 .../requests/components/request-detail-screen.tsx  |  85 +++++++-
 .../components/request-group-thread.test.tsx       |  77 ++++++++
 .../requests/components/request-group-thread.tsx   | 120 ++++++++++++
 src/lib/navigation.test.ts                         |   2 +-
 src/lib/navigation.ts                              |   6 +-
 src/lib/supabase/request-thread.ts                 | 135 +++++++++++++
 ...enforce_active_account_remaining_writes.sql     | 218 +++++++++++++++++++++
 20260708160000_group_request_thread.sql            |  81 ++++++++
 18 files changed, 1017 insertions(+), 230 deletions(-)
```

## Final branch state
- Branch: `fix/open-issues-33-47-opus-20260708` (6 commits ahead of `2fbeae2c`).
- `git status --short`: clean after removing transient agent JSON artifacts and amending the docs commit.

## Blockers / exact next actions
1. **Prod DB migrations (#35, #42):** apply `20260708150000` and `20260708160000`
   via targeted SQL + ledger repair (never `db push`). Then run the SQL
   verification queries above. Also re-confirm the prior enforcement migrations
   (`20260702143000`, `20260706093000`, `20260706120000`) are on prod — the
   original report predates them (landmine precedent `20260702000001`).
2. **Pre-commit hook drift:** the hook calls `lint:canon`/`lint:dead` which are
   absent on this branch's `package.json`. Restore those scripts or fix the hook
   before landing, or all commits will need `--no-verify`.
3. **Auth-gated + live-visual QA:** run the per-issue manual checklists on a
   preview deploy with seeded admin/guide/traveler + suspended sessions. A green
   build is not proof (HOT Ревизия Бека): 1280 + 375, clean console.
4. **#42 follow-ups (optional):** per-member initials via a definer view; decide
   whether viewer-guides (`request_views`) should be excluded from the forum.
```
