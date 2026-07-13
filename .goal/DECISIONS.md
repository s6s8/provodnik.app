# DECISIONS — panel rulings + dissent

## D-01 — Execution strategy for 41 tasks (R1/R2/R3, 2026-07-13)

**R1 positions**
- *Systems*: The plan is already a decomposition; treat each T-id as the atomic unit. Order by wave because W2/W3 tasks literally depend on W1 atoms existing. Blast radius is concentrated in `globals.css` + `ui/*` (T-01…T-04) — everything else is leaf edits. Cost: sequential is slow but each commit is independently revertible.
- *Domain*: The NS is "same kit everywhere, AA contrast, no a11y gaps". The user-visible payoff is concentrated in W1 (contrast affects all ~60 pages) and the mobile breaks (T-05, T-10, T-19, T-24). W3/W4 are hygiene. If budget runs out, W1+W2 must be complete and green — a half-done W3 file is worse than an untouched one.
- *Adversary*: The real regression risk is not contrast, it's the *structural* rewrites: T-05 (link-nesting change), T-19 (segmented→Tabs/ToggleGroup changes DOM + state), T-24 (admin nav breakpoints), T-26/T-31 (form aria + focus behaviour), T-37 (deleting a component with live call-sites). Those need targeted tests, not just grep. Mechanical sweeps (T-36 space-y, T-17 glass, T-27 literals) are near-zero risk *if* the grep gate is exact and typecheck+tests run per commit.

**R2 attacks**
- Adversary → Systems: "each T-id = one commit" is wrong for T-36/T-34, which touch 100+ files; a single failing file forces reverting the whole sweep. → *Accepted*: sweeps may be split into sub-commits by directory, still one concern.
- Systems → Domain: "W3 is hygiene" understates it — the literal-px and space-y debt is exactly what makes the kit not-the-kit; the grep gates in §7 are the plan's own acceptance. → *Accepted*: W3 is in scope, but ordering stands (W1 first).
- Domain → Adversary: demanding new tests for every structural task inflates scope. → *Partially accepted*: no new test suites; existing 1195 tests + typecheck + the plan's own observable acceptance are the gate. New tests only where the plan itself asks or where a delete breaks an existing test.

**R3 ruling (unanimous unless noted)**
1. Execute strictly by wave; within a wave, order by dependency then risk (atoms → shared → pages).
2. One commit per T-id (`type(scope): summary`), except sweeps >30 files which may split by directory into sub-commits tagged with the same T-id.
3. Proof per task = the plan's own acceptance command (grep/typecheck) + `bun run typecheck && bun run lint` + `bun run test:run` whenever a component with tests is touched. Full build at wave boundaries and at T-41.
4. Visual/axe proof (§7.4–7.6) is gathered at T-41 on the local seeded stack. If the stack cannot be brought up, that is recorded as an explicit blocker, NOT waived and NOT faked.
5. Most-reversible bias: prefer editing in place over deleting; deletions (T-07, T-08, T-37) only after `grep -rl` proves zero importers.

**Dissent (Adversary, recorded)**: T-19 and T-26 change interaction semantics with no automated coverage. Grep+typecheck can pass while the control is broken for a keyboard user. Mitigation accepted: those two get a manual Playwright keyboard/DOM assertion at T-41 rather than being trusted on grep alone.

## D-02 — Browser/E2E target
Local Supabase (colima) + seeded QA users, per PLAYBOOK. Rationale: the repo `.env.local` targets PROD; any write-path E2E or dev-server browsing would mutate live data (Adversary veto, unanimous). If the local stack fails, degrade to static proof + honest blocker.

## D-03 — `bun run playwright` in the verify chain
The plan §7.1 lists it. Observed: the suite needs a dev server + seeded auth; without `QA_SEED_PASSWORD` the seeded suites *skip* rather than fail. Ruling: run it against the local seeded stack at T-41; report exactly what ran vs skipped. Never report a skip as a pass.
