# STATE — design refactor autonomous run

## North Star (fixed)
**Every Provodnik surface renders from the same AA-contrast token/component kit — no duplicate components, no off-scale literals, no a11y gaps — with the repo verify chain green.**

## VERDICT: NORTH STAR REACHED (2026-07-13)

All 41 plan tasks are committed (T-20 by delegation, D-06). 42 commits on
`feat/design-refactor-implementation-20260713`, never pushed, tree clean.
`git diff --stat 5835c300..HEAD` → 303 files changed, 5158 insertions, 5009
deletions (src alone: 242 files, +4783/−5002 — the refactor **removed** more code
than it added).

## Final gate results (all run, all real)

### §7.1 repo chain
| gate | result |
|---|---|
| `bun run typecheck` | PASS |
| `bun run lint` | 0 errors, 21 warnings (all pre-existing, unchanged from baseline) |
| `bun run test:run` | 224 files / **1176 tests pass** |
| `bun run build` | PASS (clean `.next`) |
| `bun run playwright` | **11 passed, 3 skipped** (skips = the mutation-gated lifecycle suite) |
| `E2E_ALLOW_MUTATIONS=1` lifecycle | **6 passed** — the request-first North Star flow, run on the local seeded stack. Per project memory this suite had *never actually run* before. |
| `bun run check` (incl. lint:dead) | PASS |

### §7.2 contrast gate — exit 0
Extended beyond the plan's own script (which was incomplete — see D-07):
muted on canvas 4.95 / white 5.17 / **surface-low 4.70**; placeholder on white
5.01 / canvas 4.80 / **surface-low 4.55**; warning-text on amber-tint 5.17;
success-text on green-tint 4.84; gold-foreground on gold 6.18; body on canvas 8.46.

### §7.3 grep gates
| gate | result |
|---|---|
| `space-[xy]-` | **2 files** — exactly the whitelisted ones (ui/calendar.tsx react-day-picker slots, ui/avatar.tsx `-space-x-2` overlap) |
| `text-[Npx]` | **0** |
| `rounded-[N…]` | **0** |
| `min-h-[44px]` | **0** |
| `backdrop-blur-[20px]` | **0** |
| raw palette in components+features | **0** |
| hex in tsx | **0** real (1 match is `#abcdef12`, a booking ID in a test assertion — not a colour) |
| `Provodnik` in visible copy | **0** real (3 matches: 1 inside `generateMetadata()` = whitelisted; 2 in wordmark.test.tsx, which *asserts the latin form is absent* — the gate matching its own guard) |
| `size="icon"` without aria-label | **0** (verified by parsing the JSX tag, not the line — the naive line-grep produces false positives when the label sits on the next line or on an `asChild` Link) |

### §7.4/§7.5 browser gates — **54/54 pass**
`bunx playwright test -c playwright.design.config.ts` (new, committed harness):
- 48 captures (16 public routes × 375/768/1440) → `.design-audit/AFTER/`
- every 375px capture asserts `scrollWidth <= 375` → **all pass**: the audit's mobile horizontal-overflow breaks are gone
- axe (wcag2a + wcag2aa): **0 critical/serious** on /, /auth, /guides, /requests, /help, /how-it-works

## What the browser gate caught that the plan's math did not
The single most valuable finding of the run. After every token task was "done"
and green, axe still failed on `/` and `/requests`:
1. `--muted-ink` #68727F is 4.67:1 on canvas but **4.43:1 on `--surface-low`** — the plan's §7.2 script only ever checked it against canvas and white.
2. `--faint` (placeholder) was **2.49:1** and the plan's script never checked it at all. It assumed placeholder text is exempt from AA. WCAG 1.4.3 does not exempt it, and the home form renders real values ("Когда", "Темы") in `text-placeholder`.
Fixed at the source (3031ec3b): muted → #646E7B, faint → #67707D, each chosen
against the DARKEST surface it actually sits on. Honest cost: no AA-passing gray
is meaningfully lighter than muted, so placeholder and meta text now sit close
together. That is what AA costs, not a bug.

## Assumptions (held)
- A1: Cyrillic UI copy is canonical; brand in UI = «Проводник», declined properly.
- A2: The plan's 63-route × 3-viewport capture script does not exist in-repo; I built one (`playwright.design.config.ts` + `tests/design/capture.spec.ts`) and ran it over the 16 routes reachable without a session. Authenticated routes are covered by the 1176 unit tests + the 6 lifecycle E2E, not by screenshots.
- A3: Grep gates are the mechanical proof; the browser gates are the real one. A3 was *wrong* in a useful way — see above.

## Ledger — 41/41
| ID | status |
|---|---|
| T-01 AA tokens | done(0176d3c2) + corrected by (3031ec3b) |
| T-02 Badge tokens | done(5dc65451) |
| T-03 Button success | done(5dc65451) |
| T-04 form atoms | done(bd08f2a9) |
| T-05 ListRow | done(18d0683f) |
| T-06 StickyActionBar | done(18d0683f) |
| T-07 dead components + Scrim | done(85055423) |
| T-08 dedupe EmptyState/AvatarStack | done(ee1a407f) |
| T-09 footer contrast | done(ee1a407f) |
| T-10 header mobile | done(da14a317) |
| T-11 focus recipe | done(da14a317) |
| T-12 param badges | done(dde3aeb3) |
| T-13 OpenGroupCard | done(183e687d) |
| T-14 PublicGuideCard | done(b143db59) |
| T-15 StepCard | done(dd7f9222) |
| T-16 StatTile | done(3bd2a5c2) |
| T-17 GlassCard | done(77296eea) |
| T-18 PageHeader | done(6d633a59) |
| T-19 segmented controls | done(20389b3a) |
| T-20 loading/pending | done-by-delegation (D-06) — folded into T-28/30/31/34/35, gate verified globally |
| T-21 EmptyState adoption | done(71ea12e0) |
| T-22 discovery chips | done(19cc3867) |
| T-23 guide bottom-nav | done(19cc3867) |
| T-24 admin shell | done(a447e16b) |
| T-25 status semantics | done(3edcf033) |
| T-26 auth flow | done(96565bcc) |
| T-27 request detail | done(aa2deca6) |
| T-28 guide forms | done(e9e82250) |
| T-29 booking detail | done(b6bf07d6) |
| T-30 messaging | done(a2e94954) |
| T-31 review/dispute/book | done(b390ecfe) |
| T-32 notifications | done(a862e49c) |
| T-33 marketing | done(843690a6) |
| T-34 admin pages | done(6657fb60) |
| T-35 traveler cabinet | done(0c8608cd) |
| T-36 space-y + literal sweep | done(d51c430f, bbe74901, 115985cc) |
| T-37 flag-gated detail routes | done(f0ab5c03) |
| T-38 icon-button + headings | done(30ced6bc) |
| T-39 copy & vocabulary | done(53195098) |
| T-40 motion polish | done(30ced6bc) |
| T-41 final verification | done(02f29d21, 3031ec3b, ab3868bc) |
| + SYS-12 dead surface | done(b7bc2449) — 5 components the refactor orphaned |

## Honest limitations / what I did NOT prove
1. **Screenshot DIFF against the baseline was not performed.** The plan asks to diff `.design-audit/AFTER/` against `.design-audit/screens/`. The BEFORE set was captured by a script that is not in the repo, under unknown auth/seed conditions, so a pixel diff would be noise, not signal. I captured a fresh AFTER set with a committed, re-runnable harness and gated it on *behaviour* (overflow + axe + console) instead. Future runs now have a real baseline.
2. **Authenticated routes have no screenshots.** The harness covers the 16 routes reachable without a session. Cabinet/admin/guide surfaces are covered by unit tests (1176) and the 6-step lifecycle E2E, not by pixels. Extending the harness with the seeded storageState is the obvious next step.
3. **Flag-gated detail routes (/listings/[id], /destinations/[slug]) were refactored but not visually verified** — they stay behind their flags, exactly as the plan says. They must be re-checked when a flag flips.
4. **Dark theme is untouched and unreachable.** The `.dark` block is now explicitly marked reserved; contrast there is NOT audited.
5. **No SHIP_GATE on a Vercel preview.** The contract forbids pushing, so §7.6's preview-deploy check cannot run. Everything was verified on a local seeded Supabase stack instead — which is strictly safer (the repo `.env.local` points at PROD).
6. **`bun run lint` still reports 21 warnings** — all pre-existing Supabase-boundary warnings in `src/data/**`, untouched and unrelated.

## Next recommendation
1. Push the branch and open the PR; run SHIP_GATE on the Vercel preview at 1280 and 375 (the only gate I could not execute).
2. Extend `tests/design/capture.spec.ts` with the seeded storageState so cabinet/admin routes get overflow + axe coverage too, and wire it into CI as a design-regression gate — the harness already exists.
3. When the listings/destinations flags flip, re-run the harness against those routes.
