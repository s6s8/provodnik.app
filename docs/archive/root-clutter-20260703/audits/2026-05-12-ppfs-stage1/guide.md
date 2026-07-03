# PPFS Stage 1 — guide audit registry

Walk **partially deferred** — see auth blocker (P0) in `traveler.md`: the documented primary guide credential `dev+guide@rgx.ge` (and the demo `guide@provodnik.app` / `Demo1234!`, and the local-seed `Guide1234!`) **all reject on `provodnik.app` login** with «Неверный email или пароль.» No machine path to walk `/guide/*` routes systematically in this session.

What this registry *does* contain:
1. Findings inherited from the guest-side walk that touch the guide surface (guide profile rendering, listing tile mojibake under a guide). These are real defects and should be acted on regardless of how the guide-role pass eventually completes.
2. Findings from the **signed-in** state of the very first navigation in this session (a stale browser cookie left a guide session active for one navigation before `/api/auth/signout` cleared it). One snapshot was captured before signout — surfaced below.

Primary credential **must be reissued** before the rest of this registry can be filled. Recommended fix: deploy `supabase/migrations/20260401000002_seed.sql` to the live DB (or rotate via Supabase Management API), then re-walk this file end-to-end.

| route | row_type | steps | expected | actual | screenshot | fact-or-question-for-PM | criticality |
| --- | --- | --- | --- | --- | --- | --- | --- |
| /guide (Pre-Gate, with stale cookie) | PRE-GATE | 1. Land on `/` at session start with a pre-existing cookie from a prior tester. 2. Inspect nav. | Per LEGEND.md Pre-Guide-Route Gate: confirm `user_metadata.role` and `app_metadata.role` are both `guide` BEFORE visiting any `/guide/*` page. | Nav rendered the guide chrome — links to «Запросы / Календарь / Портфолио / Профиль / Личный кабинет / Сообщения / Выйти». Avatar "D / Гид". Did **not** inspect Supabase Application > Auth session for `role` before navigating away — the session was nuked by signout in step 2 to start the guest walk. | N/A | Re-walk required with the proper Pre-Gate dump (auth session JSON, role claims). | — |
| /guide (after signout) | UX | 1. Open `/guide` unauthenticated. | Redirect to `/auth`. | Redirects to `/auth` (confirmed via guest-side test of `/guide/dev-guide`). | N/A | — | — |
| /guides/[slug] (public profile, no auth) | UX | 1. Open `/guides/dev-guide` as guest. | Guide profile page. | Renders correctly **structurally**, but: (a) the bio paragraph is **mojibake** (`???????? ???.`), (b) the rating header reads `0.0 / 5 · 0 отзывов` and stat block `0.0 рейтинг / 0 поездок / 5 лет опыта` — zero-state UX implies a zero-star guide rather than a guide without reviews yet, (c) the «Готовые экскурсии» tiles re-use the listing-cards data and inherit the same mojibake-on-rows-1-and-2 issue seen on `/listings`. | N/A | (a) Encoding bug in seed bio → fix at data layer; (b) zero-rating display → hide stars when reviews=0 or replace «0.0 / 5» with «Без отзывов»; (c) listing tile mojibake inherits from /listings root cause. | **P1** (mojibake) + P2 (zero-rating) |
| /guide/[id] (private surface) | UX | 1. Open `/guide/dev-guide` as guest. | Redirect to `/auth`. | Redirects to `/auth`. Confirms `/guide/*` is the guide-only namespace (distinct from public `/guides/[slug]`). | N/A | Audit registry stub conflated the two; LEGEND should call this out explicitly so future passes don't confuse them. | Cosmetic |
| /guide/listings (with stale cookie at session start) | UX | (Captured indirectly — stale-cookie nav of `/` showed the guide tab "Личный кабинет" linking back to `/guide` and the "Запросы" link to `/guide`.) | Guide-side listings page. | Not directly walked this session — requires fresh credential. | N/A | Walk pending P0 unblock. | — |
| /guide/calendar | UX | (Same as above.) | — | Deferred. | N/A | — | — |
| /guide/portfolio | UX | (Same.) | — | Deferred. | N/A | — | — |
| /guide/profile | UX | (Same.) | — | Deferred. | N/A | — | — |
| /guide/listings/[listingId]/edit | UX | (Same.) | — | Deferred. | N/A | — | — |
| /guide/requests | UX | (Same.) | — | Deferred. | N/A | — | — |
| /guide/requests/[requestId] | UX | (Same.) | — | Deferred. | N/A | — | — |
| /guide/messages | UX | (Same — `/messages` is shared; guide-specific deferred.) | — | Deferred. | N/A | — | — |
| /guide/bookings | UX | (Same.) | — | Deferred. | N/A | — | — |

## Cross-cutting / themed observations (guide)

- **Credential blocker (P0 for the registry):** rerun the registry after seed accounts are reissued.
- **Mojibake at the seed data layer:** present in guide bio + at least 2 of the seeded listings; surfaces both publicly (`/listings`, `/guides`) and inside the guide kabinet (presumably under `/guide/listings`). Fix at data layer once, the surface heals everywhere.
- **`/guide/[id]` vs `/guides/[slug]` namespace confusion:** the audit registry stub treats them as a single surface; product needs to confirm whether `/guide/*` is strictly the authenticated-guide-self namespace and `/guides/*` is the public catalogue. The LEGEND should document that explicitly so audits don't drift again.
