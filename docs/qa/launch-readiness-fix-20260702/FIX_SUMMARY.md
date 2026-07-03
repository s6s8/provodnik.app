# Launch-readiness fixes — 2026-07-02/03

Branch: `opus/fix-launch-readiness` (based on prod main `28b92058`).
Scope: fix the launch blockers from the Opus/Hermes E2E audit without losing
functionality. No redesign, no unrelated refactors.

## A. Critical — public guide detail rendered 404

**Root cause.** `getGuideBySlug` selected `guide_profiles` with an inner join to
`profiles` (`profiles!inner(...)`). `profiles_select` RLS only exposes a caller's
own row (or admin), so for anonymous visitors the joined `profiles` row was
invisible and the whole select returned `null` → `notFound()`. The catalog kept
working because it is served by the SECURITY DEFINER `search_guides` RPC.

**Fix.**
- New migration `20260703000000_public_guide_detail_rpc.sql` adds
  `public.get_public_guide_by_slug(text[])` — a `STABLE SECURITY DEFINER` RPC that
  mirrors `search_guides`' allowlist (`verification_status='approved'`,
  `is_available=true`, `profiles.role='guide'`, `profiles.account_status='active'`)
  and returns the profile display fields (`full_name`, `avatar_url`, …).
- `getGuideBySlug` now calls the RPC instead of the anonymous `profiles!inner`
  join. Slug candidate handling (encoded/decoded + NFC/NFKD) is unchanged, so
  Cyrillic slugs still resolve.
- Suspended/archived/demoted guides stay hidden because the allowlist is enforced
  inside the definer function, not by anonymous RLS.

Files: `supabase/migrations/20260703000000_public_guide_detail_rpc.sql`,
`src/data/supabase/queries.ts`.

## B. High — anonymous API could read raw traveler_requests

**Root cause.** `traveler_requests_select` exposed every `status='open'` row to the
`anon` role with no auth predicate, so `GET /rest/v1/traveler_requests` leaked
`traveler_id` and raw free-text `notes` (potential phone/email PII).

**Fix.** Migration `20260703000100_harden_public_traveler_requests.sql`:
- Tightens `traveler_requests_select`: direct reads now require an authenticated
  session (`auth.uid() = traveler_id` OR `is_admin()` OR
  `auth.uid() IS NOT NULL AND status='open'`). Guides keep raw access for bidding,
  travelers keep their own rows, admins keep all. Anonymous direct reads are gone.
- Adds `public.mask_public_contact_info(text)` (redacts emails + phone-like digit
  runs) and `public.v_public_open_requests` — an owner-rights view (`security_invoker
  = false`) that exposes a curated, **traveler_id-free** column set with masked
  `notes`. Granted to `anon`/`authenticated`.
- `getOpenRequests`, `getRequestById`, `getOpenRequestsByDestination` fall back to
  `v_public_open_requests` when the raw table returns nothing (the anonymous case).
  Authenticated flows are unchanged. Public-view rows carry no `traveler_id`, so
  creator-name resolution is skipped for them (the marketplace already shows the
  anonymous "Путешественник" label for logged-out viewers).

This aligns the schema with the pre-existing `request_display_rls_test.sql`, which
already asserted that anon cannot read open requests directly.

Files: `supabase/migrations/20260703000100_harden_public_traveler_requests.sql`,
`src/data/supabase/queries.ts`.

## C. High — /favorites and /referrals showed a cabinet 404 behind HTTP 200

**Root cause.** Both pages are feature-flagged (`FEATURE_TR_FAVORITES`,
`FEATURE_TR_REFERRALS`). When the flag is off they called `notFound()`, so a
direct visit rendered the "Страница кабинета не найдена" cabinet-404 (the links are
already removed from all nav menus).

**Fix.** New `src/components/shared/cabinet-section-unavailable.tsx` renders a
friendly "раздел скоро появится" empty state (built on the existing
`RouteFeedbackShell`) with a link back to the cabinet. Both pages render it instead
of `notFound()` when the flag is off. Route intent is preserved; no 404 copy.

Files: `src/components/shared/cabinet-section-unavailable.tsx`,
`src/app/(protected)/favorites/page.tsx`, `src/app/(protected)/referrals/page.tsx`.

## D. Medium — terminology drift (туры / туристы) in product UI

Replaced user-visible product copy (legal policy pages left untouched):

| File | Before | After |
|---|---|---|
| `guide/reviews/page.tsx` | о ваших **турах** | о ваших **экскурсиях** |
| `admin/listings/page.tsx` | **Туры** на проверке | **Экскурсии** на проверке |
| `guide-excursions-screen.tsx` | заявки **туристов** | запросы **путешественников** |
| `admin/bookings/page.tsx` | **Турист**: … | **Путешественник**: … |
| `offer-actions.ts` (×2) | **Турист** просит… | **Путешественник** просит… |
| `disputes-queue.tsx` | fallback "**Турист**" | fallback "**Путешественник**" |
| `BookingFormTabs.tsx` | У этого **тура**… | У этой **экскурсии**… |
| `destination-detail-screen.tsx` (×3) | готовых **туров** / Готовые **туры** / Все **туры** | …**экскурсий** / Готовые **экскурсии** / Все **экскурсии** |
| `NewGuideFrame.tsx` | Первые **туры** | Первые **экскурсии** |

Tests that intentionally searched the old copy were updated
(`guide-profile-screen.test.tsx`, `primitives.test.tsx`).

## E. Medium — invalid guide inbox detail leaked into a public 404

**Root cause.** The guide inbox "Подробнее" button linked to `/guide/inbox/${id}` —
a route that does not exist — so it fell through to a public/cabinet 404.

**Fix.**
- The inbox link now points at the canonical `/requests/${id}` detail route, which
  already renders the guide bid view for `viewerRole==='guide'`.
- `/requests/[requestId]/page.tsx` now redirects an authenticated guide to
  `/guide/inbox` (safe messaging) when the request is missing, instead of showing
  the public "Запрос не найден" 404. Anonymous/traveler visitors still get the
  normal 404.

Files: `src/features/guide/components/requests/guide-requests-inbox-screen.tsx`,
`src/app/(site)/requests/[requestId]/page.tsx`.

## F. Regression coverage

- `src/data/supabase/queries.test.ts` — guide detail now exercises the RPC path
  (active resolve, Cyrillic/encoded slug, empty→null); new "anonymous public
  request access uses the sanitized view" suite covers the `v_public_open_requests`
  fallback for all three request query helpers.
- `favorites/page.test.tsx`, `referrals/page.test.tsx` — flag-off renders a useful
  empty state, not a cabinet 404.
- `requests/[requestId]/page.test.tsx` — guide redirect to `/guide/inbox` on a
  missing request.
- `supabase/tests/public_launch_hardening_test.sql` — pgTAP: guide RPC hides
  suspended accounts; anon blocked on raw `traveler_requests`; anon reads the
  sanitized view (no `traveler_id`, masked notes); authenticated guide keeps raw
  access.

## Manual deploy / migration steps (operator)

1. Apply the two new migrations to the live DB **in order**:
   - `20260703000000_public_guide_detail_rpc.sql`
   - `20260703000100_harden_public_traveler_requests.sql`

   Per the repo's migration-drift rule, verify against the live schema after
   applying (`get_public_guide_by_slug` in `pg_proc`, `v_public_open_requests` in
   `information_schema.views`, the tightened `traveler_requests_select` in
   `pg_policies`). Both migrations are schema-only and idempotent
   (`CREATE OR REPLACE` / `DROP POLICY IF EXISTS`) — safe to re-run; they do not
   touch data.
2. Deploy the app code (same commit). The code degrades gracefully if a migration
   is missing (guide detail would 404, public requests would fall back to an empty
   view), so apply migrations **before or with** the code deploy.
3. No env/flag changes required. Favorites/referrals stay flag-off and now show the
   empty state instead of a 404.

## Deliberate scoping notes

- Notes masking is enforced at the anonymous API boundary (the view). Authenticated
  users still read raw `notes` on their own/bidding surfaces by design; the audit
  finding was specifically about anonymous raw-table access, which is now closed.
- No data migration is included; existing guide slugs/availability were already
  backfilled by `20260702000001_publish_approved_guides.sql`.
