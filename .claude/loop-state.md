# Loop state — visitor/guide request-detail redesign

Goal: redesign visitor + guide branches of /requests/[requestId], merge to main, deploy, verify live.
Plan: docs/superpowers/plans/2026-06-18-visitor-guide-views-redesign.md (A1→E3)
Branch: redesign/visitor-guide-views (off origin/main)
Roles: cursorSDK codes ALL product code · Sonnet code-reviewer verifies (critic≠coder) · orchestrator (me) drives/gates/DB/push/PR/merge/deploy.
DB authorization: the ONE additive RPC (get_bidding_guides_for_request) is authorized by the goal's DONE(1). No other DB op.

## Task ledger (DONE only when gates green AND Sonnet PASS)
- [x] A1  teaser RPC migration + rollback (no apply)              — cursorSDK
- [x] A2  APPLY the RPC to shared DB + live-verify (rows / [])    — orchestrator (authorized)
- [x] A3  editOfferAction + withdrawOfferAction (+tests)          — cursorSDK
- [x] A4  typed RPC wrapper + database.types                      — cursorSDK
- [x] B1  TripPanel footer slot                                   — cursorSDK
- [x] B2  BiddingGuidesTeaser primitive (+test)                   — cursorSDK
- [x] B3  RequestFactsPanel primitive                             — cursorSDK
- [x] C1  wire bidding guides into public data path              — cursorSDK
- [x] C2  rebuild PublicDetailBranch (immersive shell)           — cursorSDK
- [x] D1  fetch guide's own offer for edit prefill               — cursorSDK
- [x] D2  BidFormPanel edit mode                                  — cursorSDK
- [x] D3  rebuild GuideDetailBranch + edit/withdraw              — cursorSDK
- [x] E1  update fixtures + suite                                — cursorSDK
- [x] E2  full live browser verification (Sonnet browser agent)  — orchestrator
- [x] E3  push, PR, merge-on-green, deploy poll                  — orchestrator

## Gate chain (orchestrator runs after each cursorSDK return)
bun run typecheck && bun run lint && bun run test:run && bun run build  (+ git diff scope check)

## Log
- init: branch created off origin/main, toolchain verified, ledger seeded.

## BLOCKER (recorded, non-fatal — work continues)
- A2 RPC apply is BLOCKED: no Supabase mgmt token on this Windows box; `ssh srvx` (mini, token holder) fails `Permission denied (publickey)` — tunnel/JWT stale. settings.json has no env block.
- Impact: ONLY DONE(1) + teaser-faces live-verify. The typed wrapper try/catches → returns [] → teaser renders nothing → page works, CI green, mergeable.
- Plan: build+gate ALL independent tasks (A3,A4,B*,C*,D*,E1). Re-attempt apply at ship; if still blocked, needs-input to owner for: fix mini SSH (cloudflared login) OR paste Supabase mgmt PAT (sbp_...).
- A1: DONE (file committed 8c0ccda; live-verify deferred with A2).

- A3/A4: gates green (tc0/lint0/796 tests/build0) + Sonnet PASS (ownership defense-in-depth ok, parsing fidelity ok, no scope creep). Commits 14340382, 4b81cf2b. NOTE: code-reviewer agent type absent → used general-purpose+sonnet as critic.

- B1/B2/B3: gates green (tc0/lint0/798 tests/build0) + Sonnet PASS (null-render zero-fab ok, semantic tokens only, no regression). Commit 8afb2327.

- C1/C2: gates green (tc0/lint0/798 tests/build0) + Sonnet PASS (join-flow preserved both entry points, zero-fab teaser, DecisionCard cleanly removed). Commit e367543e. FOLLOW-UP for E1: tighten request-detail test join-CTA assertion `.length>=1` -> toHaveLength(2).

- D1/D2/D3: gates green (tc0/lint0/798 tests/build0) + Sonnet PASS (edit/create routing dual-guarded, withdraw UUID-guarded, MSK tz round-trips, state hygiene ok). Commit a48d419a.
- E2/DONE(5) note: immersive LAYOUT renders regardless of RPC; only teaser FACES + DONE(1) need the RPC apply (A2 blocked). So ship can proceed; A2 is the lone blocked DONE item.

- E1: gates green, 7/7 request-detail tests, assertions real (toHaveLength(2) + guide Edit/Withdraw presence). Commit 918213bf.

## SHIP progress
- Branch pushed; PR #131 opened (base main). 7 commits, trailers clean.
- Next: poll `gh pr checks 131` until green; get Vercel preview URL; Sonnet browser-verify immersive layout @1280+375 on visitor+guide; then merge --squash.
- A2 RPC apply still pending (blocked: no local mgmt token / mini SSH publickey). Teaser is RPC-tolerant so merge is safe; DONE(1) remains open until apply.

## A2 blocker — final diagnosis (needs human)
- SSH key ~/.ssh/id_ed25519 EXISTS, tunnel port 2222 OPEN, but mini returns `Permission denied (publickey)` → mini authorized_keys no longer trusts this box. Cannot self-fix.
- UNBLOCK options for owner: (a) restore SSH (add this box's pubkey to mini authorized_keys), OR (b) paste Supabase Management PAT (sbp_...) so I apply 20260618140000_bidding_guides_rpc.sql via scripts/apply-migration-via-management-api.mjs.
- Until then: teaser renders empty (graceful); merge is safe; DONE(1) + teaser-faces verify remain open. DONE(2),(3),(4),(5) all achievable now.

## MERGED — DONE(4) met
- PR #131 squash-merged to main as 2466193b; body trailer-clean; all CI green. Branch deleted.
- DONE: (2)code ✓ (3)gates ✓ (4)merge ✓. Remaining: (5) live browser verify @1280+375 on prod; (1) RPC apply (blocked).
- Preview was SSO-walled (OTP to owner email) → couldn't browser-verify preview; prod (public) IS reachable → DONE(5) verify happens on live provodnik.app after deploy.

## LIVE VERIFIED — DONE(5) ✓
- Sonnet browser PASS on https://provodnik.app at 1280 AND 375 for BOTH visitor + guide. Guide page shows live Редактировать/Отозвать (edit/withdraw working in prod). Demo login = Provodnik-QA-2026!.
- Non-blocking: React hydration #418 (date-locale SSR/client mismatch) on request-detail — pre-existing pattern (preserved toLocaleDateString), not a redesign regression. Follow-up candidate.

## STATUS vs DONE
- (2) code exists ✓  (3) gates exit0 ✓  (4) squash-merged, CI green ✓  (5) live browser @1280+375 ✓
- (1) RPC applied to shared DB → BLOCKED (no local mgmt PAT; mini SSH publickey-rejected; no direct DB conn). NEEDS HUMAN.
- 4/5 DONE. Redesign is SHIPPED & LIVE. Only the social-proof teaser FACES are dormant until the RPC is applied (teaser renders empty gracefully).

## TERMINAL STATE (goal failure-path executed)
- A2 (RPC apply) is an UNRESOLVABLE-WITHOUT-HUMAN access block, re-verified 3×+ across session (no local mgmt PAT; mini SSH publickey-rejected; no direct DB conn; service_role can't DDL). Per goal "if one task fails 3× → STOP".
- Goal terminal action done: owner DMed sanitized summary (TG 109577644, msg 3725).
- SHIPPED & LIVE: DONE (2)(3)(4)(5) all ✅. Only DONE(1) open, pending human-provided Supabase mgmt PAT or restored mini SSH.
- RESUME on unblock: `bun scripts/apply-migration-via-management-api.mjs supabase/migrations/20260618140000_bidding_guides_rpc.sql` (SUPABASE_ACCESS_TOKEN=<sbp_> NEXT_PUBLIC_SUPABASE_URL=https://yjzpshutgmhxizosbeef.supabase.co), then verify rows for open req / [] for private, re-verify teaser live.

## ✅ FULLY DONE — all 5 criteria met (2026-06-19)
- A2 APPLIED: RPC live on yjzpshutgmhxizosbeef via mini (user=idev, NOT x — ssh config had wrong user). Verified: open req d2…0002 -> 3 real guides (Баатр ★5, Гиляна ★4, +1); private d2…0003 -> []. Teaser now lights up live.
- DONE(1)✅(2)✅(3)✅(4)✅(5)✅. Goal complete.
