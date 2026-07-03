# REFINED PROMPT — Whole-app refactor planning (`/goal`-ready)

> This file is the output of Step 1 (prompt-engineering pass). It rewrites the owner's
> request into a rigorous, self-contained Claude `/goal` task packet. The same session
> then executes this refined prompt to produce the planning deliverables. **Planning only —
> no product-code edits.**

---

## ROLE

You are a staff-level software architect and Claude `/goal` engineer. You are producing a
**refactor/cleanup plan** for the Provodnik marketplace app (Next.js 16 App Router, React 19,
TypeScript, Supabase + RLS, TanStack Query, RHF+Zod, Tailwind v4 + shadcn/ui, bun). You do not
write product code in this task. You produce a plan another executor can follow safely.

## PRIME DIRECTIVE (measurable objective)

Deliver a plan that lets the team refactor Provodnik to be **modular, layered, and free of
accumulated cruft** while **preserving 100% of current user-facing functionality and every
security boundary**. The plan is "done" only when all of the following are objectively true:

1. All six deliverables (below) exist under `docs/architecture/refactor-plan-20260702/` and
   cross-reference each other.
2. Every route in `src/app` and every feature in `src/features` appears in the functionality
   ledger with an owner, an audience, and a "how parity is verified" note.
3. Every proposed deletion/consolidation/rewrite is tagged with one of four safety classes and
   states the coverage that must exist before it happens.
4. Every migration phase has an explicit **acceptance gate** (a command or check that proves the
   phase preserved behavior).
5. No phase is a "big-bang rewrite"; every phase is independently shippable and reversible.
6. Recommendations are grounded in **actual files** (path + evidence), not assumptions, and in
   **current library docs** via Context7 (cited by library + topic).

## NON-NEGOTIABLE GUARDRAILS (functionality + security must not regress)

- **Do not lose the request-first product model.** Traveler posts a request → guides send offers
  → traveler accepts → booking → (messaging, reviews, disputes). This flow is the product.
- **Do not collapse role-specific security boundaries** (traveler / guide / admin). Role layouts
  and per-role access must remain at least as strict as today.
- **RLS is the security boundary.** Never move a check from RLS/RPC into app-layer-only filtering.
  You may recommend moving app-layer checks *down into* RLS/RPC, never the reverse.
- **Do not weaken RLS, widen a `SECURITY DEFINER` surface, or expose PII** (traveler identity is
  hidden until an offer is accepted; contact-visibility rules must be preserved).
- **No secrets** in any deliverable. No `.env` values, no raw tokens, no service keys.
- **Read-only:** do not edit product code, run destructive commands, push, deploy, or mutate the DB.
- **Preserve public/private data boundaries** (published-only surfaces, initials-only until accept).

## SOURCE-OF-TRUTH FILES (read before recommending)

- `CLAUDE.md`, `.claude/CLAUDE.md`, `AGENTS.md` — rules, stack, commit/verify policy.
- `docs/architecture/feature-structure.md` — the **intended** layering + data-access convention
  (this is the target the refactor should converge on; measure drift against it).
- `.claude/sot/HOT.md`, `.claude/sot/INDEX.md`, `.claude/sot/ANTI_PATTERNS.md`,
  `.claude/sot/DECISIONS.md`, `.claude/sot/PATTERNS.md` — landmines and prior decisions
  (e.g. `AP-012` money.ts placement) that constrain what may move.
- `package.json`, `eslint.config.mjs`, `.eslint-baseline.json`, `scripts/lint-ratchet.mjs`,
  `next.config.ts`, `tsconfig.json`, `playwright*.config.ts`, `vitest.config.mts`.
- `supabase/` (migrations, config, seed) + `src/lib/supabase/database.types.ts`.

## REQUIRED ANALYSIS (evidence, not assumptions)

### A. Route / feature inventory
Enumerate every `page.tsx` / `route.ts` / `layout.tsx` under `src/app`, grouped by audience
(Public discovery, Auth, Traveler, Guide, Admin, Shared domain, API, Dev). For each: path,
server/client, purpose, and the access-control mechanism that gates it (layout guard / page
check / RLS). Enumerate every `src/features/<name>` with file count and whether it follows the
`actions/ components/ hooks/ types.ts validation.ts` standard.

### B. Architecture / layering analysis
Measure drift against `feature-structure.md`:
- I/O that lives in `src/data/*` (should be static-only) — every offender.
- Duplicated domains served from two layers (e.g. `src/data/reviews` vs `src/lib/supabase/reviews.ts`).
- `src/lib/data/*` — what it is and whether it duplicates.
- Direct `.from('table')` / `.rpc()` **outside** `src/lib/supabase` (app-layer data access).
- Cross-feature imports bypassing `features/shared`.
- "God" components (>300 lines), duplicated card/component variants.

### C. Data / security analysis
Tables, RLS coverage, `SECURITY DEFINER` functions (and what each bypasses), the request/offer/
booking/dispute state machines, storage buckets + policies. Flag RLS gaps, permissive policies,
and any app-layer check that should be RLS/RPC.

### D. Garbage / risk classification
Dead/dev/demo routes (`src/app/dev/*`), dead branches behind stale flags, nav↔route mismatches,
duplicate/parallel implementations (e.g. `homepage` vs `homepage-classic`, `(home)/ai`,
`(home)/form`), zero-import dependencies, terminology/copy drift, what `.eslint-baseline.json` +
ratchet are suppressing, root clutter.

### E. Test / coverage analysis
Map unit + E2E coverage by domain. Identify **critical untested domains** (offers, bookings,
disputes, auth redirects, RLS). Judge whether coverage is a reliable refactor safety net and which
refactors are unsafe until tests are added. Flag misleading/skipped tests.

### Context7 grounding (required)
Ground recommendations in current docs for: **Next.js App Router** (Server Actions,
`revalidatePath`/`revalidateTag`, RSC data fetching), **Supabase SSR** (`@supabase/ssr`,
RLS + `SECURITY DEFINER`, typed clients), **React 19** (`useActionState`/`useFormStatus`/
`useOptimistic`/`use`), **TanStack Query** (query-key factories, RSC hydration), **Playwright**
(role `storageState`, setup projects). Cite library + topic + the specific recommendation it
supports. **No large doc dumps.**

## SAFETY CLASSIFICATION (apply to every finding)

Tag each item exactly one of:
- **SAFE-NOW** — delete/change now; state *why* it is provably unused/safe.
- **SAFE-AFTER-TESTS** — consolidate only after named coverage exists.
- **DANGEROUS** — do not touch until coverage/owner exists; state the risk.
- **ADAPTER-REWRITE** — must be rewritten behind a compatibility adapter with parity tests.

## PRESERVE-FUNCTIONALITY LEDGER (build before proposing deletions)

Ledger rows across: Public discovery; Auth (login/signup/forgot/update/redirects); Traveler
(account, requests, messages, notifications, favorites/referrals); Guide (onboarding/profile/docs,
inbox/offers, listings, bookings, calendar, reviews, stats, settings/contact-visibility); Admin
(dashboard, users, guides verification, listings moderation, disputes, bookings, audit); Shared
domain (request→offer→booking→review→dispute→notifications→messaging); Security (RLS, role layouts,
server actions, public/private boundaries). Each row: what it does, where it lives, how parity is
verified. **Every proposed refactor must name which ledger rows it preserves and the verification.**

## MIGRATION STRATEGY (strangler, not big-bang)

Prefer strangler-fig / adapter phases. Each phase: bounded scope, functional parity, independent
ship, explicit rollback (revert branch / keep old path until parity proven / parallel-run). Order
by (safety × leverage): enforce boundaries and add coverage **before** moving code; do the
highest-risk data-layer moves only once tests exist.

## DELIVERABLE CONTRACT (write exactly these six)

1. `APP_INVENTORY.md` — route/feature/module inventory, ownership boundaries, current risk hotspots.
2. `CONTEXT7_NOTES.md` — concise current-docs notes + what each justifies (library + topic cited).
3. `REFACTOR_PLAN.md` — exec summary; target architecture; module boundaries; data/RLS/RPC strategy;
   UI/design-system cleanup; test strategy; deletion/consolidation list (safety-tagged); phased
   migration plan with acceptance gates; "do not lose functionality" checklist; rollback/parallel-run.
4. `EXECUTOR_GOALS.md` — ordered, bounded, independently-verifiable Claude `/goal` packets; each with
   exact verification commands and expected artifacts; non-destructive.
5. `RISK_REGISTER.md` — top architectural risks with likelihood/impact/detection/mitigation.
6. `SHORT_OWNER_SUMMARY_RU.md` — sanitized Russian owner summary: no paths, no internal tool/model
   names, no secrets, no raw IDs.

## VERIFICATION FOR THE PLAN ITSELF

- Use read-only inventory commands only; try baseline `typecheck`/`build` for context but do not
  block the plan on missing deps.
- Cross-check every claim against a real file (path + line where useful).
- Every phase has an acceptance check; every deletion has a safety class + coverage precondition.
- Owner summary is sanitized and short.

## EXPLICIT "DO NOT CODE NOW" BOUNDARY

This task ends at written plans. Do **not** move files, edit code, change schema, add tests, or
open a code PR as part of this task. Executor goals are for **later, separate** dispatches.

## `/goal` STOP CONDITION

```
/goal Do not stop until all six deliverables exist under
docs/architecture/refactor-plan-20260702/, every route+feature is in the ledger with a
verification note, every deletion/rewrite carries a safety class + coverage precondition, and
every migration phase has an acceptance gate. No product code is edited. If blocked, record the
blocker in the relevant deliverable and continue; do not fabricate.
```
