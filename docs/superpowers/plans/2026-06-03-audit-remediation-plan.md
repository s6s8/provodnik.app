# Provodnik Audit Remediation — Implementation Plan

> **For agentic workers:** product code is implemented by **cursorSDK** (per orchestrator policy), one task per dispatch into an isolated worktree; the orchestrator verifies + commits. Steps use checkbox (`- [ ]`) tracking. The full per-finding spec is `docs/superpowers/specs/2026-06-03-audit-remediation.md`; each task's executable directive is its cursorSDK prompt in `~/audit/fix-prompts/<ID>.md`.

**Goal:** Fix all 154 audited findings (7 CRIT / 39 HIGH / 65 MED / 43 LOW) on a dedicated branch, each behind a test, without merging/pushing until reviewed.

**Architecture:** A single isolated git worktree on the Mac mini holds the remediation branch. The orchestrator (Claude) drives **cursorSDK** (one robust prompt per task) to implement each fix test-first, then verifies (`bun run typecheck`/`lint`/`test:run`) and commits that task on the branch. Tasks run **sequentially within the one shared worktree** (heavy file overlap — `queries.ts`, notifications, migrations — makes parallel writes unsafe), in dependency order P0→P3. A **Workflow** harness runs each priority batch; its **subagents** each dispatch cursorSDK for one task + verify + commit, returning a structured result. Nothing merges or pushes without explicit approval.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres + RLS), TypeScript, vitest 4, eslint, bun, cursorSDK (`@cursor/sdk`, `--model auto`), Supabase CLI (local stack / pgTAP for DB tasks).

---

## Environment (verified)

- Worktree: `/Users/idev/sdk-worktrees/provodnik/audit-remediation` (branch `fix/audit-remediation-2026-06-03`, off `origin/main` @ a611917), **outside** the repo root; `node_modules` symlinked from the main checkout.
- Repo: `git@github.com:s6s8/provodnik.app.git`. Gates: `bun run typecheck` (tsc --noEmit), `bun run lint` (eslint), `bun run test:run` (vitest run).
- cursorSDK runner: `node ~/cursor-sdk/dispatch.mjs --workspace <WT> --prompt-file ~/audit/fix-prompts/<ID>.md --model auto`.
- Prompts: `~/audit/fix-prompts/<ID>.md` (28) + `tasks.json` manifest.
- **DB-verification constraint:** Docker is **not running** on the mini, so local Supabase (`supabase db reset` / pgTAP) cannot currently verify the **11 db/mixed tasks** (P0-1, P0-2, P0-3, P1-2, P1-3, P1-9, P2-3, P2-5, plus migration parts of others). Those can be *authored* now; behavioral DB verification needs one of: (a) start Docker + local Supabase on the mini, (b) a Supabase dev branch via the management API/MCP, or (c) author-only + human SQL review. **This is a decision point before executing the db/mixed tasks.**

## Execution model

1. **Per task:** orchestrator → cursorSDK dispatch (TDD implement) → verify gates → commit on branch (clean message, **no AI/co-author trailer**) → next. Retry a failed task once with the error appended; if still failing, mark BLOCKED and continue.
2. **Sequential within the shared worktree** (one git index, no contention). Order: P0 → P1 → P2 → P3; migrations are forward-only and strictly ordered.
3. **Batches with checkpoints:** run one priority tier per Workflow invocation; orchestrator reviews the batch result before the next tier.
4. **Git boundary:** agents/cursor never push or merge. Orchestrator squash/merges only after the user approves. The branch is fully reversible (deletable) until then.

## File structure (artifacts)

- `docs/superpowers/specs/2026-06-03-audit-remediation.md` — the per-finding spec (source of truth; 154/154 traceability).
- `docs/superpowers/plans/2026-06-03-audit-remediation-plan.md` — this plan.
- `~/audit/fix-prompts/<ID>.md` (28) — one robust cursorSDK prompt per task (scope, findings, change, TDD, verify, done-criteria, no-trailer rule).
- `~/audit/fix-prompts/tasks.json` — manifest (id, priority, kind, scope, prompt_file) consumed by the Workflow harness.
- Worktree code/test/migration changes — committed task-by-task on `fix/audit-remediation-2026-06-03`.

## Verification gate (every task, before its commit)

- `bun run typecheck` ✅ · `bun run lint` ✅ (no new warnings) · `bun run test:run <scope>` ✅ (new RED→GREEN test passes; nothing else breaks).
- db/mixed tasks: migration applies idempotently + pgTAP deny/allow — **when a DB is available**; otherwise authored + flagged pending.
- Diff stays within the task's scope; no `console.log`/`TODO`/commented-out code/secrets; no AI trailer in the commit.

## Task checklist (28 tasks → all 154 findings; details in the spec + each prompt)

### P0 — exploitable security
- [ ] **P0-1** Lock role escalation (DB+app) · mixed · prompt `P0-1.md` · closes schema.sql:749/538, admin-access.ts:18/28, server-auth.ts:83
- [ ] **P0-2** SEC DEF RPC identity checks · db · `P0-2.md` · accept_offer_rpc:14, send_qa_message_rpc:11
- [ ] **P0-3** Fix OR-combined disputes_insert policy · db · `P0-3.md` · tripster_v1:593
- [ ] **P0-4** Eliminate getPublicClient RLS bypass · app · `P0-4.md` · queries.ts:162/498
- [ ] **P0-5** Restore joined-group cabinet rendering · app · `P0-5.md` · traveler-requests-screen.tsx:17

### P1 — authorization + data integrity
- [ ] **P1-1** Messaging IDOR + scope notification reads · app · `P1-1.md`
- [ ] **P1-2** Scope thread-access RLS + restore helper · db · `P1-2.md`
- [ ] **P1-3** Tighten over-broad RLS writes · db · `P1-3.md`
- [ ] **P1-4** Guide action ownership + identity freshness · app · `P1-4.md`
- [ ] **P1-5** Admin pages via admin client + booking-transition authz · app · `P1-5.md`
- [ ] **P1-6** Stop silent write no-ops · app · `P1-6.md`
- [ ] **P1-7** Make multi-write flows transactional · mixed · `P1-7.md`
- [ ] **P1-8** Unify notification read-state · app · `P1-8.md`
- [ ] **P1-9** Fix RLS-blocked authed reads · mixed · `P1-9.md`
- [ ] **P1-10** Email idempotency before send · app · `P1-10.md`
- [ ] **P1-11** Align publish → review queue · app · `P1-11.md`

### P2 — correctness, PII, perf, idempotency
- [ ] **P2-1** PII boundaries · app · `P2-1.md`
- [ ] **P2-2** Storage hardening · mixed · `P2-2.md`
- [ ] **P2-3** Restrict anon-granted RPCs + public photo reads · db · `P2-3.md`
- [ ] **P2-4** Request/capacity/open-group correctness · app · `P2-4.md`
- [ ] **P2-5** Migration idempotency + dedup policies · db · `P2-5.md`
- [ ] **P2-6** Limiter atomicity, signout CSRF, safe-redirect · app · `P2-6.md`
- [ ] **P2-7** Query performance · app · `P2-7.md`
- [ ] **P2-8** Error surfacing + email routing/prefs + stale UI · app · `P2-8.md`

### P3 — hygiene
- [ ] **P3-1** Remove dead code · app · `P3-1.md`
- [ ] **P3-2** Accessibility · app · `P3-2.md`
- [ ] **P3-3** Robustness & minor correctness · app · `P3-3.md`
- [ ] **P3-4** Redirect return-paths + document intentional public reads · mixed · `P3-4.md`

## Self-review

- **Spec coverage:** 1:1 with the spec's 28 tasks; the spec's traceability appendix maps all 154 findings (verified sum = 154). ✓
- **Order/deps:** P0 security first; migrations forward-only and ordered; app tasks sequential to avoid `queries.ts`/notifications conflicts. ✓
- **No placeholders:** each task's executable detail lives in its cursorSDK prompt (which embeds the spec's concrete directives + file:line); literal implementation code is produced by cursorSDK reading the actual source, not guessed here. ✓
- **Open decision:** DB-verification path for the 11 db/mixed tasks (see Environment).
