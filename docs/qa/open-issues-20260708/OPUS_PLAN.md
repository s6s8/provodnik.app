# OPUS_PLAN — Open issues 33 / 35 / 41–47

Date: 2026-07-08 · Author: Opus (planning only, no product code touched)
Base: `origin/main` @ `2fbeae2c` (visual self-heal) / branch `plan/open-issues-33-47-20260708`
Mode: **read-only analysis + plan**. No code edited, no DB mutated, no push.

Trio usage in this planning run: **Superpowers** = brainstorming + systematic root-cause discipline before any fix; **Ponytail** = every recommendation is the smallest diff that holds (reuse existing enum/RLS/components, no new abstractions); **Context7** = not required for this run — no third-party library API surface is in question; all changes are our own Tailwind/Next/Supabase code. Flag if the executor introduces a library needing version-pinned docs.

---

## 1. Executive verdict

| # | Issue | True nature | Effort | Risk |
|---|---|---|---|---|
| 33 | Guide profile centering | Pure CSS: 3 elements need `self-center` / `justify-center` | XS | none |
| 45 | Duplicate add-excursion buttons | Delete one button, relabel/keep the blue one | XS | none |
| 46 | Listing save button off-screen | One-line: make sheet body `flex-1 min-h-0 overflow-y-auto` | XS | low |
| 41 | Joined member sees no trip details | Render gap — data already in viewModel, view branch omits it | S | low |
| 35 | Suspended user can still act | **~70% already shipped** in DB (post-report); close remaining RLS gaps + add UX + verify prod | M | med (security + prod-migration landmine) |
| 42 | Group forum / shared discussion | Schema 80% exists (`request` thread); need 1 RLS clause + write path + UI + **product decision** | M–L | med (privacy/RLS) |
| 43 | Admin "Листинги" purpose | It's a listing-moderation queue; near-duplicate of Модерация → rename/merge | S | low (product decision) |
| 47 | Admin "Модерация" purpose | Overlaps Листинги; unique part = review-replies queue → merge decision | S | low (product decision) |
| 44 | Admin bookings status coverage | Filter is **already open**; missing statuses live in `guide_offers`/`traveler_requests`, not `bookings` → needs a new surface | M | med (scope) |

**Priority order (by importance):**
1. **35** — P0 security. Bulk landed, but open write-policy gaps + a prod-application risk make this the one that can bite. Verify + close.
2. **33 / 45 / 46** — P1 trivial UI, high user-visibility, zero DB. Ship first as a batch because they're the cheapest wins.
3. **41** — P1 correctness; joined travelers currently fly blind.
4. **43 / 47** — P1 admin clarity; cheap once a naming/merge decision is made.
5. **42** — P2 feature; needs a product decision before code.
6. **44** — P2 admin; largest genuinely-new surface.

**Recommended rollout (by risk, not importance)** — see §7. Ship trivial reversible UI first, security migration on its own boundary, feature/forum last.

---

## 2. Brainstorming — approaches per issue group (≥2 each, with pick)

### Group A — Trivial UI (33, 45, 46)

**33 — centering.** File `src/features/guide/components/public/guide-profile-screen.tsx`.
- *Approach A1 (pick):* Per-element `self-center`. Keep wrapper `items-start text-left` (line 106); add `self-center` to avatar (line 114) + verified badge (line 118) + optionally stats (line 125); add `justify-center` to the region/city row in the hero (line 89). Bio (167), specialty/language tags (171/181), buttons (194) stay left → readability preserved. **Smallest diff, surgically scoped.**
- *Approach A2:* Split identity into its own centered flex column and move bio/tags/buttons to a second left-aligned column. More markup, risk of regressing spacing/`NewGuideFrame`. Rejected — over-build for a 3-element ask.

**45 — duplicate buttons.** File `src/features/guide/components/excursions/guide-excursions-screen.tsx`.
- *Reality:* The **always-visible** button is the header "Создать экскурсию" (already blue, `variant="default"`, lines 253–257). "Добавить экскурсию" (line 300) is `variant="outline"` and renders **only** in the empty state. Literal "remove Создать, keep Добавить" would leave the populated list with no add button.
- *Approach B1 (pick):* Relabel the header button to **"Добавить экскурсию"** (keep it blue, keep it always-visible) and delete the redundant empty-state action button (or drop its `variant="outline"` and keep it — cosmetic). One blue "Добавить экскурсию" in both states. Honors the operator's intent (single blue "Добавить экскурсию") without breaking the populated state.
- *Approach B2:* Keep both labels but make empty-state blue and hide header button when empty. More conditional logic for no benefit. Rejected.
- **Owner decision needed:** confirm the surviving label is "Добавить экскурсию" (recommended, matches operator wording) placed in the header. See §6-D-1.

**46 — save button below fold.** Same file, the create/edit `SheetContent` (lines 348–581).
- *Root cause:* `SheetContent` is `flex flex-col h-full` but `overflow: visible`; the body `<div className="mt-5 space-y-4 px-4">` (line 356) is not a scroll region, so header+fields+footer exceed viewport and the footer (Сохранить, line 571) is clipped off-screen.
- *Approach C1 (pick):* One-line — make the body div `flex-1 min-h-0 overflow-y-auto`. Because the parent is already `flex-col h-full`, header pins top, body scrolls, footer pins bottom. Optionally add `border-t` to footer for separation. No new markup.
- *Approach C2:* Convert footer to shadcn `SheetFooter` with `mt-auto`. Still needs the body to be scrollable or the footer overflows; strictly more change than C1. Rejected.

### Group B — Joined-member request page (41, 42)

Shared root cause: **there is no "member" viewer role.** A traveler who joined someone else's open request resolves to `viewerRole="public"` (`src/lib/auth/viewer-role-for-request.ts`, enum = public|owner|guide|admin) and is rendered by the same `PublicDetailBranch` as an anonymous visitor. `getJoinState` computes `"member"` but only swaps the CTA label.

**41 — missing trip details.**
- *Approach D1 (pick):* Render a description/interests section in `PublicDetailBranch` (`src/features/requests/components/request-detail-screen.tsx`). The data is **already** in the viewModel: `viewModel.notes` (full description) and `viewModel.themes` (`request.interests`). Add an "О поездке" block (full `whitespace-pre-line` notes) + interest `Tag` chips — mirroring the owner's `RequestFactsCard` (lines 404–491). Gate on `joinState === "member"` if we want members-only, or show to all logged-in viewers. **No new data plumbing.**
- *Approach D2:* Introduce a real `"member"` viewer role end-to-end and a dedicated `MemberDetailBranch`. Cleaner long-term and needed if member/public content diverges a lot — but heavier. Defer unless 42's forum forces a member branch anyway (it does — see recommendation).
- **Synthesis:** Do D1 for 41 now; if 42 is greenlit in the same cycle, promote to a light `"member"` role so 41's section + 42's forum share one gate (avoids a second `joinState` fork). See §6.

**42 — group forum.** The `request`-subject thread is **80% scaffolded**: enum value exists, `conversation_threads` check-constraint allows it, `ct_request_unique_idx` enforces one-per-request, `can_access_request_thread()` + `can_create_conversation_thread()` already handle it. It is simply **unused by app code**, and its read grant excludes joined members.
- *Approach E1 — one shared request thread (pick):* Use `subject_type='request'`. Extend `can_access_request_thread` to add `open_request_members` (joined, not left). Add a write path (see below). Render one forum thread on owner + member pages. The offer-level private QA threads stay private. Matches the KODEX "one forum-like thread under the open group request" framing and avoids leaking per-guide price negotiation to the whole group.
- *Approach E2 — expose the private offer-QA threads to the group:* Literally what the operator wrote ("see the author's correspondence with guides"). But offer-QA is author↔one-guide, 8-message-capped, often price haggling. Broadcasting every offer thread to all members is a privacy regression and a bigger RLS change. Rejected as default.
- **Product decision required (§6-B-1):** Does "see the author's correspondence with guides" mean (a) a single shared group thread where coordination happens in the open [E1, recommended], or (b) read-only mirror of the private per-guide QA threads to members [E2]? Recommend E1; if the operator insists on E2, it's a separate, larger RLS/UX task — plan it as a follow-up, not a blocker for E1.

Write-path sub-decision for E1: **do not reuse `send_qa_message`** (hardcoded `subject_type='offer'`, 8-msg cap). Options: (i) relax `messages_insert` RLS for `request` threads to `can_access_conversation_thread(thread_id)` instead of `is_thread_participant`; or (ii) enroll owner+members+bidding-guides as `thread_participants` on join/bid and keep `is_thread_participant`. *Pick (i)* — fewer moving parts, no enrollment bookkeeping on every join/bid; membership is already derivable. Add a small `send_group_message` RPC that asserts `assert_active_account()` + `can_access_conversation_thread` (ties into 35).

### Group C — Admin clarity (43, 47, 44)

**43 + 47 — Листинги vs Модерация overlap.** Both filter `listings.status='pending_review'`; Модерация adds a second "Ответы на отзывы" (`review_replies` pending) tab. So Листинги ⊂ Модерация except naming.
- *Approach F1 (pick):* **Merge into one "Модерация" center** with tabs [Экскурсии на проверке | Ответы на отзывы], delete the standalone Листинги page + nav entry, redirect `/admin/listings → /admin/moderation`. One conceptual home for "things awaiting admin approval." Removes the duplicate.
- *Approach F2:* Keep both but rename Листинги → "Экскурсии на проверке" and strip the listings tab out of Модерация (Модерация becomes review-replies only). Two entries, clearer names, less code churn.
- **Owner decision (§6-B-2):** F1 (merge, recommended) vs F2 (rename + split). Either kills the ambiguity; F1 is fewer nav items and the cleaner mental model.

**44 — bookings status coverage.** The filter already defaults to all statuses (no `.eq` when `ALL`); `bookings` simply never holds pre-confirmation rows — a `bookings` row is created only at `accept_offer`. Waiting/pending excursions live in `traveler_requests` (`open`) and `guide_offers` (`pending`/`bid_sent`/`counter_offered`).
- *Approach G1 (pick):* Add an admin **"Заявки и предложения" (pipeline)** view (new page or tabs on Bookings) that surfaces `traveler_requests` + `guide_offers` with their statuses, so admins see the full funnel. Leave `bookings` page as the post-confirmation ledger. Reuses existing tables; RLS already admin-visible.
- *Approach G2:* Build a DB `v_admin_booking_pipeline` view unioning the three tables into a single normalized status timeline, render one table. Nicer UX, more DB work + a new view to maintain.
- **Owner decision (§6-B-3):** confirm scope — G1 (separate pipeline tab, recommended for MVP) vs G2 (unified funnel view). And confirm the target statuses admin actually needs.

### Group D — Suspended user (35)

**Root cause is two-layered and mostly already addressed at the DB layer.** `proxy.ts` only checks `account_status` when a route has a `requiredRole`; public routes (`/requests*`) skip it, so a suspended user can *reach* the create/join UI. The **security** boundary is RLS, and RLS already blocks the important inserts (`traveler_requests_insert`, `open_request_members_insert`, `guide_offers_insert/update`) and 5 write RPCs (`accept_offer`, `counter_offer`, `open_dispute`, `submit_review`, `send_qa_message`) via `assert_active_account()` — all landed 02–06.07, **after** the 05.07 report. So the report is largely stale, but three real gaps remain:

- *Gap 1 — untouched write policies.* `bookings_update`, `messages_insert` (booking/dispute threads via `conversations.ts:427 sendMessage` — a **direct** insert, not the guarded RPC), `dispute_events_insert`, `traveler_requests_update` (edit/cancel), `listings_update` + listing create (`listings.ts:createListing`), `review_replies_*`, `guide_profiles/documents/licenses_*`, `favorites_*`, `referral_*`, `partner_accounts_*`. A suspended user can still do these within their access-token TTL window.
- *Gap 2 — UX.* Even where RLS blocks, the user sees the buttons and hits a raw error, not a "your account is suspended" message.
- *Gap 3 — prod application.* Memory landmine: enforcement migrations may exist in the repo but **not be applied on the VPS/prod DB** (`20260702000001` precedent). Must verify before declaring 35 done.

- *Approach H1 (pick, security):* Extend the **existing RLS pattern** — add `AND public.profile_account_status_for(<owner_id>) = 'active' … OR public.is_admin()` to the remaining write policies, mirroring `guide_offers`/`traveler_requests` inserts. This is the root-cause fix at the security boundary and is Ponytail-consistent (reuse the shipped helper, no new concept).
- *Approach H2:* A `BEFORE INSERT/UPDATE` trigger calling `assert_active_account()` on each table. Fewer lines but **dangerous**: `assert_active_account` keys off `auth.uid()`, which is NULL for admin/service-role paths → would block admin ops and cron. Rejected in favor of the `OR is_admin()` policy pattern.
- *Approach H3 (UX, additive to H1):* App-layer `requireActiveUser()` shared server helper (extend `readAuthContextFromServer` which already exposes `accountStatus`) that action wrappers call to throw a friendly typed error; plus widen `proxy.ts` to redirect any authenticated non-active user (with a small allowlist: `/auth`, `/api/auth/signout`, support) so they see a clear suspended screen instead of silently failing. **Do H1 for security + H3 for UX; they're complementary, RLS stays the boundary.**

---

## 3. Live-site observations (no secrets used)

Playwright JSON: `live/results.json`; screenshots `live/*.png`.

- **33** (`live/guide-33-mobile.png`, status 200): confirmed — avatar, "Проверен" badge and region/city are left-aligned; bio and tags left. Matches code (`items-start`).
- **41/42** (`live/request-41-42-*.png`, status 200): the joined-member/public view shows only hero title "Илендиль!", date/time/price, member count, "Как это работает", FAQ. **No description body, no interests, no discussion thread.** Confirms both issues.
- **35** (`live/request-35-*.png`): the example request URL now returns **404 "Запрос не найдено"** — the row was deleted/expired since the report. Cannot reproduce 35 on this URL live; rely on code/RLS audit. (Note: 404 also weakly suggests suspended/expired-request handling changed.)
- **43/44/47** (`admin/*`) and **45/46** (`guide/listings`): all redirect to `/auth?next=…` (auth-gated). **Blocker:** these need an authenticated admin + guide QA session; not doable here without secrets. Code audit stands in; live verification is an executor/owner step (§5, §8).

---

## 4. Codebase findings — files + root cause + risks

Full agent transcripts summarized below; file:line anchors are load-bearing.

### 33 — `src/features/guide/components/public/guide-profile-screen.tsx`
- Hero block (86–102): region/city row line 89 (no h-align); name h1 line 92; headline 95.
- Identity card (104–211): wrapper line 106 `flex max-w-[720px] flex-col items-start text-left`; avatar 107–116 (class line 114); verified badge 117–122 (line 118); stats 124–158; bio 167; specialty tags 171; language tags 181; buttons 194.
- Root cause: wrapper `items-start`/`text-left` governs all children; centering must be per-element.
- Only consumer: `src/app/(site)/guides/[slug]/page.tsx`. Card variants of "Проверен" are separate components — no regression.

### 45/46 — `src/features/guide/components/excursions/guide-excursions-screen.tsx`
- Header button "Создать экскурсию" 253–257 (`variant` default = blue, always rendered). Empty-state "Добавить экскурсию" 300–304 (`variant="outline"`, empty state only). Both call `openCreateSheet` (124–129).
- Sheet 348–581: `SheetContent` line 349 (`flex flex-col h-full`, overflow visible); body div line 356 (not scrollable); footer 563–579, Сохранить 571–578 (raw `<button>`).
- `src/components/ui/sheet.tsx` 48–87: `SheetContent` sets no overflow. `src/components/ui/button.tsx`: blue = `variant="default"` (default).

### 41/42
- `src/app/(site)/requests/[requestId]/page.tsx`: `buildViewModel` 101–140 sets `notes=request.description`, `themes=request.interests`; branch logic 393/434/451/468; offer-QA fetched only owner branch 214–238.
- `src/lib/auth/viewer-role-for-request.ts`: role enum has no "member"; joined traveler → "public" (line 72).
- `src/features/requests/components/request-detail-screen.tsx`: `PublicDetailBranch` 263–374 renders hero+TripPanel+FAQ, never `viewModel.themes`, no full-notes section. Owner `RequestFactsCard` 404–491 renders both (proof the pattern exists).
- `src/lib/supabase/queries-core.ts` 94–126/478–485/528–534: `description`←`notes`, `interests[]`; owner synthesized into members.
- Messaging schema (`supabase/migrations/20260702000000_current_schema_baseline.sql`): `thread_subject` enum incl. `request` (276); `conversation_threads` check allows request threads (2081); `can_access_request_thread` (~530) grants owner+admin+guides-with-offer+guides-in-`request_views`, **not** members; `messages_insert` needs `is_thread_participant` (4853); `send_qa_message` offer-only + 8-cap (1771/1788).
- `src/lib/supabase/request-members.ts`: `joinRequest`/`getRequestMembers`/`isRequestMember`. `open_request_members` PK `(request_id,traveler_id)`, `status`, `left_at`; owner is NOT a row (synthesized).
- Risk: `can_access_request_thread` already grants any guide who merely *viewed* (`request_views`) — broad. Confirm intended forum audience before wiring writes.

### 35
- `src/proxy.ts`: status check 83–95 gated behind `requiredRole` (early return line 72). Enum `account_status = active|suspended|archived` (baseline :74).
- Already gated (safe): create request, join group, submit/accept/counter offer, dispute, review, QA message (RPCs + inserts, listed §2-D).
- **Not gated (fix targets):** `bookings_update`, `messages_insert` (`app/(protected)/messages/[threadId]/actions.ts:75`, `conversations.ts:427`), `dispute_events_insert`, `traveler_requests_update` (`sent-request-actions.ts`, `owner-request-actions.ts`), `listings` create/update (`listings.ts:91/129/168`, `listingManagementActions.ts`), `review_replies_*` (`submitReply.ts`), `guide_profiles/documents/licenses_*` (`profile-actions.ts`, `completeOnboarding.ts`, `verification-actions.ts`, `setAvailability.ts`), `favorites_*`, `referral_*`, `partner_accounts_*`, `profiles_update` (personal settings).
- No app-layer choke point; closest is `readAuthContextFromServer` (`src/lib/auth/server-auth.ts:183`, exposes `accountStatus`). DB choke point is `assert_active_account()` (`20260706120000`).
- Session note: admin suspend bans in GoTrue but access token stays valid to JWT TTL — the exact exploit window; DB gating (not session revoke alone) is required.
- **Risk:** the shipped enforcement migrations may not be applied on prod (landmine). Verify.

### 43/47/44
- `src/app/(protected)/admin/listings/page.tsx` → `getPendingListingReviews` (`moderation.ts:1008`), `listings.status='pending_review'`. Title "Экскурсии на проверке".
- `src/app/(protected)/admin/moderation/page.tsx`: tabs "Объявления" (same `listings.status='pending_review'`) + "Ответы на отзывы" (`review_replies` pending). Overlap confirmed.
- `src/app/(protected)/admin/bookings/page.tsx`: queries `bookings` only; filter defaults to ALL (no `.eq`) → already shows every booking status; options from `bookings/status-labels.ts` (7 enum values). Pre-booking lifecycle in `traveler_requests`/`guide_offers`.
- Nav: `src/lib/navigation.ts` `adminPrimaryNav` (89–92), rendered by `admin-sidebar-nav.tsx`. Entries: Обзор, Пользователи, Гиды, Листинги, Модерация, Споры, Бронирования, Аудит.

---

## 5. Per-issue plan (files · tests · verification · owner decisions)

Legend: **[FE]** frontend, **[DB]** migration/RLS, **[TEST]** test, **[QA]** browser verification, **[DEC]** owner decision.

### 33 — Center avatar / verified / region-city
- **[FE]** `guide-profile-screen.tsx`: `self-center` on avatar (114) + badge (118) (+ stats 125 if desired); `justify-center` on hero region row (89). Wrapper unchanged.
- **[TEST]** none new (pure CSS); rely on QA. Optionally snapshot if a story exists.
- **[QA]** `/guides/жюль-верников-69f18040` at 1280 + 375: avatar/badge/region centered, bio+tags+buttons still left, console clean. Compare to `live/guide-33-mobile.png`.
- **[DEC]** Confirm stats row (rating/reviews) should also center vs stay left (recommend: center with the identity cluster). §6-D-2.

### 45 — Single blue add button
- **[FE]** `guide-excursions-screen.tsx`: relabel header button (253–257) to "Добавить экскурсию" (keep blue/default); remove empty-state action button (300–304) or drop its `variant="outline"`.
- **[TEST]** none new; QA covers both states.
- **[QA]** `/guide/listings` as guide (needs auth) at 1280 + 375: with 0 templates AND ≥1 template → exactly one blue "Добавить экскурсию" visible, opens the sheet.
- **[DEC]** Confirm surviving label + placement. §6-D-1.

### 46 — Sticky save footer in listing sheet
- **[FE]** `guide-excursions-screen.tsx` body div (356): add `flex-1 min-h-0 overflow-y-auto`; optional `border-t` on footer (563).
- **[TEST]** none automatable cheaply; QA is the gate.
- **[QA]** `/guide/listings` as guide, open create + edit sheet at 375 AND a short viewport (e.g. 812h): Сохранить always visible, body scrolls, fill→save→reload persists (Ревизия Бека form rule).
- **[DEC]** none.

### 41 — Member sees trip description + interests
- **[FE]** `request-detail-screen.tsx` `PublicDetailBranch`: add "О поездке" block rendering full `viewModel.notes` (`whitespace-pre-line`) + interest `Tag` chips from `viewModel.themes`, mirroring `RequestFactsCard`. Gate: show to `joinState==="member"` (and owner already sees it); decide whether anonymous visitors also get the full notes (currently they get truncated hero only). §6-B-4.
- **[TEST]** `request-detail-screen` unit/RTL: member view renders notes + interests; public-anon view respects the chosen visibility.
- **[QA]** `/requests/e008d8b7-…` as a joined member (needs auth) at 1280 + 375: description + interests present; compare `live/request-41-42-mobile.png` (currently absent).
- **[DEC]** Anonymous visitor visibility of full notes/interests (privacy). §6-B-4.

### 35 — Suspended user cannot act
- **[DB]** New migration `2026070X_enforce_active_account_remaining_writes.sql`: extend WITH CHECK/USING with `AND profile_account_status_for(<owner>) = 'active' … OR is_admin()` on: `bookings_update`, `messages_insert`, `dispute_events_insert`, `traveler_requests_update`, `listings_insert`/`listings_update`, `review_replies_insert`/`review_replies_update`, `guide_profiles_*`, `guide_documents_*`, `guide_licenses_*`, `favorites_*`, `referral_*`, `partner_accounts_*`. For `messages_insert` the owner = `sender_id`. Apply via targeted SQL + ledger repair (NEVER `db push` on prod — landmine).
- **[FE]** `requireActiveUser()` helper extending `readAuthContextFromServer`; call at the top of the ungated server actions to throw a typed `AccountSuspendedError` surfaced as a friendly toast/redirect. Widen `proxy.ts` to redirect any authenticated non-active user to a suspended screen (allowlist `/auth`, `/api/auth/signout`, `/help`). §6-D-3 for lock-out scope.
- **[TEST]** `pgTAP`/SQL or integration: a suspended user is rejected on each newly-gated table (INSERT/UPDATE) while an active user + admin succeed; `role-routing`/proxy test for the widened redirect.
- **[QA]** With a suspended test account (needs seeded fixture): attempt edit request, cancel booking, send booking/dispute message, create/edit listing, edit profile, favorite → all blocked with a clear message; active account unaffected.
- **[VERIFY-PROD]** Confirm `20260702143000`, `20260706093000`, `20260706120000` **and** the new migration are actually applied on VPS/prod DB (query `pg_policies` / RPC bodies). This is a required gate — the report predates the shipped fixes and prod may lag.
- **[DEC]** Proxy lock-out breadth (block all routes vs mutation routes only). §6-D-3.

### 42 — Group forum thread
- **[DB]** Migration: (1) extend `can_access_request_thread` to add `EXISTS(select 1 from open_request_members m where m.request_id=tr.id and m.traveler_id=uid and m.status='joined' and m.left_at is null)`. (2) Relax `messages_insert` for `request` threads to `can_access_conversation_thread(thread_id)` (keep participant rule for other subjects) OR add `send_group_message(p_thread_id, p_body)` RPC asserting `assert_active_account()` + `can_access_conversation_thread`. (3) Re-confirm the `request_views` (viewer-guide) grant is the intended audience or tighten to guides-with-offer only.
- **[FE]** `conversations.ts`/`request-members.ts`: helper to get-or-create the request thread + list/post messages. `request-detail-screen.tsx`: render one forum thread for owner + member (+ bidding guides) with a composer; wire member view (promote to `"member"` role if 41 also lands — shared gate).
- **[TEST]** RLS tests: owner+member+bidding-guide can read+write the request thread; non-member (random traveler, anon) cannot; suspended member cannot write. Component test for the forum render + post.
- **[QA]** As owner and as a joined member (needs 2 auth sessions): post a message, both see it; a non-member gets nothing; console clean at 1280+375.
- **[DEC]** E1 shared-thread vs E2 mirror-private-QA (§6-B-1); forum audience (members-only vs incl. bidding guides).

### 43 + 47 — Merge admin listings/moderation
- **[FE]** If F1: fold listings queue into `admin/moderation` tabs, delete `admin/listings/page.tsx`, add redirect `/admin/listings→/admin/moderation`, drop the Листинги nav entry in `navigation.ts` + `admin-sidebar-nav.tsx` (rewire the count badge). If F2: rename Листинги→"Экскурсии на проверке", remove the listings tab from Модерация.
- **[TEST]** nav/route test for redirect + updated labels.
- **[QA]** As admin: both flows reachable, approve/reject still work, no dead nav.
- **[DEC]** F1 merge vs F2 rename-split. §6-B-2.

### 44 — Admin sees full booking pipeline
- **[FE]** New admin view/tab "Заявки и предложения": query `traveler_requests` (+status) and `guide_offers` (+status), render with status chips + links. Leave `bookings` page as the confirmed ledger. (G2 alt: add `v_admin_booking_pipeline` view.)
- **[DB]** none for G1; a read view for G2.
- **[TEST]** query/coverage test that pending/open rows surface.
- **[QA]** As admin: create an open request + a pending offer in fixtures → both appear in the new surface; confirmed bookings still in Bookings.
- **[DEC]** G1 tab vs G2 unified view; exact statuses admin needs. §6-B-3.

---

## 6. Product / owner decisions (blockers vs defaults)

### Blocking — need an answer before that issue's code
- **B-1 (42):** Forum model — **E1 single shared request thread** (recommended) vs **E2 mirror the private per-guide offer-QA to all members**. E2 has privacy cost + larger RLS.
- **B-2 (43/47):** **F1 merge** into one Модерация center (recommended) vs **F2 rename Листинги + split**.
- **B-3 (44):** **G1 separate pipeline tab** (recommended) vs **G2 unified funnel view**; which statuses matter.
- **B-4 (41):** Should **anonymous** visitors see the full description + interests, or members-only? (Currently anon gets truncated hero. Recommend: show full to logged-in members; keep anon teaser to nudge login — matches existing "Войти и присоединиться" gate.)

### Non-blocking — sensible default, proceed unless overridden
- **D-1 (45):** Surviving button = **"Добавить экскурсию", blue, in header**, always visible.
- **D-2 (33):** Stats row centers with the identity cluster.
- **D-3 (35):** Proxy blocks suspended users on **mutation/dashboard routes**, shows a suspended screen with logout+support allowlisted (not a full lockout from public read).

---

## 7. Implementation phases & safe commit boundaries

Each phase = one branch off `main`, its own PR, verify chain (`bun run typecheck && lint && test:run && playwright && build`) + Ревизия Бека (1280 + 375) before merge. Never push to main.

- **Phase 1 — Trivial UI batch (33, 45, 46).** No DB. One PR, one commit per issue. Cheapest, reversible, unblocks visible complaints. Ship first.
- **Phase 2 — Member trip details (41).** Small FE + one test. Standalone PR. If 42 is greenlit, land the `"member"` role here so 42 reuses it.
- **Phase 3 — Suspended-user hardening (35).** (a) Verify shipped migrations are on prod. (b) DB migration for remaining write policies (targeted SQL + ledger repair). (c) App `requireActiveUser` + proxy widen. Security PR on its own boundary; commit DB and app separately so a rollback is clean. Gate on the suspended-account QA.
- **Phase 4 — Admin clarity (43/47, then 44).** 43/47 merge/rename first (cheap, after B-2). Then 44 pipeline surface (after B-3). Separate PRs.
- **Phase 5 — Group forum (42).** After B-1. DB migration (RLS + write path) as one commit, app/UI as the next. Largest surface; most QA. Ship last.

Rationale: risk-ascending. Pure CSS → render gap → security (careful, isolated) → admin (product-gated) → new feature with RLS (most QA). 35 is P0 by importance but its core already shipped; the remaining hardening is safest on a dedicated boundary rather than rushed ahead of the trivial wins.

---

## 8. Risks & landmines

- **Prod-migration drift (35):** shipped enforcement may not be on VPS (`20260702000001` precedent). Verify `pg_policies`/RPC bodies before claiming 35 done. NEVER `supabase db push` on prod — apply targeted SQL + repair ledger.
- **RLS over-grant (42):** `can_access_request_thread` already grants viewer-guides via `request_views`. Wiring writes without reviewing this could let any guide who opened the request post in the group forum. Decide audience first.
- **Suspended lock-out UX (35):** widening proxy too far can trap a suspended user with no way to read why/contact support — keep the allowlist.
- **Auth-gated QA (43–47, 45, 46, 41, 35, 42):** most verification needs seeded admin/guide/traveler + suspended sessions. Live Playwright here only reached public pages. Executor must run authenticated QA — a green build is not proof (HOT Ревизия Бека).
- **Client/server import boundary (AP-014):** if 42 splits thread constants for client use, follow the `qa-threads-types.ts` (client-safe) + server-module pattern; never import a server value into a `'use client'` file.
- **Money/TZ landmines:** none of these issues touch price-write or calendar-date paths, but 44's pipeline view displays `subtotal_minor` → use `kopecksToRub` for display; any date display uses `todayMoscowISODate`/MSK formatting.
- **`send_qa_message` reuse trap (42):** it is offer-only + 8-message-capped. Do not reuse it for the group forum; use a request-thread write path.

---

## 9. Executor handoff prompt — **DO NOT RUN until owner approval**

> **⛔ DO NOT DISPATCH until Alex approves the plan and answers B-1…B-4.**
>
> Role: QuantumHands product-code executor. Branch from fresh `origin/main`. One PR per phase (§7). Trio required: Superpowers (systematic-debugging per bug, verification-before-completion), Ponytail (smallest diff — reuse existing enum/RLS/components; the fixes below are deliberately one-to-few lines), Context7 only if a library API is touched (none expected). Report how each was used.
>
> **Phase 1 (33, 45, 46) — pure UI, no DB:**
> - 33: `src/features/guide/components/public/guide-profile-screen.tsx` — add `self-center` to avatar (line 114) + verified badge (line 118) + stats row (line 125); add `justify-center` to hero region/city row (line 89). Leave wrapper `items-start text-left` (106) untouched so bio/tags/buttons stay left.
> - 45: `src/features/guide/components/excursions/guide-excursions-screen.tsx` — relabel header button (253–257) to "Добавить экскурсию" (keep default/blue variant); delete the empty-state action button (300–304).
> - 46: same file — body div (356): add `flex-1 min-h-0 overflow-y-auto`; add `border-t border-border` to footer div (563).
> - Verify: typecheck+lint+build; browser 1280+375 on `/guides/жюль-верников-69f18040` and (as guide) `/guide/listings`, create+edit sheet, fill→save→reload. Console clean.
>
> **Phase 2 (41):** add "О поездке" (full `viewModel.notes`, `whitespace-pre-line`) + interest `Tag` chips (`viewModel.themes`) to `PublicDetailBranch` in `src/features/requests/components/request-detail-screen.tsx`, mirroring owner `RequestFactsCard`. Gate per B-4. Add RTL test. QA as joined member.
>
> **Phase 3 (35):** FIRST verify shipped migrations (`20260702143000`, `20260706093000`, `20260706120000`) are applied on prod. Then new migration extending the `account_status='active' OR is_admin()` guard to the write policies in §5-35-[DB]; app-layer `requireActiveUser()` + proxy widen per D-3. Apply via targeted SQL + ledger repair — NOT `db push`. RLS/pgTAP tests + suspended-account QA.
>
> **Phase 4 (43/47, 44):** per B-2/B-3. Merge or rename admin moderation/listings; add admin pipeline surface for `traveler_requests`+`guide_offers`. Use `kopecksToRub` for any money display.
>
> **Phase 5 (42):** per B-1 (default E1). Migration: extend `can_access_request_thread` with `open_request_members`; add request-thread write path (`send_group_message` RPC with `assert_active_account`, or relax `messages_insert` for request subject). App: get-or-create request thread + forum UI for owner+member(+bidding guides). Follow AP-014 if splitting client/server thread constants. Full RLS tests + 2-session QA.
>
> Definition of done per phase: full verify chain green AND Ревизия Бека (1280+375, role-correct, form persistence, clean console) AND (Phase 3/5) authenticated + suspended-session QA. A green build is not done.

---

*Planning complete. No product code, DB, or push touched. Deliverables: this file + `PLAN_STATUS.json`.*
