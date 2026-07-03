# Whole-app cleanup/refactor planning — prompt-engineered Opus task packet

You are Claude Opus working in `/tmp/provodnik-opus-refactor-plan` on branch `opus/refactor-plan-20260702`, based on production main commit `28b92058`.

This is a **read-only architecture/planning task**. Do not edit product code. You may write only under:

- `docs/architecture/refactor-plan-20260702/`

## Meta-goal

The owner wants a top-tier plan to rewrite/refactor the Provodnik app so it is modular, clean, streamlined, maintainable, and free of accumulated garbage — **without losing any existing functionality**.

Before scanning/planning, act as a top 0.1% prompt engineer and Claude `/goal` engineer: refine this task into a stronger execution prompt, save it, then execute that refined prompt yourself.

## Required sequence

### Step 1 — Prompt engineering pass

Write `docs/architecture/refactor-plan-20260702/REFINED_PROMPT.md`.

It must transform the owner request into a rigorous Claude `/goal`-ready refactor-planning prompt with:

- measurable objective;
- non-loss-of-functionality guardrails;
- source-of-truth files;
- route/feature inventory requirements;
- architecture analysis requirements;
- Context7 research requirements;
- risk matrix;
- migration strategy;
- phased plan;
- verification gates;
- deliverable contract;
- explicit “do not code now” boundary.

Then execute the refined prompt in the same session.

### Step 2 — Whole-codebase scan

Read source and map current architecture:

- route tree under `src/app`;
- feature modules under `src/features`;
- shared components under `src/components`;
- data/service/query layers under `src/data`, `src/lib/supabase`, `src/lib`;
- auth/role/access control;
- Supabase schema/migrations/RLS/RPCs;
- tests and E2E/walkthrough scripts;
- design-system/tokens/components;
- forms/validation/server actions;
- messaging/bookings/requests/offers/reviews/disputes/notifications;
- admin and moderation surfaces;
- dead/legacy/dev/demo code;
- terminology/product copy drift;
- package/dependency sprawl;
- file/module boundaries and duplication.

### Step 3 — Use Context7

Use Context7 to ground recommendations in current docs/patterns for:

- Next.js App Router / Server Actions / caching/revalidation patterns;
- Supabase SSR / RLS / RPC / typed clients / auth best practices;
- React 19 patterns if relevant;
- Playwright testing strategy if relevant;
- TanStack Query if relevant.

In the plan, cite the library/topic and what recommendation it supports. Do not include massive docs dumps.

### Step 4 — Preserve functionality inventory

Before recommending deletion/rewrites, build a functionality ledger:

- Public discovery: home, guides, destinations, requests, listings, static/policy pages.
- Auth: login, signup, forgot/update password, redirects.
- Traveler: profile/account, trips/requests, messages, notifications, favorites/referrals if kept.
- Guide: onboarding/profile/documents, inbox/offers, listings, bookings, calendar, reviews, stats, settings.
- Admin: dashboard, users, guides verification, listings moderation, disputes, bookings, audit.
- Shared domain: request-first flow, guide offers, bookings, reviews, disputes, notifications, messaging.
- Security: RLS, role layouts, server actions, public/private data boundaries.

Every proposed refactor must state which functionality it preserves and how it is verified.

### Step 5 — Identify garbage and risk

Classify findings:

- duplicate code/components;
- data/query logic in wrong layers;
- app-layer security that should be RLS/RPC;
- direct table access that should be service/RPC;
- stale dev/demo routes;
- misleading tests or missing tests;
- feature flags/nav mismatch;
- UI copy/terminology drift;
- over-broad components;
- dead dependencies;
- routes/components with no owner or no acceptance tests.

For each, distinguish:

- safe to delete now;
- safe to consolidate after tests;
- dangerous to touch until coverage exists;
- must be rewritten behind compatibility adapter.

### Step 6 — Produce the refactor plan

Write these deliverables:

1. `docs/architecture/refactor-plan-20260702/APP_INVENTORY.md`
   - Route/feature/module inventory.
   - Ownership boundaries.
   - Current risk hotspots.

2. `docs/architecture/refactor-plan-20260702/CONTEXT7_NOTES.md`
   - Concise current-docs notes and what they justify.

3. `docs/architecture/refactor-plan-20260702/REFACTOR_PLAN.md`
   - Executive summary.
   - Target architecture.
   - Module boundaries.
   - Data layer/RLS/RPC strategy.
   - UI/design-system cleanup strategy.
   - Test strategy.
   - Deletion/consolidation list.
   - Phased migration plan with acceptance gates.
   - “Do not lose functionality” checklist.
   - Rollback/parallel-run strategy.

4. `docs/architecture/refactor-plan-20260702/EXECUTOR_GOALS.md`
   - A sequence of small Claude `/goal` task packets that can be dispatched one by one later.
   - Each goal must be bounded, independently verifiable, and non-destructive.
   - Include exact verification commands and expected artifacts.

5. `docs/architecture/refactor-plan-20260702/RISK_REGISTER.md`
   - Top architectural risks, likelihood/impact, detection method, mitigation.

6. `docs/architecture/refactor-plan-20260702/SHORT_OWNER_SUMMARY_RU.md`
   - Sanitized Russian owner-facing summary: no paths, no internal tool/model names, no secrets, no raw IDs.

## Hard constraints

- Do not edit app/product code.
- Do not run destructive commands.
- Do not push/deploy.
- Do not propose “big bang rewrite”. Prefer strangler/adapter phases with functionality parity.
- Do not recommend deleting anything unless you can name why it is safe or what coverage must exist first.
- Do not lose request-first product model.
- Do not collapse role-specific security boundaries.
- Do not weaken RLS/security in the name of convenience.

## Verification for the plan itself

Before finishing:

- Run read-only inventory commands only.
- If possible, run current tests/build to understand baseline, but do not block the plan solely on missing dependencies.
- Cross-check recommendations against actual files, not assumptions.
- Ensure every proposed phase has an acceptance check.
- Ensure the owner summary is sanitized and concise.

## Final return contract

Return:

- whether all six deliverables were written;
- top 5 refactor moves;
- top 5 risks;
- recommended first executor goal;
- any blockers or unknowns.
