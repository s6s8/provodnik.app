# Opus execution packet — Guide/Admin availability controls

You are working in `/tmp/provodnik-guide-availability-exec` on branch `feature/guide-availability-controls-20260708`, created from current `origin/main`.

## Prime directive from owner
You are fully autonomous. You receive a goal. You deliver the result.

Never ask questions. Never wait for approval. Never pause for confirmation.
The user tells you WHAT. You figure out HOW, WHY, and in what order.

When facing ambiguity: pick the best path for the project's long-term health.
When facing a choice between approaches: think like a principal engineer — pick fewer moving parts, easier to reverse, better maintainability.
State your decision in one line, then execute immediately.

You are also your own toughest critic. Before committing to any plan or architectural decision, attack it yourself:
- Would a senior staff engineer approve this?
- Does this scale?
- Is there a simpler path?
- What breaks first under pressure?

## Required methods
- Use Superpowers where applicable, especially test-driven-development / executing-plans / verification-before-completion.
- Use Ponytail: smallest correct reversible implementation, no overbuilt schedule engine, no unnecessary abstractions.
- Use Context7 for relevant current docs before implementing: Next.js App Router/server actions/revalidatePath and Supabase JS/Postgres/RLS. In final report, cite library IDs/topics used.
- Follow Provodnik project rules in `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, and `.claude/rules/*`.

## Source of truth
Read first:
1. `docs/superpowers/plans/2026-07-08-guide-availability-admin-guide.md`
2. Current source files referenced by that plan
3. Existing tests around guide profile, admin moderation, offers, notifications, guide catalog/RPC

## Goal
Implement the MVP from the plan:
- Guide can pause/resume taking new requests from the guide profile/dashboard area.
- Guide can restrict themselves from working by using the availability control. Do not build a full recurring calendar engine unless the existing code already has one that can be reused safely; MVP is the reversible working-days/self-pause control from the plan.
- Admin can see and control/override guide availability from admin guide detail/list surfaces.
- Availability changes are audited in a separate DB table/event trail, not as new columns on `guide_profiles`.
- Re-approving a guide must not accidentally clobber a guide self-pause unless the admin explicitly changes availability.
- A paused guide must not receive new request matching/notifications and must not submit new offers/bids for new work.
- Existing bookings/messages must continue working.
- Public catalog/search behavior remains approved + available.

## Scope and safety
Allowed:
- Product source/tests/docs/migrations needed for this feature.
- New migration(s) for audit events and offer/RLS availability gates.
- Generated Supabase types if the repo script works.
- A final execution report.
- Local commits.

Forbidden unless absolutely required and documented:
- Production DB mutation (`db push`, manual SQL against prod, data updates).
- Vercel/prod deploy.
- Broad redesign, unrelated refactors, changing auth/session model.
- Adding columns to `guide_profiles` unless you first prove the frozen RPC rowtype risk is fully handled. Prefer the plan's separate audit table.
- Secrets in output/commits.

## Expected implementation shape
The plan is authoritative but not sacred. If code reality differs, choose the simpler safer path and record the one-line decision.

Minimum expected files/areas:
- `src/lib/supabase/availability.ts` or equivalent focused service
- guide profile action/component/page area
- admin guide detail/list action/component/page area
- moderation approval logic so it does not clobber self-pause unintentionally
- offer submission app gate + RLS/migration gate
- migration for `guide_availability_events` + policies
- tests for service/actions/admin/guide/offer/moderation/RLS as feasible
- `docs/qa/guide-availability-execution-20260708/REPORT.md`

## Verification gates
Run and fix until green or a concrete blocker is proven:
- targeted tests you add/modify
- `bun run typecheck`
- `bun run lint`
- `bun run test:run`
- `bun run build`

If a gate is blocked by a pre-existing unrelated issue, prove it with a narrow rerun and document exact evidence. Do not fabricate pass results.

## Commit policy
Commit completed work locally on this branch with human commit message(s). Do not push. Include report in commit if it is useful and non-secret.

## Final report contract
Write `docs/qa/guide-availability-execution-20260708/REPORT.md` with:
- summary
- one-line principal-engineer decision(s)
- self-critique answers
- files changed
- migrations authored
- tests/commands run with results
- unresolved blockers, if any
- push/deploy/manual DB instructions for Hermes/operator

Then print a concise final transcript summary with commit hash, verification results, and report path.
