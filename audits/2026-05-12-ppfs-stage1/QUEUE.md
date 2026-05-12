# PPFS Stage 2 — prioritized fix queue (registry-derived)

Stage 1 directory (absolute): `/Users/idev/projects/provodnik.app/.worktrees/task-20260512-2-rationale-30-60-4din/audits/2026-05-12-ppfs-stage1`

Persona registry files (absolute paths) and finding counts (table rows under each registry’s audit table):

- `guest.md` — `/Users/idev/projects/provodnik.app/.worktrees/task-20260512-2-rationale-30-60-4din/audits/2026-05-12-ppfs-stage1/guest.md` — **26** findings
- `traveler.md` — `/Users/idev/projects/provodnik.app/.worktrees/task-20260512-2-rationale-30-60-4din/audits/2026-05-12-ppfs-stage1/traveler.md` — **20** findings
- `guide.md` — `/Users/idev/projects/provodnik.app/.worktrees/task-20260512-2-rationale-30-60-4din/audits/2026-05-12-ppfs-stage1/guide.md` — **13** findings
- `admin.md` — `/Users/idev/projects/provodnik.app/.worktrees/task-20260512-2-rationale-30-60-4din/audits/2026-05-12-ppfs-stage1/admin.md` — **16** findings

**Registry total:** 75 findings (non-zero per registry; four files present).

## Preamble — viewport coverage (1280px and 375px)

| Persona | 1280px | 375px |
| --- | --- | --- |
| Guest (unauthenticated) | **Done** for the walked guest route set on 2026-05-12 (see `guest.md`). | **Partial:** explicit `/` spot-check only; registry notes devtools resize may not equal true 375px viewport; full matrix **TODO** for second sweep with proper mobile emulation. |
| Traveler | **Done** for walked routes at 1280×800 (see `traveler.md`). | **TODO sentinel:** kabinet 375px sweep explicitly deferred in registry (“375 px responsive sweep across kabinet pages”). |
| Guide | **Blocked / partial:** most `/guide/*` rows deferred; one pre-gate snapshot and public `/guides/[slug]` guest-side observation only (see `guide.md`). | **TODO sentinel:** no dedicated 375px guide pass recorded. |
| Admin | **Blocked:** no successful admin login on live; all `/admin/*` UX rows deferred (see `admin.md`). | **TODO sentinel:** no admin viewport pass possible until credential unblock. |

## Explicit exclusions (epic carry-over; not derived from Stage 1 registry tables)

| Finding-IDs | Criticality | Fact-or-Q-to-Product | Tier | Open-Product-Question | Concern-Annotation |
| --- | --- | --- | --- | --- | --- |
| **К4** — `20260512-increase-bottom-spacing-between-ypwv` (request block bottom spacing vs footer) | — | Tracked as its own in-flight ticket; do not duplicate in PPFS Stage 2 queue. | Excluded | Owner already sequenced; confirm when merged. | — |
| **К5** — request-form heading centering | — | Cosmetic layout item for the hero or kabinet request form heading; sequenced after К4 per epic morning agreement. | Excluded | Confirm target surface (home vs `/traveler/requests/new` vs both). | — |

## Ordered queue (registry + epic pins)

Columns: **Finding-IDs** use the exact `route` cell text from the registry tables (comma-separated when one queue row bundles multiple findings). **Tier** follows `RUBRIC.md`.

| Finding-IDs | Criticality | Fact-or-Q-to-Product | Tier | Open-Product-Question | Concern-Annotation |
| --- | --- | --- | --- | --- | --- |
| `/auth (login as documented seed)`, `/admin (login attempt)` | P0 | All documented seeds reject on live; machine audit cannot re-walk traveler seeds, guide `/guide/*`, or any `/admin/*`. | P0 | Deploy `20260401000002_seed.sql` to live, rotate passwords via Supabase admin API, or change audit protocol to self-issued accounts? | — |
| `/listings`, `/listings/[slug] (mojibake card)`, `/guides`, `/guides/[slug]`, `/guides/[slug] (public profile, no auth)` | P1 | Mojibake on listing titles, trails, guide bio, and tiles; invalid UTF-8 at data layer suspected. | P1 | Re-seed from UTF-8 source vs one-off normaliser run? | — |
| `/auth/signup (new traveler)`, `/auth/signup (new guide)` | P1 | Open self-registration as «Гид» without vetting; anti-dez epic relevance. | P1 | Intentional MVP vs invite-only guide onboarding? | — |
| `/traveler/requests/new` | P1 | Interest chips and date-flex model diverge from homepage hero form; silent filter misses possible. | P1 | Single source of truth: home vs kabinet — which wins? | — |
| `/auth/update-password`, `/auth/confirm`, `/tours`, `/requests/new`, `/traveler/profile`, `/traveler/wallet` | P2 | Silent auth edge states; `/tours` 404 vs stub; guest `/requests/new` drops post-login intent; traveler stub routes 404 as public shell. | P2 | Banner for `?error=*`; restore or remove `/tours`; add `next` param; implement or drop stub routes? | — |
| `/` | Cosmetic | Footer social anchors are bare `vk.com` and `t.me` roots. | P3 | Replace with real brand destinations or hide until configured? | — |
| `/auth` | — | Login shell renders as expected. | P3 | — | — |
| `/auth/forgot-password` | — | Forgot-password flow shell OK. | P3 | — | — |
| `/trust` | — | Trust page renders; CTA present. | P3 | — | — |
| `/requests` | — | Open requests index renders; empty state OK. | P3 | — | — |
| `/requests/[requestId]` | — | Could not exercise without seeded public ID. | P3 | Seed one open request for guest detail pass? | — |
| `/policies/terms` | — | Terms render. | P3 | — | — |
| `/policies/privacy` | — | Privacy renders. | P3 | — | — |
| `/policies/cookies` | — | Cookies policy renders. | P3 | — | — |
| `/listings/[slug] (clean card)` | — | Clean UTF-8 listing detail control case passes. | P3 | — | — |
| `/how-it-works` | Cosmetic | Short explainer (~800 chars). | P3 | Minimal MVP by design vs missing depth? | — |
| `/guide/[id]` | Cosmetic (doc) | Namespace doc nit: `/guide/*` protected vs `/guides/*` public. | P3 | LEGEND clarification only. | — |
| `/destinations` | Cosmetic | “3 тура” counter vs five cards. | P3 | Counter semantics? | — |
| `/destinations/[slug]` | Cosmetic | `spb` slug not canonical. | P3 | Publish canonical slug rules? | — |
| `/become-a-guide` | — | Recruitment page OK. | P3 | — | — |
| `/ (375px mobile)` | — | Mobile spot-check on `/`; tooling caveat in registry. | P3 | Re-run at true 375px emulation. | — |
| `/ (console)` | — | Console clean on `/`. | P3 | — | — |
| `/listings (network)` | — | Network panel clean on `/listings`. | P3 | — | — |
| `/traveler` | Cosmetic | Redirect to `/traveler/requests` acceptable; stub annotation. | P3 | Add kabinet index or document redirect-only? | — |
| `/traveler/requests` | Cosmetic | Missing semantic `h1` (tabs only). | P3 | Off-screen h1 vs promote first tab? | — |
| `/traveler/requests/[requestId]` | — | Kabinet 404 distinct from public 404 — PASS. | P3 | — | — |
| `/traveler/requests/[requestId]/sent` | — | Deferred pending seeded request. | P3 | Seed `sent` state for Stage 2? | — |
| `/traveler/requests/[requestId]/accepted` | — | Deferred pending proposal state. | P3 | Seed accepted flow? | — |
| `/traveler/bookings` | — | Empty bookings list OK. | P3 | — | — |
| `/traveler/bookings/[bookingId]` | — | Deferred — no booking. | P3 | Seed booking for traveler? | — |
| `/traveler/bookings/[bookingId]/review` | — | Deferred. | P3 | — | — |
| `/traveler/bookings/[bookingId]/dispute` | — | Deferred. | P3 | — | — |
| `/traveler/notifications` | Cosmetic | Stub consolidation note vs `/notifications`. | P3 | Registry hygiene only. | — |
| `/messages` | Cosmetic | Missing `h1` on empty inbox. | P3 | Same heading pattern as requests tab? | — |
| `/messages/[threadId]` | — | Deferred — no threads. | P3 | — | — |
| `/notifications` | Cosmetic | “Прочитать всё” visible at zero unread. | P3 | Hide when count 0? | — |
| `(traveler console + network)` | — | Clean console and network across walked traveler routes. | P3 | — | — |
| `/guide (Pre-Gate, with stale cookie)` | — | Pre-gate protocol not satisfied in session; re-walk required. | P3 | Re-run with Application tab role dump before any `/guide/*`. | — |
| `/guide (after signout)` | — | Unauthenticated `/guide` redirects to `/auth` — PASS. | P3 | — | — |
| `/guide/[id] (private surface)` | Cosmetic (doc) | Same namespace clarification as guest stub. | P3 | LEGEND only. | — |
| `/guide/listings (with stale cookie at session start)` | — | Not walked; pending credential. | P3 | Re-run after P0 unblock. | — |
| `/guide/calendar` | — | Deferred. | P3 | — | — |
| `/guide/portfolio` | — | Deferred. | P3 | — | — |
| `/guide/profile` | — | Deferred. | P3 | — | — |
| `/guide/listings/[listingId]/edit` | — | Deferred. | P3 | — | — |
| `/guide/requests` | — | Deferred. | P3 | — | — |
| `/guide/requests/[requestId]` | — | Deferred. | P3 | — | — |
| `/guide/messages` | — | Deferred (shared `/messages`). | P3 | — | — |
| `/guide/bookings` | — | Deferred. | P3 | — | — |
| `/admin` | — | Deferred until admin login exists. | P3 | Re-queue immediately after credential fix. | — |
| `/admin/users` | — | Deferred. | P3 | — | — |
| `/admin/users/[userId]` | — | Deferred. | P3 | — | — |
| `/admin/listings` | — | Deferred. | P3 | — | — |
| `/admin/listings/[listingId]` | — | Deferred. | P3 | — | — |
| `/admin/requests` | — | Deferred. | P3 | — | — |
| `/admin/requests/[requestId]` | — | Deferred. | P3 | — | — |
| `/admin/bookings` | — | Deferred. | P3 | — | — |
| `/admin/bookings/[bookingId]` | — | Deferred. | P3 | — | — |
| `/admin/disputes` | — | Deferred. | P3 | — | — |
| `/admin/disputes/[disputeId]` | — | Deferred. | P3 | — | — |
| `/admin/payouts` | — | Deferred. | P3 | — | — |
| `/admin/audit-log` | — | Deferred. | P3 | — | — |
| `/admin/feature-flags` | — | Deferred. | P3 | — | — |
| `/admin/seed` | — | Deferred. | P3 | — | — |
| **К1** (epic backlog; interest service dictionary) | Cosmetic / tech debt | Formalise single interest taxonomy and flex-date model after `/` vs `/traveler/requests/new` reconciliation (see linked registry row). | P3 | Treat glossary work as post-contour per epic? | Pinned to P3 per `RUBRIC.md` (forced defer). |
| **К2.1** (epic; stale test selectors) | — | Repair unit tests tied to outdated selectors (batch 1). | P3 | — | Pinned to P3 per `RUBRIC.md`. |
| **К2.2** (epic; stale test selectors) | — | Repair unit tests tied to outdated selectors (batch 2). | P3 | — | Pinned to P3 per `RUBRIC.md`. |
| **К2.3** (epic; stale test selectors) | — | Repair unit tests tied to outdated selectors (batch 3). | P3 | — | Pinned to P3 per `RUBRIC.md`. |
| **К3** (epic; informational lint warnings) | — | Clear informational linter warnings after functional contour stable. | P3 | — | Pinned to P3 per `RUBRIC.md`. |

_No queue row assigns a cosmetic or К-backlog item above `P3`; therefore no `CONCERN: cosmetic escalation attempt` annotations apply._

## Validation

| Metric | Value |
| --- | ---: |
| Registry finding rows total (`guest` + `traveler` + `guide` + `admin`) | 75 |
| Registry route cells covered by at least one `Finding-IDs` cell in the **Ordered queue** section above | 75 |
| Explicitly excluded from this queue (epic carry-over, not registry rows) | 2 (`К4`, `К5`) |
| Additional epic-only queue rows (not counted as registry orphans) | 5 (`К1`, `К2.1`, `К2.2`, `К2.3`, `К3`) |
| Orphaned registry `route` values (present in registry tables but absent from covered **and** absent from excluded sets) | **0** |

**Coverage check:** every registry `route` value from the four Stage 1 tables appears either in a consolidated multi-ID row (`P0`–`P2` priority rows) or in exactly one `P3` single-ID row in the ordered queue. `К4` and `К5` are excluded by plan and are not registry `route` keys.
