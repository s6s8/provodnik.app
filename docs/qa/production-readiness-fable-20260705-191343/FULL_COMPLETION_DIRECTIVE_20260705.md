# Full completion directive — 2026-07-05

Owner instruction: finish the website, do not leave the audit as plan-only where a safe action can be taken. Commit and push. Make pragmatic PM decisions when required.

## Source state
- Worktree: `handover/prod-readiness-fixes`
- Starting head: `e0b05006`
- Audit artifacts: `docs/qa/production-readiness-fable-20260705-191343/ISSUES.md`, `issues.json`, `COVERAGE.md`, `DECISION_MEMO_plan-only.md`, `prd-002-anon-rls/`
- Already landed commits on this branch: `127599aa`, `6e2fb00c`, `d203f3a1`, `d2bfb7cc`, `cf4e88a4`, `e0b05006` plus base `0ece07a9`.

## Updated authority / decisions
Previous directive said plan-only for DB/data/owner decisions. Replace that with this: the owner explicitly authorizes finishing, including DB mutation and push/deploy, as long as the operation is safe, backed up/readback-verified, and not payment-related.

Make these PM decisions without asking:
1. PRD-005 test guides: hide/unpublish test/demo guides from public discovery unless they are needed as QA accounts; do this as a targeted live-data mutation by known test markers only, with before/after count evidence.
2. PRD-021 empty catalogs: prefer redirect/soft-hide empty public listing/destination catalogs until real content exists. If seeding real content is not available, implement redirect/empty-state cleanup that does not expose dead 0-content surfaces.
3. PRD-024 rate-limit env: verify prod env if tooling allows; otherwise make code safer by fail-closed or bounded in-memory fallback for expensive anonymous LLM parsing and signup/forgot-password paths when Redis is unavailable.
4. PRD-009 email ownership: finish as far as is safe. If the confirmed-email redesign conflicts with existing HOT/ADR landmines, keep the shipped rate-limit/zod mitigation and add explicit production-safe verified-email path only if it does not break login. Do not invent a broken auth flow.

## Finish all remaining audit items
Close or consciously resolve every PRD-001…PRD-035. Do not leave "not in scope" just because the earlier packet said so.

Must address remaining items especially:
- PRD-002: apply anon public-catalog RLS to live Supabase safely. Do not run blind `supabase db push`; use targeted SQL, verify `pg_policies`, anon REST, and migration repair if appropriate.
- PRD-004: reconcile migration drift as far as safe; at minimum write/apply non-destructive repair for the target migration and leave a verified inventory artifact for the rest.
- PRD-005: hide/unpublish test guide rows from public discovery or hide catalog if no real guides.
- PRD-014: expired requests must not look active.
- PRD-015: admin moderation preview link must not 404 on pending listings.
- PRD-016: protected routes must consistently redirect anon to auth.
- PRD-019: add OG/Twitter image metadata or static generated image support.
- PRD-021: empty listing/destination catalogs must be resolved.
- PRD-024: rate-limit fail-open risk must be reduced and prod env checked when possible.
- PRD-025: traveler role-switch dead end must go to guide onboarding.
- PRD-026: legacy `/guide/[id]` redirects must work for guests/travelers.
- PRD-027: raw DB/error messages should be converted to friendly user-safe messages in listed action files.
- PRD-028: booking form field errors should have aria-invalid/aria-describedby/role alert.
- PRD-032: use money helpers instead of ad hoc `/100` display math.
- PRD-033: tighten public RLS for listing_inclusions/referral config if safe; otherwise add a migration with explicit verification.
- PRD-034: remove unsafe string interpolation in PostgREST `.or()` filter.
- PRD-035: finish the listed dead-code/small cleanup package.

## Verification required before saying done
1. `bun run typecheck`
2. `bun run lint`
3. `bun run test:run`
4. `bun run build`
5. `bun run playwright` or document any unavoidable external dependency with exact reason; do not silently skip runnable specs.
6. Local production browser/HTTP checks for fixed public routes at 1280 and mobile where UI changed.
7. Live DB verification for any DB/data mutation: before/after counts, policy definitions, anon REST probe; never print secrets.
8. Commit all intended files. No unrelated dirty files in the worktree.
9. Push a branch, open/merge PR to protected main if checks allow, then deploy VPS from merged `origin/main` if possible. Verify GitHub remote head, VPS commit, service active, Caddy active, and public HTTP/body for key routes.

## Final report artifact
Create `docs/qa/production-readiness-fable-20260705-191343/FULL_COMPLETION_REPORT.md` with:
- summary
- per-PRD table PRD-001…035: status fixed/applied/resolved/deferred, evidence, commit/migration
- DB mutations applied and verification
- commits
- pushed/PR/merge/deploy state
- verification command outputs summary
- remaining items only if truly impossible, with exact blocker and next action

No secrets. No payment work.
