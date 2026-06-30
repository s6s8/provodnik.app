# Claude Build Workflow for Provodnik

> Purpose: make Claude Code useful as a robust planning, review, and orchestration extension while preserving Provodnik's control surface.

## Operating model

| Layer | Role | Mutates product code? |
|---|---|---|
| Hermes / Quantumbek | coordinate, plan, review, verify, report | No, except explicit scoped docs/rules maintenance |
| Claude Code | analysis, runbooks, reviews, bounded helper execution when explicitly allowed | No by default |
| QuantumHands / approved executor | product-code implementation | Yes |

Default: Claude analyzes and writes plans/rules. Product-code edits go through the approved executor unless the operator explicitly authorizes Claude Code for that task.

## Required read order for Claude

Every non-trivial Claude session must read:

1. `CLAUDE.md`
2. `.claude/CLAUDE.md`
3. `AGENTS.md`
4. `.claude/sot/HOT.md`
5. `.claude/sot/INDEX.md`
6. relevant `.claude/sot/*` files for the touched area
7. relevant source/docs files

## Dispatch modes

### Read-only analysis

```bash
cd /Users/idev/provodnik
claude -p --output-format text --max-turns 25 --permission-mode plan '<prompt>'
```

Use for audits, cleanup planning, architecture questions, and risk reviews.

### Bounded executor session

Only when explicitly allowed:

```bash
cd /Users/idev/provodnik
claude -p --output-format json --max-turns 30 --permission-mode bypassPermissions '<prompt>'
```

Prompt must include exact scope, files allowed, verification commands, and no-push rule.

### Background session

```bash
cd /Users/idev/provodnik
claude --bg --name '<short-task-name>' --permission-mode bypassPermissions '<prompt>'
claude agents --json --all
claude logs <id>
claude attach <id>
claude stop <id>
```

Use for long review/analysis sessions, not silent product-code mutation.

## `/goal` and `/loop`

### `/goal`

Use to prevent early stopping:

```text
/goal Do not stop until <observable condition> is true, or until a concrete blocker is proven with file paths and command output.
```

Good examples:

```text
/goal Do not stop until you produce a markdown report with KEEP/MOVE/GITIGNORE/DELETE_AFTER_BACKUP/REVIEW_WITH_HUMAN tables.
```

```text
/goal Do not stop until bun run typecheck and bun run lint pass, or you identify the exact blocker.
```

### `/loop`

Use for recurring cleanup or verification checks:

```text
/loop every 10m until git status is clean and the verification gate passes. On each tick: inspect status, fix one bounded issue if authorized, run the gate, report progress.
```

For repo hygiene:

```text
/loop every 1h until no root PNG/temporary artifacts exist. If found, report them; do not delete tracked files without explicit approval.
```

## Context7 rule

For library/API-sensitive work, prompt Claude explicitly:

```text
Use Context7 for <library>. Resolve the library id, query docs for <API/symbol>, and include the version/signature you used before editing.
```

Known Context7 tools in this environment:

```text
mcp__plugin_context7_context7__resolve-library-id
mcp__plugin_context7_context7__query-docs
```

## Standard task prompt template

```text
You are working in /Users/idev/provodnik.

Read first:
- CLAUDE.md
- .claude/CLAUDE.md
- AGENTS.md
- .claude/sot/HOT.md
- .claude/sot/INDEX.md
- relevant SOT/source files

Goal:
<one precise outcome>

Scope:
- Allowed files/dirs: <paths>
- Forbidden: no unrelated refactors, no secrets, no pushes, no root screenshots, no generated cache files

Context7:
Use Context7 for <libraries/APIs>. Include the docs/version/signature evidence used.

Implementation rule:
If product-code edits are needed, prepare a QuantumHands-ready prompt unless this session is explicitly authorized to edit code.

Verification:
Run or specify:
- bun run typecheck
- bun run lint
- bun run test:run / targeted tests when relevant
- bun run build for release-impacting work

Return:
- files inspected
- files changed or proposed
- commands run + results
- blockers
- exact next step

/goal Do not stop until the verification condition is satisfied or a concrete blocker is proven.
```

## Cleanup-maintenance loop

After every feature/fix task:

1. `git status --short` — identify generated/untracked clutter.
2. `git diff --check` — whitespace/line ending guard.
3. No root screenshots: move durable ones to `docs/qa/screenshots/<topic>/`, remove temporary local ones after backup.
4. No root docs except entry points: move research/audits/plans under `docs/`.
5. No generated caches committed.
6. Run task-appropriate gate.
7. Commit docs/rules separately from product-code changes when possible.

## Verification gates

Minimum docs/rules gate:

```bash
git diff --check
```

Minimum product-code gate:

```bash
bun run typecheck && bun run lint
```

Full ship-impact gate:

```bash
bun run typecheck && bun run lint && bun run test:run && bun run build
```

UI ship gate also requires browser verification at 1280px and 375px, with clean console and form persistence where applicable.

## Guardrails

- Never push unless explicitly instructed.
- Never expose `.env.local`, tokens, service keys, or private credentials.
- Never delete migrations or SOT files.
- Never trust app-layer filtering as authorization; RLS is the boundary.
- Never use inline money conversions; use `src/data/money.ts` helpers.
- Never use UTC date slicing for Moscow-visible dates; use `todayMoscowISODate()`.
- Never use custom CSS classes or inline layout styles for new UI.
- Never accept Claude's self-report without Hermes verification.
