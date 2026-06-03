# Spec — Provodnik audit remediation (2026-06-02 read-only audit → fixes)

- **Status:** ready for planning/dispatch
- **Author:** orchestrator (from the 2026-06-02 read-only multi-agent audit)
- **Source of truth:** the audit findings (154 total — 7 CRITICAL, 39 HIGH, 65 MEDIUM, 43 LOW) across 9 subsystems + commit forensics. Every task below cites the exact `file:line` it closes; the **Traceability appendix** maps all 154 findings to a task so nothing is dropped.

---

## 1. Context

Provodnik is a mobile-first tour marketplace (travelers ↔ verified local guides in Russia): **Next.js 16 App Router + Supabase (RLS-based authz) + Vercel**. A read-only static audit on 2026-06-02 mapped 544 TS/TSX files + 62 SQL migrations and surfaced 154 findings. The audit changed no code. **This spec is the fix phase**: it turns every finding into a test-first, scoped, acceptance-gated task, ordered by exploit/impact risk (P0 → P3).

The audit's headline risk is a cluster that lets an ordinary user become admin or act as another user, plus a marketplace read path that bypasses RLS. Those are P0 and ship first, behind tests.

## 2. Conventions (apply to EVERY task)

- **TDD, always.** Write the failing test first (RED), implement minimally (GREEN), refactor. A finding is "closed" only when a test demonstrates the old bug/exploit is gone *and* the legitimate path still works.
- **Supabase client discipline.** Public/catalog reads → anon/browser client where RLS permits. Authenticated reads → cookie-bound **server** client. Service-role **admin** client ONLY for documented cross-user side effects (notifications, counterparty email), never to paper over an RLS gap. A function that ignores its passed-in client is a bug.
- **Authorization source.** Derive identity from `auth.getUser()` (never `getSession()` for authz). **Never trust `user_metadata` for authorization** — only `profiles.role` or service-controlled `app_metadata`/custom claims.
- **RLS changes ship with a regression test.** A pgTAP test (or a Vitest integration test against a seeded role) proving the policy *denies* the unauthorized case and *allows* the authorized one. Migrations must be idempotent (`DROP ... IF EXISTS` before `CREATE`, or guarded `DO` blocks).
- **Scope discipline.** Each task touches only the files it lists. Scope creep blocks merge.
- **No fabricated "done".** Don't mark a task complete unless its test passes and the gate (§7) is green.

## 3. Out of scope

- New features, redesigns, the reverted homepage-v3 work, dependency bumps, and copy-only changes already shipped.
- Findings flagged LOW that are intentional public reference data (`destinations_public_read`, `quality_snapshots_public_read`, `help_articles_select` `USING(true)`): **keep**, just add a one-line comment documenting intent (covered by P3-4).
- Re-architecture of the messaging or notifications systems — tasks here are surgical fixes, not rewrites.

## 4. Priority model

| Tier | Meaning | Ship rule |
|------|---------|-----------|
| **P0** | Exploitable security: privilege escalation, RPC identity, RLS bypass, IDOR; plus the one CRITICAL functional regression. | First, each behind a test. |
| **P1** | Authorization hardening + data integrity (silent write failures, transactional gaps, read-state drift). | After P0. |
| **P2** | Correctness, PII boundaries, perf, migration idempotency. | After P1. |
| **P3** | Dead code, a11y, robustness/hygiene. | Batch last. |

Effort key: **S** ≈ <1h, **M** ≈ half-day, **L** ≈ 1–2 days (RPC/transaction or cross-file).

---

## 5. Tasks

> Each task: **Closes** (finding refs) · **Change** · **RED** (failing test first) · **GREEN** (impl note) · **Acceptance** · effort.

### P0 — Exploitable security

#### P0-1 — Lock role escalation (DB + app, both layers) · **M**
**Closes:** `supabase/migrations/20260401000001_schema.sql:749` (profiles_update has no `WITH CHECK` on `role`), `:538` (`handle_new_user` casts client `raw_user_meta_data.role` with no allowlist), `src/lib/auth/admin-access.ts:18` (`hasAdminRole` trusts `user_metadata`), `:28` (`readJwtRole` prefers `user_metadata` over `app_metadata`), `src/lib/auth/server-auth.ts:83` (profile-read error falls back to untrusted role).
**Change:** (a) New migration: `ALTER POLICY profiles_update ... WITH CHECK` pinning `role` to the row's existing value (or enforce via a `BEFORE UPDATE` trigger that rejects role changes from non-service callers). (b) `handle_new_user` allowlists `'traveler'|'guide'` only; admin is granted only via controlled migration/service role. (c) `admin-access.ts`: drop `user_metadata` from both helpers; read role from `profiles.role`/`app_metadata` only. (d) `server-auth.ts`: on profile-read error for a role-sensitive path, **fail closed** (no role) with telemetry.
**RED:** SQL/integration test: a `traveler` session `UPDATE profiles SET role='admin'` is rejected; signup with `raw_user_meta_data.role='admin'` lands as `traveler`. Unit test: `hasAdminRole`/`readJwtRole` return non-admin when only `user_metadata.role==='admin'`.
**Acceptance:** no code path lets a non-service caller set/elevate `role`; `admin-access.test.ts` updated and green.

#### P0-2 — SECURITY DEFINER RPC identity checks · **M**
**Closes:** `supabase/migrations/20260421000002_accept_offer_rpc.sql:14` (`accept_offer` trusts caller `p_traveler_id`), `20260421000003_send_qa_message_rpc.sql:11` (`send_qa_message` no sender/thread check).
**Change:** New migration replacing both functions: `accept_offer` requires `auth.uid() = p_traveler_id` (preferably drop the param and use `auth.uid()` internally + verify offer→request ownership); `send_qa_message` enforces `p_sender_id = auth.uid()` AND `can_access_offer_thread(thread)` before insert.
**RED:** pgTAP: calling `accept_offer` with someone else's `p_traveler_id` raises; `send_qa_message` with a spoofed `p_sender_id` or a non-participant thread raises; legitimate calls still succeed.
**Acceptance:** neither RPC can act on behalf of another user.

#### P0-3 — Fix OR-combined `disputes_insert` policy · **S**
**Closes:** `supabase/migrations/20260413000001_tripster_v1.sql:593` (duplicate `disputes_insert` with `WITH CHECK (auth.uid() IS NOT NULL OR is_admin())` OR-combines with the schema policy, bypassing opener/booking-party checks).
**Change:** Migration: `DROP POLICY IF EXISTS` the duplicate; keep a single insert policy requiring `opened_by = auth.uid()` AND booking membership (or admin).
**RED:** pgTAP: a user who is not a booking party cannot insert a dispute; a booking party can.
**Acceptance:** exactly one `disputes_insert` policy; non-party insert denied.

#### P0-4 — Eliminate the `getPublicClient()` RLS bypass · **L**
**Closes:** `src/data/supabase/queries.ts:162` (CRITICAL — service-role client bypasses RLS; many exports ignore the passed-in `client`), `:498` (public query fns take `_client` but always use `getPublicClient()`).
**Change:** Route public/catalog reads through the anon server client where RLS already allows them. Where service-role is genuinely required, rename to an explicit `adminRead*` helper with a one-line justification comment, and make it the obvious exception. Remove the misleading ignored `client`/`_client` parameters (use the passed client, or drop the param).
**RED:** Integration test: each refactored query returns the same catalog rows under anon RLS; a query that must stay admin is explicitly asserted to require it. Add a guard test that no public query silently constructs a service-role client.
**Acceptance:** `getPublicClient()` removed or reduced to named, justified admin reads; no exported query ignores its client.

#### P0-5 — Restore joined-group cabinet rendering · **S**
**Closes:** `src/features/traveler/components/requests/traveler-requests-screen.tsx:17` (CRITICAL — `joinedGroups` prop is passed but never read/mapped, so joined assembly trips never appear).
**Change:** Map `JoinedGroupSummary[]` → `TripCardModel` (`isOwnRequest:false`, organizer name) and merge into the correct phase before `groupTripsByPhase`.
**RED:** Component test: given `joinedGroups`, the cabinet renders a card for the joined trip in the expected section.
**Acceptance:** joined groups visible in the traveler cabinet.

### P1 — Authorization hardening + data integrity

#### P1-1 — Close messaging IDOR + scope notification reads · **M**
**Closes:** `src/app/api/messages/threads/[threadId]/route.ts:77` (any authed user reads any thread), `src/app/(protected)/messages/[threadId]/actions.ts:76` (sendMessage with no membership check), `src/features/notifications/components/notification-center-screen.tsx:45` (selects all `notifications` without `user_id` filter), `src/data/notifications/supabase.ts:72` (`markNotificationRead` by id only), `src/app/(protected)/notifications/page.tsx:8` (no server auth — proxy treats `/notifications` as public).
**Change:** Assert `user.id ∈ thread_participants` before `getThreadMessages`/`sendMessage` (mirror `messages/[threadId]/page.tsx`). Add `.eq('user_id', user.id)` to the notification select and mark-read update. Gate `/notifications` with `readAuthContextFromServer` + `redirect` (mirror `messages/page.tsx`).
**RED:** API test: requesting a thread the user isn't in → 403/empty; sending to it → rejected. Notification queries scoped to the caller.
**Acceptance:** no cross-user thread read/write; notifications are per-user.

#### P1-2 — Scope thread-access RLS + restore canonical helper · **M**
**Closes:** `supabase/migrations/20260401000001_schema.sql:647` (`can_access_request_thread` returns true for any guide on any request), `20260401100000_messaging_rls_realtime.sql:33` (base SELECT replaced canonical helper, then patched with stacked policies).
**Change:** Migration: scope `can_access_request_thread` to guides with an offer on / eligibility for that request; restore the canonical `can_access_conversation_thread` in the base SELECT policy and remove the compensating stacked policies.
**RED:** pgTAP: an unrelated guide cannot read a request thread; a guide with an offer can; booking/offer QA threads still readable by their parties.
**Acceptance:** thread visibility matches relationship, not role.

#### P1-3 — Tighten over-broad RLS writes · **M**
**Closes:** `schema.sql:1001` (`marketplace_events` insert open to any authed), `20260414000000_offer_counter_traveler_rls.sql:4` (traveler unrestricted UPDATE on offers), `20260415000001_bonus_ledger_referral_rls.sql:17` (referral insert loose EXISTS), `20260413000001_tripster_v1.sql:492` (`review_ratings_breakdown` insert no ownership), `src/data/marketplace-events/client.ts:25` (client-side event insert), `20260415000000_guide_licenses.sql:18` (`guide_licenses` has no UPDATE policy → owners can't revise license metadata via RLS).
**Change:** Migrations: restrict `marketplace_events` insert to admin/service or a scoped SEC DEF RPC; narrow the traveler offer-UPDATE to allowed columns/status transitions (or route via RPC); tie referral insert to `referral_codes.user_id = auth.uid()`; require a linked published review owned by the traveler for breakdown insert; add an owner UPDATE policy on `guide_licenses` (or document the intentional admin-only path). Move client event logging to a server action.
**RED:** pgTAP per policy: unauthorized write denied, authorized allowed.
**Acceptance:** none of these tables accept spoofed/over-broad writes.

#### P1-4 — Guide action ownership + identity freshness · **M**
**Closes:** `src/features/guide/actions/send-qa-reply.ts:8` (loads any offer's thread, no ownership), `:23` (threadId not verified against offer), `src/features/guide/components/portfolio/guide-portfolio-screen.tsx:47` (uses prop `guideId` without comparing to session), `src/app/(protected)/guide/listings/actions.ts:49` (`getSession()` for identity), `src/app/(protected)/guide/inbox/[requestId]/offer/actions.ts:67` (same), `src/features/guide/components/requests/guide-requests-inbox-screen.tsx:95` (`getSession()`).
**Change:** In QA actions, require authed guide and assert `guide_offers.guide_id = user.id` and `thread.offer_id = offerId`. In portfolio, derive `guideId` from `auth.getUser()` (or assert equality) before mutations. Replace `getSession()` with `getUser()` for identity.
**RED:** Action tests: a guide cannot load/reply to another guide's offer thread or mutate another guide's portfolio; identity comes from `getUser()`.
**Acceptance:** guide-scoped actions verify ownership server-side.

#### P1-5 — Admin pages/data via admin client behind `requireAdminSession` · **M**
**Closes:** `src/app/(protected)/admin/moderation/page.tsx:14`, `admin/audit/page.tsx:62`, `admin/bookings/page.tsx:21`, `admin/disputes/[caseId]/page.tsx:19` (all read/write via the user client), `src/lib/supabase/disputes.ts:388` (`getDisputes` no `requireAdminSession`), `src/lib/supabase/reviews.ts:198` (`getReviewForBooking` admin client, no caller check), `src/lib/bookings/state-machine.ts:29` (`transitionBooking` accepts `_userId` but never enforces it; update predicates only on id/status — authorization sits outside the API).
**Change:** Gate each with `requireAdminSession()` and read/write through the admin client (or fix `getReviewForBooking` to use the server client + RLS after verifying `booking.traveler_id === auth.uid()`). Make `transitionBooking` enforce caller role/ownership and the allowed actor for each transition before the update (or include authorization predicates in the update).
**RED:** Tests: non-admin cannot reach admin queues/data; `getReviewForBooking` denies non-owner under server client; `transitionBooking` rejects an actor not permitted for that transition.
**Acceptance:** admin/data and booking-transition paths enforce authorization in-function, not just by layout.

#### P1-6 — Stop silent write no-ops · **M**
**Closes:** `src/features/guide/actions/completeOnboarding.ts:31` & `:68` (update returns success even when 0 rows), `:34` (regions stored only in `notification_prefs._onboarding`), `src/features/reviews/actions/submitReply.ts:42` & `:87` (ignore update/insert results), `src/features/profile/actions/updatePersonalSettings.ts:22` (traveler locale/currency dropped), `src/features/guide/components/listings-management/listingManagementActions.ts:15` (`count` compared without `{count:'exact'}`).
**Change:** Verify affected rows (upsert or `count===1`) and throw on zero; persist guide `regions` to the canonical `guide_profiles` column; persist traveler locale/currency to the authoritative table (or role-gate the fields); request exact counts on bulk updates.
**RED:** Action tests assert an error when no row is written, and that submitted fields are actually persisted/read back.
**Acceptance:** no write path reports success without a confirmed row.

#### P1-7 — Make multi-write flows transactional · **L**
**Closes:** `src/features/messaging/actions/offerActions.ts:120` (counterOffer = two writes + best-effort rollback), `:36` (accept/decline don't check affected rows), `src/features/disputes/actions/openDispute.ts:34` (booking status mutated before dispute/event insert), `src/features/reviews/actions/submitReview.ts:60` (review inserted before axis validation).
**Change:** Move each into a single DB transaction/RPC: counterOffer (ownership + status check + original update + replacement insert atomically); openDispute (status transition + dispute + event in one tx, notify after commit); submitReview (validate all axes, then insert review + breakdown atomically); accept/decline use conditional UPDATE returning affected count.
**RED:** Concurrency/integration tests: a losing race returns a clean error (not false success); a mid-flow failure leaves no partial state.
**Acceptance:** no partial writes; conditional transitions are race-safe.

#### P1-8 — Unify notification read-state · **M**
**Closes:** `src/features/notifications/components/notification-center-screen.tsx:26` (reads `is_read`, fakes `readAt`), `:67` (toggles only `is_read`), `src/features/notifications/components/NotificationBell.tsx:32` (mutates local state before checking error), `src/features/messaging/hooks/use-unread-count.ts:61` (increments on every notification, inflating the message badge).
**Change:** Pick `status`/`read_at` as canonical (retire `is_read` or write all three together); share one unread predicate between bell and center; check update errors before local mutation; scope the message badge to message/thread events only.
**RED:** Tests: mark-read updates all canonical fields; bell and center agree on unread; non-message notifications don't bump the message badge.
**Acceptance:** one consistent read-state across bell, center, and queries.

#### P1-9 — Fix RLS-blocked authed reads (correct client/policy) · **M**
**Closes:** `src/lib/supabase/traveler-requests.ts:180` (`getConfirmedBookings` reads guide profiles with traveler client), `:256` (`getJoinedRequests` reads owner profiles), `src/features/guide/components/requests/guide-requests-inbox-screen.tsx:90` (inbox load via browser anon client), `src/data/supabase/queries.ts:430` (`fetchMembersForRequests` ignores error), `supabase/migrations/20260601000002_guides_read_requester_profiles.sql:1` (any guide reads full requester profile), `schema.sql:779` (`traveler_requests` `open_to_join` branch readable unauthenticated).
**Change:** Use a booking/relationship-scoped RPC or view for cross-user display fields (or denormalize the needed display columns); move guide inbox load to a server action with the server client (browser client only for realtime); project minimal columns for requester profiles via a view scoped to interacted requests; require authenticated for `open_to_join` reads (or a redacted public view); check and surface query errors in `fetchMembersForRequests`.
**RED:** Tests: confirmed-bookings/joined-groups render the guide/owner display fields for the authorized user; a guide cannot read a requester's email/phone; unauth cannot read joinable requests' private fields.
**Acceptance:** authed display data renders without leaking PII or bypassing RLS.

#### P1-10 — Email idempotency before send · **M**
**Closes:** `src/lib/email/send-notification-email.ts:19` (logs only after provider send; dup-log errors ignored → possible duplicate emails).
**Change:** Reserve/check the `(kind, entity_id, recipient)` log row *before* sending (or use a provider idempotency key), mark sent on success, and surface log errors.
**RED:** Test: a retried send for the same (kind, entity, recipient) does not re-send.
**Acceptance:** at-most-once email per logical notification.

#### P1-11 — Align publish → review queue · **S**
**Closes:** `src/lib/supabase/listings.ts:189` (`publishListing` sets `status='published'` while moderation filters `pending_review`).
**Change:** Route publish through `pending_review` (and `ensureOpenModerationCase`) so listings enter the queue the admin UI expects.
**RED:** Test: publishing a listing makes it appear in `getPendingListingReviews`.
**Acceptance:** published listings reach moderation.

### P2 — Correctness, PII, perf, idempotency

#### P2-1 — PII boundaries · **M**
**Closes:** `src/lib/profile/resolve-display-name.ts:10` (masking opt-in; default returns `full_name`), `src/lib/pii/mask.ts:60` (`maskMessageBodies` shallow-spreads, masks only `body`), `src/features/reviews/components/ReviewCard.tsx:78` (guide reply rendered raw), `src/lib/email/templates/notification-emails.ts:13` (name interpolated unescaped into email HTML), `src/data/supabase/queries.ts:646` (`getOpenRequests` maps unmasked `full_name`), `:871` (raw offer `message`).
**Change:** Make traveler masking the **default** for cross-user display (explicit trusted context to reveal); have `maskMessageBodies` return a whitelisted shape; mask/sanitize rendered replies; HTML-escape all dynamic email text; apply `maskRequesterIdentity` in `getOpenRequests`; mask/redirect the raw offer-message query.
**RED:** Tests: cross-user surfaces show masked names by default; message/offer payloads omit non-whitelisted PII; email templates escape markup.
**Acceptance:** no unmasked counterparty PII reaches client/email by default.

#### P2-2 — Storage hardening · **M**
**Closes:** `src/lib/storage/upload.ts:123` (`confirmUpload` trusts caller `ownerId`/`objectPath`), `:115` (no `maxBytes` enforcement), `:60` (extension from filename, allowing `.exe` for `image/png`), `src/features/guide/components/verification/document-upload-card.tsx:151` (orphan object on link failure), `supabase/migrations/20260428000001_guide_portfolio_bucket.sql:7` (`public=true` bucket without explicit SELECT policy).
**Change:** Derive owner from authed context; require object-path prefix/bucket/kind to match owner + original signed-upload intent; enforce per-bucket `maxBytes`; derive extension from validated MIME; compensating-delete on link failure; add an explicit SELECT policy matching the bucket's public flag.
**RED:** Tests: confirmUpload rejects mismatched owner/path; oversized/extension-mismatch rejected; failed link leaves no orphan.
**Acceptance:** uploads can't attach arbitrary paths to arbitrary owners.

#### P2-3 — Restrict anon-granted RPCs + public photo reads · **S**
**Closes:** `supabase/migrations/20260527200000_count_competing_offers_rpc.sql:19` (`GRANT ... TO anon`), `20260527210000_request_views.sql:42` (`record_request_view` to anon), `20260424000001_guide_photo_library.sql:29` (`glp_public_select USING(true)`).
**Change:** Restrict the two RPCs to `authenticated` guides (rate-limit `record_request_view`); confirm intent of the public photo read and, if not marketing-intended, scope to approved guides.
**RED:** pgTAP: anon cannot execute the RPCs; the photo policy matches the decided intent.
**Acceptance:** no anon access to offer counts / view recording.

#### P2-4 — Request/capacity/open-group correctness · **M**
**Closes:** `src/features/traveler/components/trip-card/trip-card-mappers.ts:8` (status not branched first), `:18` (interests/mode/group_max dropped), `:48` (confirmed bookings mapped without endsOn/routeStops/participantsCount → upcoming branch never activates), `src/data/traveler-request/map.ts:42` (`dateFlexibility` no default + detail select omits column), `:25` (no `open_to_join` exposure), `:49` (`budget_minor:null`→`0₽`), `src/data/traveler-request/schema.ts:86` (assembly requires `groupSizeCurrent` not `groupMax`), `src/features/traveler/components/requests/traveler-request-detail-screen.tsx:102` (open badge tied to mode), `src/features/requests/components/public-requests-marketplace-screen.tsx:107` (filters ignore `interests`), `:235` (fillPct divide-by-zero), `:252` (`desc={highlights[1]}` blank when only one highlight), `src/features/requests/components/sent-screen-enrich.tsx:96` (notes 280 vs schema 800), `src/features/booking/actions/submitRequest.ts:62` (always `open_to_join:false`, no interests), `src/features/traveler/components/trip-card/group-by-phase.ts:37` (empty `starts_on`→completed), `src/features/traveler/components/requests/offer-card.tsx:117` (HH:MM vs HH:MM:SS compare), `src/features/traveler/components/trip-card/trip-card.tsx:148` (startTime rendered with seconds), `src/features/bookings/components/booking-ticket.tsx:100` (`participantCount ? …` hides row when count is 0), `src/features/booking/components/BookingFormTabs.tsx:176` (raw Supabase message vs error codes).
**Change:** Branch on `request.status` first; map `interests/mode/group_max`/`open_to_join`/`dateFlexibility` (with defaults) + confirmed-booking itinerary fields through the mapper + detail select; treat null budget as unset ("не указан"); align notes max with schema; gate the open-group badge on `open_to_join`; guard `sizeTarget>0`; fall back the card description when only one highlight exists; normalize times to `HH:MM` (mapper + card); use `participantCount != null` checks; throw coded errors mapped by `userMessageForError`.
**RED:** Unit tests for the mapper/schema/filter edge cases (null capacity, null budget, closed group, empty starts_on, single highlight, time format, zero participant count).
**Acceptance:** cards/detail reflect true capacity/open/flex/budget state; no NaN/`0₽`/blank-desc/seconds/false hints.

#### P2-5 — Migration idempotency + dedup policies · **M**
**Closes:** `20260413000001_tripster_v1.sql:393` (70+ `CREATE POLICY` without drops), `20260503000001_fix_conversation_thread_rls.sql:7` (same), `20260401200000_storage_buckets.sql:9` (same), `:530` (notifications dup SELECT/UPDATE policies), `:532` (legacy permissive notifications_insert name), `schema.sql:770` (UPDATE policies missing explicit `WITH CHECK`).
**Change:** Prefix policy/trigger creates with `DROP ... IF EXISTS` (or guarded `DO`); consolidate duplicate notification policies to one set; add explicit `WITH CHECK` where column constraints matter (status transitions). Ship as forward-only cleanup migrations.
**RED:** Re-running the migration set on a fresh DB succeeds idempotently; duplicate policy names are gone (`pg_policies` count check).
**Acceptance:** `supabase db reset` clean; one policy per concern.

#### P2-6 — Limiter atomicity, signout CSRF, safe-redirect · **S**
**Closes:** `src/lib/rate-limit.ts:47` (zcard+zadd non-atomic), `src/app/api/auth/signout/route.ts:6` (GET enables logout CSRF), `src/lib/auth/safe-redirect.ts:50` (`next` not role-checked), `src/app/(auth)/auth/forgot-password/actions.ts:23` (limiter keys raw email vs normalized).
**Change:** Move limiter trim/count/add/expire into one Lua/transaction; expose signout as POST (update header/drawer to POST); combine safe-redirect with `getRequiredRoleForPathname`/`roleHasAccess` (or neutral-route allowlist); key the email limiter on the normalized value.
**RED:** Tests: concurrent requests can't exceed the limit; GET signout no longer mutates session; a traveler `next=/guide/...` is not honored; case/space email variants share a limit bucket.
**Acceptance:** limiter is atomic; logout is POST-only; redirects are role-aware.

#### P2-7 — Query performance · **S**
**Closes:** `src/lib/supabase/conversations.ts:222` (load-all-then-dedupe latest message), `src/data/admin/supabase.ts:655` (O(all rows) admin dispute load), `src/data/supabase/queries.ts:1174` (`getSimilarRequests` filters after `limit(10)`).
**Change:** Per-thread `DISTINCT ON`/lateral/RPC for latest messages; scope admin dispute query to relevant `booking_id`s with pagination; filter similar requests by destination in SQL before `limit`.
**RED:** Tests/explain: queries don't scan whole tables; similar-requests returns the expected count.
**Acceptance:** no O(all rows) loads on hot paths.

#### P2-8 — Error surfacing + email routing/prefs + stale UI · **M**
**Closes:** `src/lib/notifications/triggers.ts:250` (cancel email always links `/traveler/...`), `:245` (cancel email ignores recipient prefs), `src/lib/supabase/server.ts:31` (cookie write `catch{}`), `src/app/(site)/requests/page.tsx:48` (`catch{}` hides errors), `src/app/(site)/requests/[requestId]/actions.ts:25` (silent unauth join), `src/features/guide/components/requests/guide-offer-qa-panel.tsx:20` (promise no `.catch` → stuck loading), `:23` (no refetch after reply), `src/features/guide/components/requests/guide-request-detail-screen.tsx:224` (`onSuccess` sets `offerId` to literal `"pending"` instead of the real UUID → Q&A panel shown with an invalid id), `src/features/guide/components/calendar/day-panel.tsx:101` (empty-array close w/o state merge), `src/features/guide/components/calendar/MonthlyCalendar.tsx:211` (filter 'all' targets `listings[0]`).
**Change:** Per-recipient booking URLs + pref checks for cancel emails; log/surface swallowed catches; structured error/redirect for unauth join; return the real offer id from `submitOfferAction` (or refetch) and only mount the Q&A panel with a valid id; add `.catch` + refetch in the QA panel; merge returned rows in day-panel; require explicit listing selection before opening the day panel.
**RED:** Tests for each: error visible instead of swallowed; cancel email respects prefs/role; QA panel gets a real offer id and recovers from rejection; calendar targets the chosen listing.
**Acceptance:** no silent failures or invalid-id panels on these paths.

### P3 — Dead code, a11y, hygiene

#### P3-1 — Remove dead code · **S**
**Closes:** `src/data/admin/supabase.ts` (dead module, no imports), `src/data/reviews/supabase-client.ts:58` (unused dup), `src/lib/supabase/reviews.ts:265` (unused exports), `src/data/traveler-request/submit.ts:11` (dead stub), `src/features/traveler/actions/accept-offer.ts:8` (dup of app action), `src/features/guide/components/requests/guide-requests-inbox-screen.tsx:176` (unreachable branch), `src/features/guide/components/listings/guide-listings-list-screen.tsx:37` (unused prop).
**Change:** Delete (or wire through the single canonical path). **RED:** typecheck + full test suite green after removal; grep shows no remaining importers.
**Acceptance:** no dead modules/branches/props.

#### P3-2 — Accessibility · **S**
**Closes:** `src/components/shared/language-multi-select.tsx:61` (remove-chip not keyboard-operable), `src/components/listing-detail/TourItineraryDisplay.tsx:55` (no `aria-expanded`/`aria-controls`), `src/components/help/HelpSearch.tsx:70` (listbox roles without keyboard model), `src/components/shared/site-header.tsx:198` (static `aria-label` hides unread count).
**Change:** Real `<button>` remove controls with focus ring + hit target; `aria-expanded`/`aria-controls` on accordions; proper combobox semantics or plain list; compute the messages label from `unreadCount`.
**RED:** a11y/component tests (axe or role assertions). **Acceptance:** keyboard-operable, state exposed to AT.

#### P3-3 — Robustness & minor correctness · **M**
**Closes:** `src/components/shared/site-header.tsx:159` (desktop account menu lost when `role===null`), `src/components/shared/guide-bottom-nav.tsx:21` (`useUnreadCount(true)` hard-coded), `src/lib/storage/client-upload.ts:37` (hand-rolled signed PUT), `src/lib/notifications/triggers.ts:356` (`allSettled` drops failures), `src/lib/profile/load-traveler-profile.ts:45` (hides DB errors as "no profile"), `src/lib/demo-session.ts:21` & `src/lib/demo-traveler-profile.ts:24` (decode throws outside safe parse), `src/lib/dates.ts:22` (no ISO validation), `src/features/auth/actions/signUpAction.ts:47` (assumes `created.user.id` when `createError` null → can throw instead of a controlled error), `:64` (rollback ignores lookup/delete errors → possible orphaned auth users), `src/lib/flags.test.ts:5` (registry test omits `FEATURE_TR_PAYMENT` → a flag regression passes unnoticed), `src/features/guide/components/requests/bid-form-panel.tsx:245` (no client verification gate), `src/features/guide/components/verification/guide-profile-section-boundary.tsx:21` (server try/catch can't catch render), `verification-upload-form.tsx:147` (no server re-validation), `document-upload-card.tsx:238` (no submitted/approved lock), `send-qa-reply.ts:50` (revalidate misses paths), `guide-profile-section-client-boundary.tsx:38` (no reset on sectionId change), `guide-bookings-screen.tsx:28` (swallowed load error), `guide-requests-inbox-screen.tsx:189` (header count unscoped).
**Change:** Neutral account/logout menu for unknown role; pass auth into `useUnreadCount`; use the Supabase SDK signed-upload helper; log/aggregate notification failures; fall back only on known missing-column errors; wrap cookie decode in the safe parser; validate ISO dates; guard `created.user?.id` and make signup rollback best-effort-but-observable; assert every `FlagName` in the flags test (or derive from the registry); gate doc upload when submitted/approved; reset error boundary on `sectionId` change; surface load errors; scope header counts.
**RED:** Targeted unit/component tests per item (incl. signup partial-response + rollback, and a flags test that fails if a `FlagName` is unasserted). **Acceptance:** no silent failures / stuck states; behavior correct for the edge case.

#### P3-4 — Redirect return-paths + document intentional public reads · **S**
**Closes:** `src/app/(protected)/traveler/requests/join-action.ts:24`, `favorites/page.tsx:15`, `referrals/page.tsx:35`, `partner/page.tsx:22`, `disputes/[id]/page.tsx:26` (bare `/auth`, drop return URL); plus documenting intentional public reads `tripster_v1.sql:491` (`review_ratings_breakdown_select`), `:564` (`help_articles_select`), `schema.sql:1013` (`quality_snapshots`/`destinations` public), `20260602130000_fix_custom_access_token_hook.sql:49` (`profiles_select_auth_admin_hook USING(true)` — acceptable for the hook role).
**Change:** Use `buildAuthLoginRedirect(path)` for the five redirects (preserve `?next=`); add a one-line comment on each intentional `USING(true)`/hook policy noting it's deliberate (optionally narrow `review_ratings_breakdown_select` to published reviews).
**RED:** Tests: unauth hitting these routes returns to the original page after login. **Acceptance:** no lost return paths; intentional public reads documented.

---

## 6. Suggested dispatch order

P0-1 → P0-2 → P0-3 → P0-4 → P0-5 (security cluster first, each behind its test), then P1-1…P1-11, then P2-1…P2-8, then P3-1…P3-4. P0/P1 DB tasks (P0-1/2/3, P1-2/3) can batch into a small number of forward-only migrations reviewed together. Cross-reference: tasks tagged from Phase-1 recurring failure modes (Supabase client selection, RLS/admin-client, notification read-state, migration idempotency, async-contracts) are P0-4, P1-1/4/5/8/9, P2-5 — prioritize because these classes recur historically.

## 7. Verification gate (must pass before merge — every task)

- `bun run typecheck`, `bun run lint`, targeted `bun run test:run` green.
- New RED test for the task exists and now passes; pre-existing tests still green.
- For RLS/RPC tasks: a pgTAP/integration test proves deny-unauthorized **and** allow-authorized.
- For migrations: `supabase db reset` (or equivalent) re-applies cleanly and idempotently.
- Diff touches only the files in the task's **Closes/Change** list (scope creep blocks merge).
- No secrets, no `console.log`, no `TODO`, no commented-out code; no AI/tool trailers in commits.
- Manual smoke of the affected flow where applicable (auth, messaging, admin, booking).

## 8. Traceability appendix — all 154 findings → task

Every audited finding is assigned to exactly one task. Counts per subsystem match the audit (01 auth 7 · 02 data-supabase 21 · 03 guide 24 · 04 traveler-requests 21 · 05 profile-reviews-messaging 12 · 06 app-routes 17 · 07 lib-core 18 · 08 components 6 · 09 db-migrations 28 = 154).

| Task | Findings closed (count) |
|------|--------------------------|
| P0-1 | schema.sql:749, schema.sql:538, admin-access.ts:18, admin-access.ts:28, server-auth.ts:83 (5) |
| P0-2 | accept_offer_rpc:14, send_qa_message_rpc:11 (2) |
| P0-3 | tripster_v1:593 (1) |
| P0-4 | queries.ts:162, queries.ts:498 (2) |
| P0-5 | traveler-requests-screen.tsx:17 (1) |
| P1-1 | threads/[threadId]/route.ts:77, messages/[threadId]/actions.ts:76, notification-center-screen.tsx:45, data/notifications/supabase.ts:72, notifications/page.tsx:8 (5) |
| P1-2 | schema.sql:647, messaging_rls_realtime.sql:33 (2) |
| P1-3 | schema.sql:1001, offer_counter_traveler_rls:4, bonus_ledger_referral_rls:17, tripster_v1:492, marketplace-events/client.ts:25, guide_licenses.sql:18 (6) |
| P1-4 | send-qa-reply.ts:8, send-qa-reply.ts:23, guide-portfolio-screen.tsx:47, guide/listings/actions.ts:49, guide/inbox/offer/actions.ts:67, guide-requests-inbox-screen.tsx:95 (6) |
| P1-5 | admin/moderation:14, admin/audit:62, admin/bookings:21, admin/disputes/[caseId]:19, disputes.ts:388, reviews.ts:198, bookings/state-machine.ts:29 (7) |
| P1-6 | completeOnboarding.ts:31, completeOnboarding.ts:68, completeOnboarding.ts:34, submitReply.ts:42, submitReply.ts:87, updatePersonalSettings.ts:22, listingManagementActions.ts:15 (7) |
| P1-7 | offerActions.ts:120, offerActions.ts:36, openDispute.ts:34, submitReview.ts:60 (4) |
| P1-8 | notification-center-screen.tsx:26, notification-center-screen.tsx:67, NotificationBell.tsx:32, use-unread-count.ts:61 (4) |
| P1-9 | traveler-requests.ts:180, traveler-requests.ts:256, guide-requests-inbox-screen.tsx:90, queries.ts:430, guides_read_requester_profiles.sql:1, schema.sql:779 (6) |
| P1-10 | send-notification-email.ts:19 (1) |
| P1-11 | listings.ts:189 (1) |
| P2-1 | resolve-display-name.ts:10, pii/mask.ts:60, ReviewCard.tsx:78, notification-emails.ts:13, queries.ts:646, queries.ts:871 (6) |
| P2-2 | upload.ts:123, upload.ts:115, upload.ts:60, document-upload-card.tsx:151, guide_portfolio_bucket.sql:7 (5) |
| P2-3 | count_competing_offers_rpc:19, request_views.sql:42, guide_photo_library.sql:29 (3) |
| P2-4 | trip-card-mappers.ts:8, trip-card-mappers.ts:18, trip-card-mappers.ts:48, map.ts:42, map.ts:25, map.ts:49, schema.ts:86, traveler-request-detail-screen.tsx:102, public-requests-marketplace-screen.tsx:107, public-requests-marketplace-screen.tsx:235, public-requests-marketplace-screen.tsx:252, sent-screen-enrich.tsx:96, submitRequest.ts:62, group-by-phase.ts:37, offer-card.tsx:117, trip-card.tsx:148, booking-ticket.tsx:100, BookingFormTabs.tsx:176 (18) |
| P2-5 | tripster_v1:393, fix_conversation_thread_rls:7, storage_buckets.sql:9, tripster_v1:530, tripster_v1:532, schema.sql:770 (6) |
| P2-6 | rate-limit.ts:47, signout/route.ts:6, safe-redirect.ts:50, forgot-password/actions.ts:23 (4) |
| P2-7 | conversations.ts:222, admin/supabase.ts:655, queries.ts:1174 (3) |
| P2-8 | triggers.ts:250, triggers.ts:245, server.ts:31, requests/page.tsx:48, requests/[requestId]/actions.ts:25, guide-offer-qa-panel.tsx:20, guide-offer-qa-panel.tsx:23, guide-request-detail-screen.tsx:224, day-panel.tsx:101, MonthlyCalendar.tsx:211 (10) |
| P3-1 | data/admin/supabase.ts(dead), reviews/supabase-client.ts:58, reviews.ts:265, submit.ts:11, accept-offer.ts:8, guide-requests-inbox-screen.tsx:176, guide-listings-list-screen.tsx:37 (7) |
| P3-2 | language-multi-select.tsx:61, TourItineraryDisplay.tsx:55, HelpSearch.tsx:70, site-header.tsx:198 (4) |
| P3-3 | site-header.tsx:159, guide-bottom-nav.tsx:21, client-upload.ts:37, triggers.ts:356, load-traveler-profile.ts:45, demo-session.ts:21, demo-traveler-profile.ts:24, dates.ts:22, signUpAction.ts:47, signUpAction.ts:64, flags.test.ts:5, bid-form-panel.tsx:245, guide-profile-section-boundary.tsx:21, verification-upload-form.tsx:147, document-upload-card.tsx:238, send-qa-reply.ts:50, guide-profile-section-client-boundary.tsx:38, guide-bookings-screen.tsx:28, guide-requests-inbox-screen.tsx:189 (19) |
| P3-4 | join-action.ts:24, favorites/page.tsx:15, referrals/page.tsx:35, partner/page.tsx:22, disputes/[id]/page.tsx:26, tripster_v1:491, tripster_v1:564, schema.sql:1013, fix_custom_access_token_hook.sql:49 (9) |

**Coverage total:**
P0 = 5+2+1+2+1 = **11**;
P1 = 5+2+6+6+7+7+4+4+6+1+1 = **49**;
P2 = 6+5+3+18+6+4+3+10 = **55**;
P3 = 7+4+19+9 = **39**.
Grand total = 11+49+55+39 = **154 / 154.**

Per-subsystem reconciliation (assigned findings tally back to the audit's per-subsystem counts): auth 7, data-supabase 21, guide 24, traveler-requests 21, profile-reviews-messaging 12, app-routes 17, lib-core 18, components 6, db-migrations 28 = 154.

> If an implementer finds any discrepancy against the source `~/audit/out/NN-*.md`, reconcile to the source — never drop a finding to make a count match.
