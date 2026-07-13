# STATE — Wildberries feedback execution (2026-07-13)

## North Star (fixed)
**Every regression and gap named in the 2026-07-13 Wildberries feedback (items 1–18) is
closed at its verified root cause, with the repo verify chain green and every production
step prepared as a reviewed, reversible artifact — no prod mutation from this run.**

Plan: `.../wildberries-2026-07-13/06_FABLE_EXECUTION_PLAN.md`
SHA-256 `aaee0432334a6a7ddba379aa5c0102e4295f6be955dd16a60c3810945455ffe4` (verified).
Baseline `origin/main` @ `cbcffe67`. Branch `work/wildberries-full-execution-20260713`.

## VERDICT: NORTH STAR REACHED (2026-07-13)

All 17 cards are `done`. **17 commits**, never pushed, tree clean. Every code task is committed
green; every production action is a prepared, rehearsed artifact behind its external gate,
exactly as the contract requires.

`git diff --stat cbcffe67..HEAD` → **76 files changed, 4 824 insertions(+), 268 deletions(−)**
(excludes the `.goal/` state itself, which is committed last)

## Final verification (all run, all real)

| Gate | Result |
|---|---|
| `bun run typecheck` | **PASS** |
| `bun run lint` | **0 errors**, 21 warnings (all pre-existing; ratchet +0) |
| `bun run test:run` | **234 files / 1282 tests PASS** (baseline was 224 / 1176 → **+106 tests**) |
| `bun run build` | **PASS** |
| `bun run playwright` | 8 passed, 6 skipped |
| `E2E_ALLOW_MUTATIONS=1 playwright` (local seeded Supabase) | **14/14 PASS** — incl. the full request-first lifecycle: traveler creates a request → guide sees it and opens the bid form → traveler sees it in the cabinet |
| A2 runbook rehearsal (real Postgres, real schema, rolled back) | **PASS** — 4 fixtures incl. the false-positive trap |
| Built-app route check (`next build && next start`) | all 9 footer links **200**; catalog flag proven ON *and* OFF |

## Acceptance checklist

| # | Criterion | Status |
|---|---|---|
| AC-1 | Role flip preserves display_name/slug/verification/availability | ✅ A1 — pure-function + action tests |
| AC-2 | Flip-to-guide without a phone is rejected | ✅ A1 |
| AC-3 | Admin nav counts run 2 queries, not 8 | ✅ A3 — test throws if it touches bookings/disputes |
| AC-4 | Two-field name standard | ✅ A4 |
| AC-5 | No public surface renders an email local-part | ✅ A1 (email removed from the signature — leak impossible by construction) |
| AC-6 | Phoneless guide prompted; admin badge | ✅ A5 |
| AC-7 | Admin filters by region + base city | ✅ B1 |
| AC-8 | Admin sees a guide's listings in every status incl. draft | ✅ B2 |
| AC-9 | Queue-approve writes `published`; zero `active` readers | ✅ B3 — real DB: `active_rows=0` |
| AC-10 | Catalog nav entry appears iff the flag is on | ✅ C1 + C1-fix — proven on the built app both ways |
| AC-11 | Homepage blocks render real data, collapse below thresholds | ✅ C2 |
| AC-12 | Destination typeahead filters/keyboard/free-text | ✅ C3 |
| AC-13 | Anon draft survives the auth gate + reload; recap shown | ✅ C4 |
| AC-14 | Compact request hero; homepage unchanged | ✅ C5 |
| AC-15 | No hand-rolled declension outside utils.ts | ✅ C6 |
| AC-16 | Notification coverage matrix | ✅ C7 |
| AC-17 | Prod repair runbook executable + reversible + schema-verified | ✅ A2 — rehearsed |
| AC-18 | Analytics answers the six questions from real data | ✅ D1 |
| AC-G | Full verify chain green | ✅ |

## Ledger — 17/17

| ID | Card | Commit |
|---|---|---|
| A1 | Role-flip identity clobber + phone gate | `b342722f` + `bf6b5d33` (build fix) |
| A2 | Prod data-repair runbook (artifact) | `700cdcc7` |
| A3 | Admin latency: nav counts 8→2, parallel guards | `d1be9c23` |
| A4 | Two-field name standard | `5087e62c` |
| A5 | Phoneless-guide prompt + admin badge | `396f623f` |
| B1 | Admin region/base-city filter | `43a77761` |
| B2 | Per-guide listings panel | `c5b6f414` |
| B3 | Status unification `active`→`published` (+2 sites the plan missed) | `3bbf2dc3` |
| C1 | Public catalog behind the flag | `0d267f54` + `2c626fc1` (primary-nav filter) |
| C2 | Homepage inventory blocks | `f0f1ad5e` |
| C3 | Destination typeahead | `e942e5d1` |
| C4 | Anon request draft + recap | `c855cbc6` |
| C5 | Compact request hero | `451480cd` |
| C6 | Declension consolidation | `9bb37df7` |
| C7 | Notification coverage matrix | `700cdcc7` |
| C8 | Footer/budget verification | verified on the built app (see below); no code needed |
| D1 | Analytics page | `1d6fdd43` |

## What the plan got wrong (found by tracing, not by trusting)

1. **B3 was incomplete and would have broken every guide's calendar.**
   `guide/calendar/page.tsx` reads `listings.status = 'active'`; the plan's own grep
   (`grep '"active"' src | grep -i listing`) cannot match that line. A third writer
   (`bulkSetStatus`, guide-facing) also wrote `active`. Both fixed in B3.
2. **C7's premise was false.** The plan says the notification stack is complete and the gap is
   env drift. Only **2 of 7** triggers can send an email in production; three have zero callers.
   `FEATURE_TR_NOTIFICATIONS` does not gate email at all.
3. **A1's suggested code does not build.** The plan puts a sync pure function in a `"use server"`
   module. Next rejects it — caught only by `bun run build` (F-04).
4. **C1 needed a second fix the plan never anticipated.** Registering a nav flag ≠ applying it:
   the header filtered only the account menu (F-05).
5. **B1's premise was false.** There is no static region list in the repo; `guide_profiles.regions`
   is free text. Options are derived from the data instead of inventing a canon.
6. **C6's reported string was a red herring.** «чел.» is an invariant abbreviation. The real
   offenders were «гид» declensions — plus two genuinely broken sites nobody reported
   («22 человек», «1 человек использовали»).
7. **C8's two items are contradicted by the source, and now by the running app.** Budget already
   reads «Бюджет, ₽ на человека»; all 9 footer links return **200** on the built app.

## C8 — resolution (item 9 footer, item 4 budget)

Served the built app and checked every footer destination:

```
/how-it-works 200   /trust 200   /become-a-guide 200   /for-business 200   /help 200
/policies/terms 200 /policies/offer 200 /policies/privacy 200 /policies/cookies 200
```

Rendered homepage HTML contains `Бюджет, ₽ на человека`, all four `/policies/*` links, the
Telegram support link and the `mailto:`. **No code defect exists for either item.** Both are
therefore outcome (a) "works" or (b) "deployment/env drift" — never (c). Per the plan, no code
was written. An operator repro on the production URL is the only remaining step, and it is an
external gate.

## Blocked — external gate only (not failures; the contract forbids these)

| Item | Exact unblock condition |
|---|---|
| A2 prod repair | Operator applies `docs/audits/wildberries-2026-07/prod-data-repair-runbook.md` **after A1 is deployed**. Rehearsed; post-checks and rollback included. |
| B3 prod data | Apply the migration body as targeted SQL + ledger entry **after B3 code is deployed**. Never `db push`. |
| C1 flag flip | Set `FEATURE_PUBLIC_CATALOG=1` on Vercel prod + preview + Mac mini, **after** the content check in `catalog-preflight.md` and **after** B3's data migration. |
| C7 env + deliverability | Verify `RESEND_API_KEY` on all three environments; prove delivery + idempotency on staging. |
| C8 prod repro | Click the footer links on the production URL at 1280/375. Code is proven clean. |
| SHIP_GATE preview | Requires a push; forbidden by contract. |

## Assumptions (held)

- **AS-1:** Production is a hard external gate — artifacts, not executions. Reported as
  *unverified*, never as *verified-good*.
- **AS-2:** Browser proofs ran against a local seeded Supabase only. The repo `.env.local` points
  at PROD and was never used. (The worktree-local `.env.local` created for the E2E run is
  gitignored and points at localhost.)
- **AS-3:** Cyrillic UI copy is canonical.

## Next recommendation

1. **Ship Release A first, in order:** deploy A1 → run the §4 runbook → post-checks → then
   A3/A4/A5. The runbook is unsafe until A1's write path is dead.
2. **Wire the missing notifications (C7 → N-1).** Guides are never emailed about matching new
   requests. That is the highest-value gap this run found and it is not fixed — only documented.
   Use the `${entityId}:${userId}` form or the mail silently reaches one guide only.
3. **Delete or wire the three dead notification triggers (N-2).** Dead notification code reads as
   coverage that does not exist — it is how this gap survived.
4. Re-run `bun run build` in CI, not just typecheck/lint/tests: the pre-commit hook cannot catch
   framework-level errors (F-04).
