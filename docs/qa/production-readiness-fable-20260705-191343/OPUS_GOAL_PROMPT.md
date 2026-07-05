/goal Do not stop until every in-scope fix below is implemented, the full verification chain passes (`bun run typecheck && bun run lint && bun run test:run && bun run build` all green, plus targeted browser checks for each fixed route), all work is committed in clean atomic commits (no push), and a final report with git diff --stat, commit hashes, command outputs, and remaining blockers is produced — or a concrete blocker is proven and documented.

# Provodnik production-readiness fix execution

You are executing fixes, not auditing. The audit is done. This dispatch explicitly authorizes Claude Code product-code execution for the scope below.

## Read first (in order)
1. `docs/qa/production-readiness-fable-20260705-191343/ISSUES.md` — the 35 findings (PRD-001…035), fix directions, evidence.
2. `docs/qa/production-readiness-fable-20260705-191343/issues.json` — machine-readable mirror.
3. `docs/qa/production-readiness-fable-20260705-191343/COVERAGE.md` — what was verified and how; blocked/skipped list.
4. `.claude/CLAUDE.md`, `AGENTS.md`, `.claude/sot/HOT.md`, `.claude/sot/INDEX.md` — repo rules and landmines (ERR-092 migration drift, ERR-056 404-as-200, PII-012 masking).

Then write an execution plan (batches, per-batch verification) before touching code.

## Required tooling
- **Superpowers** — workflow discipline: plan → TDD where a unit test can capture the bug → verification-before-completion for every batch. State how it was used in the report.
- **Ponytail** — minimal diffs, root-cause fixes only; when fixing a pattern (e.g. missing maskPii, missing decode), grep all sibling callsites in scope before declaring done.
- **Context7** — mandatory for any library/API-sensitive change (Next.js 16 params encoding, Sentry config options, Supabase RLS/auth admin API, Playwright config/dotenv). Record library id + topic + version in the report.
- **Playwright/browser** — every fixed route must be verified in a real browser (local prod build via `bun run build` + `next start`), 1280px and 375px for UI changes, clean console.

## Scope (payments EXCLUDED — touch nothing payment-related, no finding requires it)

**Batch 0 — unblock the branch (PRD-013):** The working tree on `handover/excel-fixes` holds an uncommitted moderation fix + untracked migration `supabase/migrations/20260702000001_publish_approved_guides.sql` (already live in DB). Commit this kit first as one atomic commit (migration + moderation.ts + queries.ts + related edits) so your work sits on a clean base. Do not mix it with your fixes. If the diff is CRLF-polluted, commit the real logic as-is and note line-ending normalization as follow-up — do not run a repo-wide reformat.

**Batch 1 — P0 (all, in this order):**
- **PRD-001** Cyrillic slugs → 404: decode `params.slug` (`decodeURIComponent`) at the data entry point (`getGuideBySlug`/`getGuidePageData`, src/data/supabase/queries.ts:478). Grep ALL dynamic segments for the same class (requests, destinations, listings) and fix uniformly. Add a unit test with a Cyrillic slug. Verify in browser: `/guides/жюль-верников-69f18040` renders on local prod build.
- **PRD-003** Realtime chat bypasses PII masking: apply `maskPii` to incoming `payload.new.body` in `src/features/messaging/hooks/use-realtime-messages.ts` (handleNewMessage). Confirm it is the only unmasked path; add a unit test.
- **PRD-002** Anon RLS migration not applied to live DB: **code/artifact work only.** Verify the migration file `20260609000001_public_catalog_anon_access.sql` is correct, prepare an exact apply-SQL + introspection verification script (pg_policies checks before/after) under the audit folder or `docs/qa/`, and flag for operator. **Do NOT apply anything to the live DB and do NOT run `supabase db push`** — the ledger is out of sync (PRD-004) and a blind push breaks prod.

**Batch 2 — P1 safe in product code/config:**
- **PRD-010** `sendDefaultPii: false` in `sentry.server.config.ts` and `sentry.edge.config.ts`; delete the dead duplicate `src/sentry.edge.config.ts`.
- **PRD-006** Guide inbox «Подробнее» → dead route: point to the existing request-detail surface (check where the working bid flow links) or create the route; verify by clicking through as qa-guide.
- **PRD-007** Bid card links UUID into slug route: thread the guide slug into the bid view-model and link `/guides/[slug]`; verify as qa-traveler if data allows, else by unit test on the view-model.
- **PRD-011** Traveler request free-text unmasked: `maskPii()` on description/notes in the public/guide view-model builders (never for the owner); mirror the existing masked surfaces; unit test.
- **PRD-009** Signup hardening: replace `email_confirm: true` with a confirmed-ownership flow, add `rateLimit()` (copy forgot-password pattern) and zod input validation. Do NOT execute real signups against the live DB — verify via unit tests + code review of the action.
- **PRD-008** Broken hero: add a code-level fallback background so 375px is never a black void. Re-uploading `site/hero-provodnik.png` to the live bucket is a prod mutation — prepare the asset/path fix and flag for operator unless the file exists in-repo to reference safely.
- **PRD-012** E2E suite rotten (you are touching E2E — repair it): update selectors to current UI, wire env loading (dotenv) in playwright.config so `QA_SEED_PASSWORD` reaches tests, unskip tripster-v1 spec-by-spec. Gate: `bun run playwright` with 0 failed and no silently-skipped suites that can run locally; document any spec that legitimately cannot run and why.

**Plan-only (owner decision — do not execute):** PRD-004 (migration inventory/repair plan: introspection queries, safe ordering, display_name dependency), PRD-005 (unpublish test guides = live data mutation), PRD-024 prod-env check, PRD-021 seed-vs-redirect. Write these up as a short decision memo in the report.

**Batch 3 — quick P2/P3 cleanups, only if Batches 0–2 are green:**
- Copy/terminology: PRD-017 (9 string fixes: турист→путешественник, исполнители→гиды, Биржа→Запросы, готовые туры→готовые экскурсии), PRD-018 (scroll-cue label).
- A11y: PRD-022 (auth title/h1/role="alert"/aria-invalid), PRD-023 (labels on two bid-form inputs), PRD-029 (skip-to-content), PRD-028 if trivial.
- SEO: PRD-030 (canonical on destination detail), PRD-031 (robots.ts scoped disallows), PRD-020 code parts (sitemap filter, static pages, per-request lastModified).
- PRD-027 (friendlyError pattern rollout) and PRD-035 dead-code sweep only if everything else is verified.

## Hard safety rules
- **Live DB:** the local env points at the production Supabase. NO `supabase db push`, no destructive SQL, no schema/data mutation, no real form submissions/signups/uploads. Read-only probes with the anon/QA logins are fine. Migration work = local files + prepared SQL + verification scripts only.
- **Secrets:** never print or commit values from `.env.local` or any credential store.
- **bun only** — never npm/yarn/npx-installs.
- **Never `git push`.** Commit only when the batch's verification chain is green. Commit format `type(scope): description`, human-written style, NO Co-Authored-By or automation trailers.
- Stay on `handover/excel-fixes` (or branch from it); never commit to `main`.
- No custom CSS classes, no inline layout styles; tailwind + shadcn/ui only. RLS stays the security boundary — no app-layer-only filtering.
- Keep repo root clean; artifacts go under `docs/qa/`.

## Verification gates (every batch, evidence required — no claims without output)
1. `bun run typecheck` → 0 errors
2. `bun run lint` → 0 errors
3. `bun run test:run` → all green (including your new tests)
4. `bun run build` → success
5. Targeted browser check of each fixed route on the local prod build (1280 + 375 for UI, clean console)
6. `bun run playwright` after PRD-012 → 0 failed

## Stop conditions and blocker handling
- Stop a batch (not the run) if a fix requires live-DB mutation, prod env access, or an owner decision — document it in the blockers section with exact next action and continue to the next item.
- Stop the run only if the verification chain cannot be made green after root-cause debugging (systematic-debugging skill), and prove the blocker with command output.
- Never "fix" by suppressing errors, skipping tests, or bypassing hooks.

## Final report (required, in this order)
Start with `СВОДКА` (one caps header line + 3-bullet outcome). Then: per-issue status table (PRD-id → fixed/planned/blocked + commit hash), `git diff --stat`, verification commands with actual results, browser-check evidence per fixed route, decision memo for the plan-only items, remaining blockers with exact unblock steps, and how Superpowers/Ponytail/Context7 were each used (Context7: library id + topic + version). Commits listed with hashes; do not push — wait for operator push instruction.
