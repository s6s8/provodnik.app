# Scan: Test Coverage + Server Actions/Forms

Scope: read-only scan of Next.js + Supabase app. Generated 2026-07-03.

## A. TEST COVERAGE

### Unit tests (vitest) — inventory
~170 `*.test.ts(x)` files. Heavy coverage of UI components (`src/components/**`, `src/features/**/components`) and data/domain logic. State machines are well tested.

Domain coverage map (domain → covered? → representative file):
| Domain | Covered | Files |
|---|---|---|
| Bookings (state machine) | YES | `src/lib/bookings/__tests__/state-machine.test.ts`, `src/lib/supabase/bookings.test.ts`, `src/features/bookings/actions/submitRequest.test.ts` |
| Offers | YES | `src/lib/supabase/offers.test.ts`, `src/features/messaging/actions/offerActions.test.ts`, `src/features/guide/offer-actions.test.ts` |
| Disputes | YES | `src/lib/supabase/disputes.test.ts`, `src/features/disputes/actions/openDispute.test.ts`, `resolveDisputeThread.test.ts` |
| Reviews | YES | `src/lib/supabase/reviews.test.ts`, `src/lib/reviews/state-machine.test.ts`, `submitReview.test.ts`, `submitReply.test.ts` |
| Requests | YES | `src/lib/requests/state-machine.test.ts`, `src/lib/supabase/__tests__/requests.test.ts`, `create-request-actions.test.ts`, `join-request-action.test.ts`, `owner-request-actions.test.ts` |
| Auth (app-level) | PARTIAL | `src/lib/auth/*.test.ts` (access-token-claims, admin-access, role-routing, safe-redirect, server-auth, viewer-role-*). Sign-up: `src/features/auth/tests/sign-up.test.ts` |
| Admin | PARTIAL | `admin/bookings/actions.test.ts`, `admin/users/actions.test.ts`, `admin/guides/[id]/actions.test.ts`, `features/admin/actions/moderate*.test.ts` |
| Moderation | YES | `src/lib/moderation/state-machine.test.ts`, `src/lib/supabase/moderation.test.ts` |
| Storage/uploads | YES | `src/lib/storage/upload.test.ts`, `client-upload.test.ts`, `__tests__/buckets.test.ts` |
| Notifications/email | YES | `src/lib/notifications/*.test.ts`, `src/lib/email/*.test.ts` |
| Profile/verification | YES | `features/profile/**`, `features/guide/verification-actions.test.ts` |

### src/lib/supabase — data-access coverage
Covered: bookings, conversations, disputes, expiry, listings, moderation, offers, payment-agreements, reviews, server, traveler-requests, plus `__tests__/{conversations,requests}.test.ts`.
NO dedicated test: `admin.ts`, `admin-users.ts`, `client.ts`, `middleware.ts`, `qa-threads.ts`, `request-members.ts`, `requests.ts` (only `__tests__/requests.test.ts` covers request queries), `requests-public.ts`, `listing-schema.ts`, `*.types.ts`.

### UNTESTED / thin critical areas
- **RLS / DB policies: NO automated coverage.** No SQL/policy tests; RLS enforcement is assumed, never asserted. Data-access unit tests mock Supabase, so row-level authorization is untested.
- **Admin data layer** `admin.ts` / `admin-users.ts` (privileged service-role client) — no direct tests; only action-level tests above.
- **Supabase middleware / session refresh** (`middleware.ts`, `client.ts`) — untested.
- **qa-threads / request-members / requests-public** query modules — untested.
- **End-to-end money/booking lifecycle** — only unit-level state-machine coverage; no integrated multi-actor run (see E2E below).

### E2E / walkthrough
Configs:
- `playwright.config.ts` → `testDir: ./tests/e2e`, single chromium worker, webServer `bun run dev`.
- `playwright.walkthrough.config.ts` → `testDir: ./tests/walkthrough`, baseURL `https://provodnik.app` (runs against PROD).

Flows / specs:
| Spec | Flow | Reliability |
|---|---|---|
| `tests/e2e/request-first-smoke.spec.ts` | auth page hygiene, /tours redirect, mobile menu, guest request-first validation | REAL assertions (`expect`), runs. Reliable smoke. |
| `tests/e2e/homepage-spacing.spec.ts` | homepage layout | UI smoke |
| `tests/e2e/tripster-v1/01-create-listing` | guide creates listing | GATED-OFF |
| `.../02-send-request` | traveler sends booking request | GATED-OFF |
| `.../03-offer-flow` | guide offer flow | GATED-OFF |
| `.../04-booking-confirm` | traveler accepts offer + confirm | GATED-OFF |
| `.../05-review-reply` | review + reply | GATED-OFF |
| `.../06-dispute-flow` | dispute open/resolve | GATED-OFF |
| `tests/walkthrough/2026-05-24-gap-closure.spec.ts` | screenshot walkthrough vs prod | Mostly screenshots; only ~6 `expect()` across file — visual, not behavioral. |

**E2E reliability verdict: MISLEADING / effectively zero for the core marketplace lifecycle.**
- The entire `tripster-v1/` suite (the only end-to-end coverage of create-listing → request → offer → booking → review → dispute) is guarded by `test.skip(!E2E_READY, ...)`. `E2E_READY` is false unless `QA_SEED_PASSWORD` is set, so these pass-by-skipping in CI/local by default.
- File header comments admit spec rot: hard-coded credentials/testids that don't match the seed (ERR-059). Even when enabled they contain conditional `test.skip()` mid-body (skip when a locator isn't visible) — so a broken UI produces a SKIP, not a FAILURE. These are green-by-construction, not a safety net.
- Walkthrough suite targets live prod and is screenshot-first (6 assertions total) — a visual diff aid, not a regression gate.

## B. SERVER ACTIONS & FORMS

### Inventory
`'use server'` files: **51** (grep `use server` in src). Predominantly **colocated per feature** (`src/features/*/actions/*` and `src/features/*/*-actions.ts`) and per-route (`src/app/**/actions.ts`). Central utility only: `src/lib/actions/create-action.ts` (the wrapper) — no central action registry.

Approx grouping:
- `src/app/**/actions.ts` route-level: ~14 (account, admin bookings/disputes/guides/users, auth forgot-password, booking dispute/review, guide bookings/calendar/inbox, messages, requests, avatar-action).
- `src/features/**` feature-level: ~35 (bookings, disputes, reviews, requests, guide offer/profile/verification, messaging offers, profile, favorites, referrals, partner, admin moderate, auth signUp, traveler qa).

### ActionResult contract adoption
- `src/lib/actions/create-action.ts` defines `ActionResult<T> = {ok:true;data:T} | {ok:false;error:string}` + `createAction(schema, handler)` wrapper (zod safeParse → run → never throw → Sentry).
- **Adoption of the `createAction` wrapper: ~0%.** `createAction` is imported/used ONLY by its own test; no product action uses it.
- Return shapes are **ad-hoc/hand-rolled**. Grep of `return { ... }` in `src/features` finds: `ok` key ~46, `error` key ~77, `success` key ~26 occurrences. So two competing conventions coexist: `{ok:true|false, error}` (loosely matches ActionResult shape but built by hand, and often with extra data keys like `{ok:true, regions}`, `{ok:true, status}`) AND `{success, error}`. `ActionResult` type is referenced in only ~2 non-test files.
- Verdict: the standard contract exists but is **not enforced or adopted**; error handling / validation / Sentry wrapping is reimplemented per-action inconsistently.

### Forms: React Hook Form + Zod
- RHF used in ~6 components; `zodResolver` in ~5. Most forms are NOT RHF (server-action + native form / manual state dominate).
- Zod schema locations (canonical): `src/data/*/schema.ts` — admin-users, guide-listing, guide-offer, listing-days, listing-meals, listing-tariffs, listing-tour-departures, review-replies, reviews, traveler-request. These are the shared/tested schemas (`schema.test.ts`, `map.test.ts`).
- Additional inline `z.object` scattered across `src/lib/supabase` (7), `src/features/**` (bookings, profile/actions, requests, guide, reviews/components), `src/lib/storage`, `src/lib/notifications`.
- **Validation sharing is inconsistent:** some domains share a `src/data/*/schema.ts` between action and form; many actions declare inline zod schemas locally, so validation is partially duplicated rather than a single source of truth. No `features/*/validation.ts` convention exists except `src/features/profile/validation/anti-contact.ts`.

### File upload pattern — CONFIRMED presigned-URL-via-Server-Action
- Server side: `src/lib/storage/upload.ts`
  - `getPresignedUploadUrl(bucket, fileName, mimeType)` → validates via zod, asserts MIME allowed, builds owner-scoped path `${userId}/${uuid}.${ext}`, calls `supabase.storage.from(bucket).createSignedUploadUrl(path)` with the admin client; returns `{path, token, signedUrl}`.
  - `confirmUpload({...})` → re-validates, asserts size/kind/path-owner/mime, upserts `storage_assets` row.
- Client side: `src/lib/storage/client-upload.ts` `uploadFileToSignedUrl({signedUrl, file})` parses the signed URL and calls `.uploadToSignedUrl(path, token, file)`.
- Server action entrypoint: `src/features/guide/verification-actions.ts` (`"use server"`) calls `getPresignedUploadUrl` then `confirmUpload`. Consumed by `src/features/guide/components/verification/document-upload-card.tsx`. Also referenced in `src/app/(protected)/admin/guides/[id]/page.tsx`, `src/lib/supabase/moderation.ts`.
- Covered by tests: `upload.test.ts`, `client-upload.test.ts`.

## REFACTOR-SAFETY VERDICT (per risky area)
| Refactor area | Safe? | Why |
|---|---|---|
| UI component / design-system refactor | SAFE-ISH | Large component + snapshot test base; walkthrough screenshots help. |
| State machines (booking/request/review/moderation) | SAFE | Strong dedicated unit tests. |
| Data-access modules WITH tests (bookings/offers/disputes/reviews/listings) | MOSTLY SAFE | Unit tests exist but mock Supabase; behavior yes, authorization no. |
| **RLS / authorization / role gating** | UNSAFE | No RLS/policy tests; E2E multi-actor lifecycle skipped. Any change to policies, service-role usage, or `admin.ts`/`middleware.ts` is unverified. |
| **Core marketplace lifecycle (request→offer→book→review→dispute) integration** | UNSAFE | Only tripster-v1 E2E covers it and it is skip-gated + spec-rotted. No green E2E proves the happy path. |
| **Standardizing action return contract (adopt createAction/ActionResult)** | UNSAFE without tests first | ~0% adoption, 3 competing return shapes; many actions untested at unit level for error branches. Callers depend on ad-hoc keys (`success`, extra data keys). |
| **Zod schema consolidation** | MEDIUM | `src/data/*/schema.ts` tested; inline feature/action schemas duplicated & partly untested. |
| Upload pipeline refactor | SAFE-ISH | upload.ts/client-upload.ts unit-tested; but no E2E of real upload. |

## RECOMMENDATION
Before any refactor touching authorization, the action contract, or the booking lifecycle: (1) un-rot and un-skip the `tripster-v1` E2E suite (fix seed creds/testids, wire `QA_SEED_PASSWORD`), (2) add RLS/policy tests, (3) add unit tests for admin/middleware supabase modules and for action error branches, before migrating actions to `createAction`.
