# Route + Access-Control Inventory

Scan date: 2026-07-03. App: Next.js 16 App Router at `src/app`.
All routes are **Server Components** unless marked (Client). Auth "middleware" is Next.js 16 `proxy` at `src/proxy.ts` (matcher = all non-static paths).

Totals by audience: Public discovery **21**, Auth **3 pages + 1 route**, Traveler **8**, Guide **10**, Admin **12**, Shared/domain **5**, API **5 routes**, Dev **2**. (61 `page.tsx`, 5 `route.ts`, plus root + group layouts.)

---

## (a) Route table by audience

### Public discovery (no auth) — 21
| URL | Group | Dyn | File | Purpose |
|---|---|---|---|---|
| `/` | (home) | — | `(home)/page.tsx` | Landing / homepage |
| `/ai` | (home) | — | `(home)/ai/page.tsx` | Homepage AI request builder |
| `/form` | (home) | — | `(home)/form/page.tsx` | Homepage structured request form |
| `/guides` | (site) | — | `(site)/guides/page.tsx` | Guide discovery listing |
| `/guides/[slug]` | (site) | slug | `(site)/guides/[slug]/page.tsx` | Public guide profile |
| `/guide/[id]` | (site) | id | `(site)/guide/[id]/page.tsx` | Legacy guide profile → `permanentRedirect` to `/guides/[slug]` |
| `/destinations` | (site) | — | `(site)/destinations/page.tsx` | Destinations index |
| `/destinations/[slug]` | (site) | slug | `(site)/destinations/[slug]/page.tsx` | Destination detail |
| `/listings` | (site) | — | `(site)/listings/page.tsx` | Public listing catalog (flag `FEATURE_PUBLIC_CATALOG`) |
| `/listings/[id]` | (site) | id | `(site)/listings/[id]/page.tsx` | Listing detail |
| `/requests` | (site) | — | `(site)/requests/page.tsx` | **Public** open-requests marketplace (`getOpenRequests`) |
| `/requests/[requestId]` | (site) | requestId | `(site)/requests/[requestId]/page.tsx` | Public request detail; viewer role resolved via `viewerRoleForRequest` |
| `/become-a-guide` | (site) | — | `(site)/become-a-guide/page.tsx` | Guide recruitment landing |
| `/for-business` | (site) | — | `(site)/for-business/page.tsx` | B2B landing |
| `/how-it-works` | (site) | — | `(site)/how-it-works/page.tsx` | Marketing |
| `/help` | (site) | — | `(site)/help/page.tsx` | Help center |
| `/trust` | (site) | — | `(site)/trust/page.tsx` | Trust & safety |
| `/policies/cookies` | (site) | — | `(site)/policies/cookies/page.tsx` | Legal |
| `/policies/offer` | (site) | — | `(site)/policies/offer/page.tsx` | Legal |
| `/policies/privacy` | (site) | — | `(site)/policies/privacy/page.tsx` | Legal |
| `/policies/terms` | (site) | — | `(site)/policies/terms/page.tsx` | Legal |

### Auth — 3 pages + 1 route
| URL | Group | File | Purpose |
|---|---|---|---|
| `/auth` | (auth) | `(auth)/auth/page.tsx` | Login / signup |
| `/auth/forgot-password` | (auth) | `(auth)/auth/forgot-password/page.tsx` | Request password reset |
| `/auth/update-password` | (auth) | `(auth)/auth/update-password/page.tsx` | Set new password |
| `/auth/confirm` | (auth) | `(auth)/auth/confirm/route.ts` | `verifyOtp` email-link handler → redirect |

### Traveler (role: traveler) — 8
| URL | Dyn | File | Guard | Purpose |
|---|---|---|---|---|
| `/trips` | — | `(protected)/trips/page.tsx` | proxy + `trips/layout.tsx` | Traveler dashboard |
| `/bookings/[bookingId]` | bookingId | `(protected)/bookings/[bookingId]/page.tsx` | proxy (`/bookings` prefix) + page | Booking detail |
| `/bookings/[bookingId]/dispute` | bookingId | `.../dispute/page.tsx` | proxy + page | Open dispute |
| `/bookings/[bookingId]/review` | bookingId | `.../review/page.tsx` | proxy + page | Leave review |
| `/disputes/[id]` | id | `(protected)/disputes/[id]/page.tsx` | **page-only** (`getUser`) | Traveler dispute detail (flag `FEATURE_TR_DISPUTES`) |
| `/favorites` | — | `(protected)/favorites/page.tsx` | **page-only** (`getUser`) | Saved favorites (flag `FEATURE_TR_FAVORITES`) |
| `/referrals` | — | `(protected)/referrals/page.tsx` | **page-only** (`getUser`) | Referrals (flag `FEATURE_TR_REFERRALS`) |
| `/listings/[id]/book` | id | `(protected)/listings/[id]/book/page.tsx` | **page-only** (`getUser`) | Booking flow (flag `FEATURE_PUBLIC_CATALOG`) |

### Guide (role: guide) — 10
| URL | Dyn | File | Purpose |
|---|---|---|---|
| `/guide` | — | `(protected)/guide/page.tsx` | Guide dashboard |
| `/guide/bookings` | — | `.../guide/bookings/page.tsx` | Guide bookings |
| `/guide/bookings/[bookingId]` | bookingId | `.../guide/bookings/[bookingId]/page.tsx` | Guide booking detail |
| `/guide/calendar` | — | `.../guide/calendar/page.tsx` | Availability calendar |
| `/guide/inbox` | — | `.../guide/inbox/page.tsx` | Guide inbox |
| `/guide/listings` | — | `.../guide/listings/page.tsx` | Manage listings |
| `/guide/profile` | — | `.../guide/profile/page.tsx` | Edit public profile |
| `/guide/reviews` | — | `.../guide/reviews/page.tsx` | Reviews received |
| `/guide/settings/contact-visibility` | — | `.../guide/settings/contact-visibility/page.tsx` | Contact-visibility settings |
| `/guide/stats` | — | `.../guide/stats/page.tsx` | Performance stats |

All guide routes guarded by proxy (`/guide` prefix → role `guide`) **and** `(protected)/guide/layout.tsx`.

### Admin (role: admin) — 12
| URL | Dyn | File |
|---|---|---|
| `/admin` | — | `(protected)/admin/page.tsx` |
| `/admin/dashboard` | — | `.../admin/dashboard/page.tsx` |
| `/admin/audit` | — | `.../admin/audit/page.tsx` |
| `/admin/bookings` | — | `.../admin/bookings/page.tsx` |
| `/admin/disputes` | — | `.../admin/disputes/page.tsx` |
| `/admin/disputes/[caseId]` | caseId | `.../admin/disputes/[caseId]/page.tsx` |
| `/admin/guides` | — | `.../admin/guides/page.tsx` |
| `/admin/guides/[id]` | id | `.../admin/guides/[id]/page.tsx` |
| `/admin/listings` | — | `.../admin/listings/page.tsx` |
| `/admin/moderation` | — | `.../admin/moderation/page.tsx` |
| `/admin/users` | — | `.../admin/users/page.tsx` |
| `/admin/users/[id]` | id | `.../admin/users/[id]/page.tsx` |

Guarded by proxy (`/admin` → role `admin`, but see risk #1) **and** `(protected)/admin/layout.tsx`. Admin data uses **service-role** client (`createSupabaseAdminClient`, `src/lib/supabase/admin.ts`) which **bypasses RLS**.

### Shared / domain (any authenticated role) — 5
| URL | Dyn | File | Guard | Purpose |
|---|---|---|---|---|
| `/account` | — | `(protected)/account/page.tsx` | **page-only**; redirects by role | Account settings hub |
| `/account/notifications` | — | `(protected)/account/notifications/page.tsx` (Client) | `notFound()` (disabled) | Stub, always 404 |
| `/messages` | — | `(protected)/messages/page.tsx` | **page-only** (`readAuthContext`) | Messages inbox |
| `/messages/[threadId]` | threadId | `(protected)/messages/[threadId]/page.tsx` | **page-only** (`getUser`) | Message thread |
| `/notifications` | — | `(protected)/notifications/page.tsx` | **page-only** (`readAuthContext`) | Notifications |

### API — 5 routes
| URL | Method | File | Auth |
|---|---|---|---|
| `/api/auth/signout` | POST | `api/auth/signout/route.ts` | none needed (signOut) |
| `/api/messages/threads` | GET | `api/messages/threads/route.ts` | `getUser` → 401 |
| `/api/messages/threads/[threadId]` | GET | `api/messages/threads/[threadId]/route.ts` | `getUser` → 401 |
| `/api/messages/unread-count` | GET | `api/messages/unread-count/route.ts` | `getUser` → 401 |
| `/api/requests/parse` | POST | `api/requests/parse/route.ts` | **NO auth**; rate-limit + global budget only |

### Dev / demo — 2
| URL | File | Guard |
|---|---|---|
| `/dev/req-cards` | `dev/req-cards/page.tsx` | `notFound()` if `NODE_ENV==="production"` (line 283) |
| `/dev/guide-templates-wireframe` | `dev/guide-templates-wireframe/page.tsx` | `notFound()` if `NODE_ENV==="production"` (line 367) |

Layouts: root `app/layout.tsx`; group `(auth)/layout.tsx` (passthrough), `(home)/layout.tsx` (passthrough), `(site)/layout.tsx` (header/footer, no auth), `(site)/policies/layout.tsx`; protected `(protected)/layout.tsx`, `(protected)/trips/layout.tsx`, `(protected)/guide/layout.tsx`, `(protected)/admin/layout.tsx`.

---

## (b) Access-control model

Two enforcement layers run on every protected request:

1. **Edge proxy** (`src/proxy.ts`, Next 16 `proxy`, matcher = all non-static). `getRequiredRoleForPathname` (`src/lib/auth/role-routing.ts:40`) maps ONLY these prefixes to a required role: `/guide/profile`→guide, `/trips` `/bookings` `/traveler`→traveler, `/guide`→guide, `/admin`→admin. For matched paths it calls `supabase.auth.getUser()`, then reads canonical role from **`profiles.role`** (`proxy.ts:83`, JWT `app_metadata.role` only as fallback / admin grant — see `resolveCanonicalRole` `role-routing.ts:85` and `AP-038` note). It checks `account_status==="active"` (`proxy.ts:93`) and `roleHasAccess` (strict: exact match or admin, `role-routing.ts:77`). Non-matching paths pass through with only a session refresh.
2. **Server layouts** re-verify via `readAuthContextFromServer` (`src/lib/auth/server-auth.ts`, also `profiles.role`-canonical): `trips/layout.tsx` requires role `traveler`; `guide/layout.tsx` requires `roleHasAccess(role,"guide")`; `admin/layout.tsx` requires `role==="admin" && account_status==="active"` and **renders an inline "access denied" panel instead of redirecting** (`admin/layout.tsx:61`). The base `(protected)/layout.tsx` only checks account suspension — it does **not** require authentication.

**Role gating is app-layer, not RLS**, for admin (service-role client bypasses RLS) and for many traveler/shared pages that self-guard in the page body. Traveler/guide public data still relies on Supabase RLS + `getUser`. **Demo mode**: when `hasSupabaseEnv()` is false, a `DEMO_SESSION_COOKIE` supplies the role (proxy `getDemoRoleFromRequest`, server-auth `demoAuthContext`); demo cookies are ignored once real Supabase env is present.

---

## (c) Access-control risks / oddities

1. **Admin proxy check is intentionally soft (allow-through).** In `proxy.ts:57-60` and `:107-111`, when `requiredRole==="admin"` and the user lacks access, the proxy returns `NextResponse.next()` instead of redirecting, deferring to `admin/layout.tsx` which renders `AdminAccessDenied`. Admin authorization therefore rests **entirely on the layout**; any admin page that ever renders without that layout (or a future direct data fetch) would be unguarded. Combined with the **service-role client bypassing RLS** (`src/lib/supabase/admin.ts:5`, used throughout `moderation.ts`), there is **no DB-level backstop** for admin data.

2. **Many `(protected)` routes are NOT matched by the proxy and self-guard in the page only.** `getRequiredRoleForPathname` matches just `/trips`,`/bookings`,`/guide`,`/admin` (`role-routing.ts:40-59`). `/account`, `/favorites`, `/referrals`, `/disputes/[id]`, `/messages`, `/messages/[threadId]`, `/notifications`, `/listings/[id]/book` get **no proxy role check and no auth check in `(protected)/layout.tsx`** — each page must call `getUser`/`readAuthContext` itself. They currently do, but the guard is per-page and easy to forget on new pages in this group.

3. **`(protected)/layout.tsx` does not enforce authentication** — only account-suspension (`layout.tsx:14`). The group name implies protection it does not provide; protection is delegated to nested layouts / individual pages.

4. **`/api/requests/parse` has no authentication** (`api/requests/parse/route.ts:27`) — an unauthenticated public POST that invokes the OpenRouter LLM. Protected only by IP rate-limit (20/60s) and a global spend budget; abusable for cost/DoS if rate-limit backend is weak.

5. **Public `/requests` marketplace exposes traveler request data** (`(site)/requests/page.tsx`, `getOpenRequests`) with no auth guard; sensitivity depends solely on what RLS/`requests-public` exposes. Related: `/requests/[requestId]` computes viewer role and member-gated data client-of-RLS — worth confirming contact/PII fields are RLS-filtered for anonymous viewers.

Minor: `/account/notifications` is a dead `notFound()` stub; `/guide/[id]` is a legacy `permanentRedirect`; dev routes rely only on `NODE_ENV==="production"` (a misconfigured non-prod deploy would expose them).
