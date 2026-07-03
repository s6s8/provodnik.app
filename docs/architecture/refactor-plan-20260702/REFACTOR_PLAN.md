# REFACTOR_PLAN.md — Provodnik cleanup & modularization

Base: `main @ 28b92058` · 2026-07-03 · Planning only (no code edits in this task).
Companions: `APP_INVENTORY.md`, `CONTEXT7_NOTES.md`, `RISK_REGISTER.md`, `EXECUTOR_GOALS.md`.

---

## 1. Executive summary

Provodnik is a **healthy, live** request-first guide marketplace, not a rewrite candidate. The code
works; what has accumulated is **structural drift**, not rot:

- **The data layer has three competing conventions.** The intended rule ("all Supabase I/O in
  `src/lib/supabase/<domain>.ts`, `src/data/` static-only") is followed by only **28% of table access**;
  72% lives in features/app/`src/data`. 8 I/O modules sit in the static layer (incl. `'use client'`
  browser **writes**), and nothing lints the boundary.
- **There is no refactor safety net.** The only end-to-end lifecycle suite is skip-by-default and
  green-by-construction; RLS has zero tests. This is the single biggest blocker — **coverage must come
  before code motion.**
- **Security is mostly sound but has sharp edges:** public `traveler_requests` PII exposure, admin authz
  that is app-layer-only (service-role bypasses RLS), an unauthenticated LLM endpoint, and an anon
  `WITH CHECK (true)` insert.
- **Cruft is real but bounded:** dead component clusters, 4 removable deps, 6 permanently-off flags, 2
  god components (~1000 LOC), and heavy terminology drift (4 nouns for the sellable unit).

**Strategy: strangler, not big-bang.** Enforce boundaries and add coverage first, then move code
domain-by-domain behind a lint gate, harden RLS, and standardize the form/action contract — each phase
independently shippable and reversible. **No user-facing behavior changes** except deliberate, tested
terminology unification.

## 2. Target architecture

Converge on the already-documented convention (`feature-structure.md`) and make it enforced, not aspirational:

```
src/app/        routes, layouts, route handlers, thin server-action entry points
src/features/   feature UI + feature actions + hooks/types/validation  (one dir standard)
src/lib/        infra: supabase clients, auth, env, money, dates, pii, actions wrapper, query-keys, api
src/lib/supabase/<domain>.ts   ← THE single home for all Supabase I/O (typed client in, no .from() elsewhere)
src/data/       STATIC ONLY: constants, types, zod schemas (interests, languages, money, */schema.ts)
src/components/ ui/ (shadcn primitives) + shared/ (app chrome)
```

**Dependency direction (one-way, lint-enforced):** `app → features → {lib, data, components}`.
`lib`/`data` never import `features`. Features integrate only via `features/shared` (which must be
populated, not empty).

**Non-goals:** no framework swap, no new state library, no design-system replacement, no schema
redesign. Tailwind v4 + shadcn/ui and Supabase RLS stay.

## 3. Module boundaries (target ownership)

- **Discovery** — `features/{homepage,destinations,listings,requests(public)}` read via
  `lib/supabase/{public-guides,public-listings,requests-public}`. Merge `homepage` + `homepage-classic`
  into one `homepage` feature with `/ai` as a variant.
- **Auth** — `features/auth` + `lib/auth` + `proxy.ts` + RLS role helpers. Single source of role truth:
  `profiles.role` via SECURITY DEFINER helpers (already the case; keep).
- **Traveler** — `features/{traveler,requests,bookings,reviews,disputes,messaging,notifications,favorites,
  referrals}`.
- **Guide** — `features/guide` **decomposed** into sub-areas (inbox/bids, excursions, verification,
  profile, calendar, stats) — it is 64 files today.
- **Admin** — `features/admin` + `lib/supabase/{admin,admin-users,moderation}`.
- **Shared domain engine** — the request→offer→booking→review→dispute→notification→messaging lifecycle
  lives in `lib/supabase/*` + SECURITY DEFINER RPCs + `lib/*/state-machine.ts`. This is the product core;
  treat it as an API other features consume.

## 4. Data layer / RLS / RPC strategy

**4a. One data convention (Context7 note 2).**
- Move the 8 mislocated I/O modules from `src/data/*` into `src/lib/supabase/<domain>.ts`, incrementally,
  each behind parity tests. Priority order by blast radius: `data/supabase/queries.ts` (35 `.from`) →
  `data/reviews/supabase.ts` / `data/notifications/supabase.ts` (triple-layered) → `guide-offer` →
  `guide-assets` / `guide-templates` (browser clients → server + presigned pattern) → `marketplace-events`.
- Collapse triple-layered domains (reviews, notifications, requests) to **one service module + one
  state-machine module + static schema**. No domain served from two I/O layers.
- Relocate `src/lib/data/countries.ts` → `src/data/`.
- Every service function takes a typed `SupabaseClient<Database>` argument.

**4b. Enforce the boundary (do this in Phase 1, before moving code).**
- Add eslint `no-restricted-syntax`/`no-restricted-imports` forbidding `createSupabaseServerClient`,
  `createBrowserClient`, and `.from(`/`.rpc(` inside `src/data/**` and `src/components/**`. Add to
  `.eslint-baseline.json` ratchet so existing offenders are grandfathered and no new ones appear.

**4c. Push app-layer scoping into RLS/RPC (Context7 note 2).**
- The 26 inline `.eq(...)` scopes in `app/(protected)/guide` and 15 in `/admin` should rely on RLS +
  `SECURITY DEFINER` participant/role helpers (`is_guide`, `is_admin`, `is_thread_participant`, etc. —
  already present). Remove app-layer-only filters **only after** confirming the equivalent policy exists
  and is tested.
- **Admin DB backstop:** add RLS admin-read policies (using `is_admin()`) so admin surfaces are not
  solely dependent on the service-role client + soft proxy. Keep service-role for writes that legitimately
  bypass RLS, but gate reads with policy where feasible.

**4d. Security fixes (tracked in RISK_REGISTER).**
- `traveler_requests` public SELECT → expose a **PII-safe view/policy** for anon (no traveler_id/notes);
  full row only to authenticated members/bidders. (R-03)
- `business_leads` anon `WITH CHECK (true)` → constrain columns/rate or route via authenticated RPC. (R-07)
- `/api/requests/parse` → add lightweight auth or signed-token + keep rate/budget caps. (R-06)
- Seed storage buckets + policies in migrations so publicness is not environment-drift. (R-08)

**4e. Cache/revalidation coherence (Context7 notes 1 & 4).**
- Introduce a per-domain **tag taxonomy** and call `revalidateTag`/`updateTag` from actions; route all
  TanStack keys through `src/lib/query-keys.ts` so server revalidation and client invalidation align.

## 5. UI / design-system cleanup

- **Delete dead component clusters** (see §7): `components/cards/*`, `components/traveler/{ListingCard,
  ListingGrid,FilterBar}`, dead `components/discovery/*`, `features/quality`, 9 unused shadcn primitives.
- **Consolidate card variants** to one `GuideCard`/`ListingCard`/`RequestCard` set in
  `components/shared` (or `listing-detail`), delete the rest.
- **Decompose god components** (request-detail 1013, booking-detail 984, bid-form 639, guide-excursions
  593, public-marketplace 520) into sub-components + hooks — behind existing component tests.
- **Terminology unification** (glossary decision required from owner): pick one noun each for
  sellable-unit (listing/tour/excursion), demand-unit (request/trip/заявка), guide-response (offer/bid/
  отклик), and brand (проводник vs гид). Apply as a **copy-only, tested** sweep — no route renames until
  redirects are in place.
- Keep AGENTS.md CSS rules (tailwind + shadcn only, tokens, no custom classes).

## 6. Test strategy (the enabling phase — Context7 note 5)

Coverage is the precondition for every code move. Build, in order:

1. **Playwright role fixtures**: a `setup` project that logs in traveler/guide/admin and writes
   `storageState` per role; test projects depend on it. Seed via `QA_SEED_PASSWORD` path (already exists,
   currently off).
2. **Critical-flow E2E (real assertions, not skips):** request create → guide offer → traveler accept →
   booking → review → dispute, plus auth redirects and role-gate denials. Replace the skip-by-default
   `tripster-v1` suite; delete or fix ERR-059 spec rot.
3. **RLS/authorization tests:** pgTAP or a Supabase test harness asserting anon cannot read PII from
   `traveler_requests`, non-owner cannot read others' bookings/offers, non-admin cannot hit admin surfaces.
   This is the only way to make data-layer moves safe.
4. **Contract tests** for `createAction`/`ActionResult` before migrating actions to it.

Gate: `bun run typecheck && bun run lint && bun run test:run && bun run playwright && bun run build` green,
with the new E2E/RLS suites **not skipped**.

## 7. Deletion / consolidation list (safety-tagged)

**SAFE-NOW** (provably unused / inert; still verify `grep` import-count = 0 at execution time):
- `src/components/cards/{guide-card,listing-card,request-card}.tsx` — 0 imports.
- `src/components/traveler/{ListingCard,ListingGrid,FilterBar}.tsx` — dead cluster (only import each other).
- `src/components/discovery/{FilterBar,IdentityRevealCard,SearchInput,StatStrip,TrustRibbon}.tsx` — 0 external imports.
- `src/features/quality/marketplace-quality-card.tsx` — 0 importers.
- 9 unused shadcn primitives: `booking-card, faq-accordion, form-step-section, kpi-card, radio-group,
  seat-progress-bar, section, toggle, what-happens-next`.
- Deps: `@fontsource-variable/inter`, `@fontsource/cormorant-garamond`, `@fontsource/geist-mono`,
  `@tanstack/react-query-devtools` (0 usage; layout uses `next/font/google`).
- 6 permanently-off, zero-reader flags: `FEATURE_TR_KPI, FEATURE_TR_REPUTATION, FEATURE_TR_PERIPHERALS,
  FEATURE_TR_HELP, FEATURE_TR_QUIZ, FEATURE_DEPOSITS`, plus orphaned `ROUTES`/`NAV_FLAG_BY_HREF` entries
  and `ROUTES.search`→nonexistent `/search`.
- `(home)/form/page.tsx` (redirect stub) and `/guide/[id]` legacy redirect — **keep the redirect** but
  collapse into config; delete only after confirming no inbound links.
- Root clutter → `git mv` to archive (NOT delete): `audits/`, `task-audit-2026-07-01/`, stale root
  `DECISIONS.md` (inverted homepage ADR). Leave `.cursor/.opencode/.design-sync` (tool configs).

**SAFE-AFTER-TESTS** (consolidate once coverage exists):
- `/dev/*` demo routes — prod-gated; delete after confirming no team reliance.
- Merge `homepage` + `homepage-classic` (needs home + `/ai` E2E first).
- Collapse triple-layered reviews/notifications/requests to one service each (needs domain tests).
- Migrate 8 `src/data/*` I/O modules to `lib/supabase/` (needs per-domain parity tests).
- Card-variant consolidation; god-component decomposition (needs component/E2E coverage).

**DANGEROUS — do not touch until coverage/owner exists:**
- RLS policies, SECURITY DEFINER functions, `proxy.ts`, `middleware.ts`, `admin.ts`/`admin-users.ts`.
- The request→offer→booking→review→dispute lifecycle logic.

**ADAPTER-REWRITE** (rewrite behind a compatibility adapter with parity tests):
- Client-side direct table writes in `data/guide-templates/supabase-client.ts` (×3) →
  server action + presigned pattern.
- `ActionResult` migration: introduce `createAction` behind existing action signatures, migrate callers
  domain-by-domain (0% adoption today, 3 return shapes — high callsite fan-out).

## 8. Phased migration plan with acceptance gates

Each phase is independently shippable and revertible. `VERIFY` = the phase acceptance gate.

**Phase 0 — Safety net (blocking prerequisite).**
Add Playwright role fixtures + real critical-flow E2E + RLS authorization tests + `ActionResult` contract
tests. No product code behavior change.
`VERIFY:` new E2E + RLS suites run **non-skipped** and green in `bun run playwright` / test harness; CI
fails if they are skipped.

**Phase 1 — Enforce boundaries (non-behavioral).**
Add the `src/data`/`components` I/O lint rule (ratcheted); add `query-keys.ts` factory; populate
`features/shared`. Delete all **SAFE-NOW** items; archive root clutter via `git mv`; remove 4 dead deps.
`VERIFY:` `bun run typecheck && bun run lint && bun run test:run && bun run build` green; bundle size ↓;
new eslint rule reports 0 new violations; app runs at 1280px & 375px with clean console.

**Phase 2 — Data-layer consolidation (strangler, per-domain).**
Move mislocated I/O modules into `lib/supabase/`, collapse triple-layered domains, relocate `countries.ts`.
One domain per PR; old path re-exports from new until callers move.
`VERIFY:` per domain — data-module tests + relevant E2E green; `grep '.from('` count in `src/data` &
`src/components` monotonically decreases toward 0; no behavior diff.

**Phase 3 — RLS hardening.**
Add admin-read RLS backstop; fix `traveler_requests` PII exposure (view/policy); constrain `business_leads`;
auth-gate `/api/requests/parse`; seed storage buckets/policies. Remove app-layer `.eq` scopes only where a
tested policy replaces them.
`VERIFY:` RLS test suite proves anon/non-owner/non-admin denials; existing flows still pass E2E; no
functional regression.

**Phase 4 — Forms/actions standardization.**
Migrate actions to `createAction`/`ActionResult`; share Zod schema between action + RHF resolver; adopt
`useActionState`/`useOptimistic`; wire `revalidateTag` per domain.
`VERIFY:` action tests green; ActionResult adoption metric ↑; form flows pass E2E; error branches tested.

**Phase 5 — UI decomposition + terminology.**
Decompose god components; consolidate card variants; apply the agreed glossary as a copy-only sweep with
redirects for any route rename.
`VERIFY:` component tests + visual walkthrough at 1280px & 375px; no dead links; redirects resolve.

## 9. "Do not lose functionality" checklist

Before merging any phase, confirm each ledger row still works (E2E or manual at 1280px & 375px):

- [ ] Public discovery: home (`/`), `/ai`, guides list+detail, destinations, listings, **public requests** render.
- [ ] Auth: login, signup, forgot-password, update-password, `/auth/confirm`, post-login role redirect.
- [ ] Traveler: `/trips`, create request, view offers, accept offer, booking detail, leave review, open
      dispute, messages, notifications, favorites, referrals.
- [ ] Guide: onboarding/verification upload, edit profile, inbox, submit bid/offer, counter-offer, manage
      listings, bookings, calendar, reviews received, stats, contact-visibility settings.
- [ ] Admin: dashboard, users (+detail, set account status), guides verification (+detail), listings
      moderation, disputes (+case), bookings, audit.
- [ ] Shared engine: request→offer→accept→booking→review→dispute→notification→messaging end to end.
- [ ] Security invariants: anon cannot read traveler PII; non-owner cannot read others' bookings/offers;
      non-admin blocked from admin; traveler identity hidden until offer accepted (initials only);
      contact-visibility respected; suspended accounts locked out.

## 10. Rollback / parallel-run strategy

- **Branch-per-phase, PR-per-domain**; every phase is a revertible commit. Never push to `main` without
  the SHIP_GATE (post-deployment-verification checklist, 1280px + 375px).
- **Strangler dual-path:** new `lib/supabase/<domain>` module first re-exports from the old location, so a
  bad move is reverted by flipping the re-export — callers don't change until the new path is proven.
- **Flag-guard risky UI** (homepage merge, terminology sweep) behind an existing flag so it can be turned
  off in production instantly.
- **DB changes are additive-first:** add new policy/view alongside the old, verify with RLS tests, then
  remove the old in a follow-up migration (never drop-then-add in one shot).
- **Parity gate:** a phase ships only when its acceptance `VERIFY` passes AND the §9 checklist rows it
  touches are green. If a regression appears post-deploy, revert the phase branch (site stays up).
