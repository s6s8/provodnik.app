# СВОДКА — open-tasks 06.07.26

All 9 rows terminal: **7 FIXED with commits, 2 already-fixed-in-HEAD (regression test / evidence), 1 WON'T-FIX (design verdict).** Every code commit passed the per-commit gate (typecheck + lint:ratchet + full `test:run`, 1116 tests green). Base `c0e6bfbd`; branch `worktree-open-tasks-fix`.

## Per-row: cause / fix / evidence / sha

**#35 · P0 SEC · FIXED · `251179db`**
- Cause: suspend only flipped `profiles.account_status`; GoTrue session stayed valid and the 5 SECURITY DEFINER write RPCs bypass RLS with no status check — a suspended user replaying a valid access token at PostgREST could still accept/counter/dispute/review/message.
- Fix: GoTrue `ban_duration` on suspend/archive + clear on reactivate (both `setAccountStatusAction` and `bulkAction`); migration `20260706120000` adds fail-closed `assert_active_account()` and calls it atop all 5 write RPCs; applied to **local** DB + ledger repair (never db push); the already-tracked traveler-request RLS guards `20260706093000` applied locally too.
- Evidence: pgTAP `suspended_account_write_lockout_test.sql` 3/3 (active passes, suspended blocked, blocked inside `accept_offer`); unit tests for ban/unban; `pg_policy` dump shows 5 guarded write policies + 5 guarded RPCs.

**#38 · P0 · FIXED · `1be11c8e`**
- Cause: admin users LIST rendered only masked email (detail already unmasked); raw email was fetched but not exposed on `AdminUserListItem`.
- Fix: expose raw `email` on the list item, render `email ?? maskedEmail`, fix the stale "contacts hidden" copy. Audit-actor mask kept; PII-012 (message-body masking) untouched.
- Evidence: Playwright — list shows real emails, `shots/38-admin-users-unmasked-1280.png`.

**#40 · P1 · FIXED · `5309bf4c`**
- Cause: `makeError`'s `instanceof Error` check discarded PostgREST plain-object errors → "Unknown Supabase error" across ~25 callsites, blinding the inbox-banner diagnosis.
- Fix: preserve the real message + carry the PG code on `.name`; kept the `Error` return type (avoids a 25-callsite ripple).
- Evidence: unit test `queries-core.test.ts` 3/3. The user-facing banner is **not reproducible** on the current schema (columns present, peripheral warning already split) — the actionable defect was the log-blinding.

**#39 · P1 · FIXED · `ef8c380f`**
- Cause: the avatar `profiles` UPDATE had no `.select()`, so a 0-row update (RLS block / no profile row) resolved `error:null` = silent success — avatar never persisted.
- Fix: add `.select("id")` and throw on 0 rows.
- Evidence: unit test `avatar-action.test.ts` (0-row → ok:false, owner-row → ok:true).

**#34 · P1 · FIXED · `4876a85c`**
- Cause: the request forms did a browser `supabase.auth.getUser()` pre-check and gated to login on any throw/null — racing `proxy.ts`'s per-request cookie refresh → spurious re-login for authenticated users.
- Fix: delete the client pre-check in both forms; `createRequestAction` returns `code:'auth_required'`; the client gates only on that server-confirmed signal.
- Evidence: unit tests — action returns `auth_required` on null-user and on getUser throw; `shots/34-request-form-1280.png`.

**#37 · P1 · FIXED · `f1dbbb3a`**
- Cause: post-signup blank/critical page = SSR auth read throwing inside a layout.
- Fix: primary already hardened by `77f6d728` (getUser error/throw → unauthenticated context) with `global-error.tsx` + `(home)/error.tsx` covering the segment; added the missing regression tests + a catch on the homepage auth gate.
- Evidence: 2 new `server-auth.test.ts` degrade cases (getUser error + throw → not-authenticated, no throw).

**#24 · P1 · FIXED (already in HEAD) · `ed8983af`**
- Cause: a pre-fix loader didn't select/map `avatar_url`; already fixed in HEAD (`get_public_guide_by_slug` returns `p.avatar_url` → `getGuideBySlug` maps it → route → screen renders `<Image>`).
- Fix: regression test locking `getGuideBySlug` avatar_url mapping (the breaking layer).
- Evidence: unit test; DB view `v_guide_public_profile` exposes `p.avatar_url`.

**#33 · P2 · FIXED (already in HEAD) · no commit**
- Cause/state: the hero restructure already left the bio left-aligned — `guide-profile-screen.tsx:106` parent is `flex flex-col items-start text-left`; the bio inherits it. No `text-center`/`items-center` layout remains in the file.

**#36 · P2 · RESOLVED — WON'T FIX · no commit** *(design — see below)*
- Cause: filled badge `px-2.5` insets standalone-badge text ~10px vs a left-aligned column edge.
- Verdict: mira-design-director — severity **marginal, not a real defect**; recommend **no change**, signs off on as-is. The `eyebrow` px-0 precedent doesn't apply to filled chips; a `-ml`/`flush` "fix" would create a visibly lopsided pill (a real regression for an imperceptible nit). All 3 flagged sites are standard chip-row-vs-text juxtapositions.

## Design rows (called out separately, per goal)

- **#24** and **#36** are the design-adjacent rows. #24 was already resolved in code (photo renders when present; initials monogram was intentionally removed from the hero). #36 got a full mira render/verdict and is a deliberate no-change with sign-off — not an unaddressed gap.

## Diff --stat (vs base `c0e6bfbd`, src + supabase)

```
18 files changed, 870 insertions(+), 46 deletions(-)
```
(7 code commits: `4876a85c` #34, `1be11c8e` #38, `ef8c380f` #39, `5309bf4c` #40, `f1dbbb3a` #37, `ed8983af` #24, `251179db` #35 — one commit per issue.)

## Mutation log (summary)

- STEP0: dev-server `.env.local` points at a **remote** Supabase (distinct from local docker DB); all migrations applied **local only**.
- Runtime disproved several goal hints (code drifted): #24/#33 already fixed in HEAD; #37 primary fixed by `77f6d728`; #40/#39 user-facing symptoms not reproducible (real defects latent). Rows re-scoped to root-cause + regression test.
- #35 expanded beyond the hint: added the SECURITY DEFINER RPC guards (real RLS-bypass chokepoint) + pgTAP proof.
- Proactive findings (below).

## SOT updates

- **ERR-030** corrected: the "HTTP-only cookies" root cause was false — `@supabase/ssr` writes auth cookies with `httpOnly=false`; real cause is divergent browser/server cookie paths; durable server-side-logout fix unchanged.
- **AP-041** no-`.select()` write = silent 0-row success (#39). **AP-042** `Error` over `"use server"` / dropped PG message (#40). **AP-043** one-shot banner never cleared, no retry (#40). **AP-044** suspend without GoTrue ban + DB write guard (#35). All added to `ANTI_PATTERNS.md` + `INDEX.md`.

## Proactive flags (not in row set)

1. **`.git/hooks/pre-commit` was stale** — referenced non-existent `lint:canon`/`lint:dead` scripts and blocked ALL commits. Re-synced from the correct tracked `scripts/pre-commit.sh` (typecheck + lint:ratchet + test:run). Local-only `.git` change.
2. **`main` fails `bun run lint:gid`** (pre-existing): 7 «Гид» display-name literals in untouched files. Recommend a separate P2 cleanup row.

## Trio

- **Ponytail**: rejected the `makeError` `{code,message}` type change (25-callsite ripple) for a 5-line message-preserving fix; rejected the badge `flush`/`-ml` fix (mira-confirmed regression); #24/#33 were already-fixed → regression test only, no churn. Root-cause over symptom throughout (one shared `assert_active_account()` chokepoint vs. per-RPC copies).
- **Context7**: `/supabase/supabase` — server-action auth pattern (prefer server-side getUser over client pre-check) for #34; `auth.admin.updateUserById` `ban_duration '876000h'`/`'none'` for #35. Logged with library id + topic.
- **Superpowers**: systematic-debugging (reproduce/verify against the live local DB + failing-test-first) and verification-before-completion (evidence — pgTAP, unit tests, Playwright shots, DB dumps — before any "fixed" claim).
</content>
