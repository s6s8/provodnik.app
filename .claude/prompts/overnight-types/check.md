# TYPE: CHECK

You are executing one CHECK row. CHECKs verify state without producing
commits. They never modify code. They produce ledger updates only.

## Recipe

1. Read your row's `title` and `verify:` clause.
2. Run the verify command(s) exactly as written.
3. Compare output to the expected result in the verify clause.
4. If pass: update ledger `[x]` with `commit: no-commit`, `evidence:` =
   one-line of command output.
5. If fail: this is the row's purpose — flag the gap. CHECK rows that
   represent phase gates (`-GATE`) auto-pass when criteria mechanically
   hold; if a gate criterion fails, mark `[!]` with the failing
   sub-criterion named, supervisor escalates and may force a fix-row.
6. CHECK rows that are followups (e.g., `T026`, `T028` — audit followups)
   work differently: see "Audit followup" subsection below.
7. Exit 0.

## Audit followup CHECK rows (e.g., T026, T028, T030, T032, T034)

These rows have body text like "review findings file, append per-finding
rows below this line as EDIT/DISPATCH". They MUTATE the ledger by adding
new rows.

Recipe for followup CHECKs:
1. Read the corresponding findings file (e.g., `_archive/bek-frozen-2026-05-08/sot/findings-plan-44.md`).
2. For each P0 or P1 finding:
   - Synthesize a new row of TYPE EDIT or DISPATCH.
   - Allocate a new ID: scan the ledger for the highest current `T###`
     and increment. Use suffix `.X` if needed to avoid renumbering
     (e.g., `T044.1`, `T044.2`, ...). Keep contiguous within the suffix.
   - Insert the new row(s) into the ledger immediately AFTER your CHECK
     row, before the next phase row. Each new row needs all four metadata
     fields (commit/evidence/depends-on/status-note) populated.
   - Set new row `depends-on: T<this-followup-id>`.
3. For P2 findings: append to `_archive/bek-frozen-2026-05-08/sot/DECISIONS.md` as a deferred-with-reason
   block.
4. Mark this followup row `[x]` with `evidence:` = "appended N new rows:
   T<id>, T<id>, ..., to ledger".
5. Exit 0. The supervisor's next iteration will pick the new rows.

## Phase gate CHECK rows (e.g., T008-GATE, T015-GATE, ...)

Recipe:
1. Read the gate's `verify:` clause — it lists multiple criteria.
2. Run each criterion mechanically:
   - "all P1 commits FF-merged to main" → `git log <kickoffSha>..main --oneline | grep <P1-marker>`
   - "Vercel build status READY" → `mcp__plugin_vercel-plugin_vercel__list_deployments`, latest production must be READY
   - "Sentry shows zero new unresolved issues" → Sentry API since `kickoffSha`
   - "sweep tracker rows N marked compliant" → `grep -c "compliant.*2026-05-02" _archive/bek-frozen-2026-05-08/checklists/codex-protuberanets-sweep.md`
3. ALL criteria pass → mark `[x]`, evidence = "all <N> gate criteria
   passed".
4. ANY criterion fails → mark `[!]` with `status-note: GATE-FAIL <criterion>
   — <details>`. Supervisor escalates: forces an Opus iteration that
   walks back to identify which earlier row's "completion" was actually
   incomplete, may rewrite that row's status from `[x]` to `[ ]` to retry,
   or may insert a new fix-row before the gate.

## Self-healing

If a verify command fails to execute (tool unavailable, file missing):
- The CHECK is genuinely uncheckable. Mark `[!]` with reason; supervisor
  retries with Opus which may have access to a different tool path.

## Ledger update — exact format

Same shape as EDIT but with `commit: no-commit`. For audit followups, also
mention the appended rows in evidence.
