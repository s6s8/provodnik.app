# Prompt Skeleton — fill per task, then dispatch via cursor-dispatch.mjs

_Copy this file to `<projectPath>/.claude/prompts/out/<task>.md`, fill every `{{placeholder}}` block, inline HOT.md landmines + relevant SOT IDs, then dispatch via the orchestrator (macmini → cursor-agent) or by hand:_

```bash
# By hand (any platform — wrapper resolves node + cursor-agent for the local OS):
node ~/.claude/scripts/cursor-dispatch.mjs <projectPath>/.claude/prompts/out/<task>.md \
  --workspace "<projectPath>" --model auto --timeout 900
```

The orchestrator's `11-prompt-build` stage composes this skeleton automatically per task; hand dispatch is for one-off fixes only.

---

<context>
- **Working dir (repo root):** `<projectPath>` (e.g. `/Users/idev/projects/provodnik.app` on macmini, `D:/dev2/projects/provodnik.app` on Windows post-collapse)
- **Stack:** Next.js 15 App Router + Turbopack, Supabase (`@supabase/ssr`), shadcn/ui, Tailwind v4, Bun, Vitest
- **Files in scope:** {{list exact paths the agent will read or touch — use `src/**` paths, never `lib/**` at root (ERR-014)}}
- **Patterns to match:** {{inline 2–3 real examples from neighbouring files; never say "follow the existing pattern"}}
- **Context7 findings (fresh):** {{paste signatures + 1 working example per library call; delete this block if no external lib involved}}
</context>

<scope>
- **Branch:** {{feat/fix/refactor-<n>}}
- **Worktree:** `<projectPath>/.git/worktrees/<n>` (orchestrator default — uses git's native worktree path; or work on an existing branch — state which)
- **Responsibility:** {{one sentence: what this agent builds}}
- **Out of scope (MUST NOT touch):** {{explicit list}}
</scope>

<knowledge>
{{Paste the relevant HOT.md entries verbatim here. Then list any other SOT IDs from INDEX.md that apply, with the full body pasted below each heading. Examples:}}

> **HOT / AP-010** — TZ-naive calendar dates: never compute dates with `toISOString().slice(0,10)`; use `todayMoscowISODate` helper.
>
> **HOT / AP-012 / ADR-013** — currency crosses go through `src/data/money.ts` helpers; no inline `* 100` anywhere.
>
> **HOT / AP-014** — no value imports from server-only modules into `'use client'`; split constants into `*-types.ts`.

{{If the task touches a file recently involved in an error, paste that ERR-NNN entry too.}}
</knowledge>

<persona>
{{Pick one line verbatim:}}
- `Strict / Mechanical.` Follow spec exactly. No creativity. No extras. No file or behaviour changes outside scope.
- `Investigative / Exploratory.` Read broadly. Trace root cause. Question assumptions before touching code.
- `Conservative / Careful.` Change structure, preserve behaviour. Test obsessively.
- `Adversarial.` Try to break the code. Edge cases. Null inputs. Race conditions.
</persona>

<task>
Numbered steps. Each step = exact file path, create vs modify, what to implement, execution order.

1. {{step 1}}
2. {{step 2}}
3. {{...}}

**Verbosity:** {{pick one — STRICT: do only what is listed above, nothing extra / THOROUGH: cover edge cases, follow implications through}}
</task>

<constraints>
{{Task-specific prohibitions for this task only — e.g. "do not touch the auth flow", "do not add new dependencies", "do not rename existing exports". Delete this block if none.}}
</constraints>

<investigation_rule>
Read every file in your scope before modifying anything. Never assume structure. If a path doesn't exist, say so and stop. Never speculate about code you haven't opened. Each Bash call must contain exactly one simple command — no `&&`, `||`, stderr redirects, or `cd X && cmd` chains (ERR-015). Do not invoke `bunx vitest run`; use `bun run test:run <file>` or leave tests to the orchestrator (ERR-013).
</investigation_rule>

<shell_ban>
Do NOT run any of the following commands or use them via the shell tool:
- `node -e`, `node --eval`, `node --print`, `node -p`
- `bun -e`, `bun --eval`, `bun --print`
- `python -c`, `python -m`
- `wc`, `awk`, `sed` (for inline computations)
- `bash -c "..."`, `sh -c "..."`, `cmd /c "..."`
- shell substitutions: backticks `` `...` ``, `$(...)` command substitution

Use Read / Edit / Write tools only. Trust the spec — do not verify math, byte counts, or expected outputs via subprocess. Past dispatches hung indefinitely on `node -e` and `wc -c` calls on Windows (2026-05-01 bake-off stalls — single hung shell call cost 18 minutes of dead silence each time before the hard timeout fired).
</shell_ban>

<rules>
- TDD mandatory. Failing test → confirm failure → implement → confirm passing → commit. Code before test gets deleted, not fixed.
- YAGNI. Do not build what is not specified.
- DRY. Extract shared logic. No copy-paste.
- No hardcoded values. Constants, config, or env vars only.
- No workarounds. Robust, general-purpose solutions only.
- No TODOs, no `console.log`, no commented-out code in commits.
- Match PATTERNS exactly. Do not repeat any error in ERRORS.md.
- Commit format: `[<worktree-name>] task-N: concise description`
- If the task grows beyond its SCOPE, stop and return the unfinished plan — do not expand scope silently.
</rules>

<environment>
- **Install:** `bun install` (only if new deps were added in this task)
- **Typecheck:** `bun run typecheck`
- **Lint:** `bun run lint`
- **Tests:** `bun run test:run {{specific file}}` (never `bunx vitest run`)
- **Env vars needed:** {{list names + test values; delete if none}}
- **Node:** ≥ v22. The cursor-dispatch wrapper resolves `cursor-agent` per-OS (macOS via `~/.local/bin/cursor-agent`, Windows via `%LOCALAPPDATA%\cursor-agent\versions\<latest>`). Never call `cursor-agent.cmd` directly from a script — go through the wrapper.
</environment>

<verification>
- [ ] All files in scope present at declared paths
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes (zero errors, zero new warnings)
- [ ] `bun run test:run {{specific file}}` passes (if tests apply)
- [ ] No `console.log`, no TODOs, no hardcoded secrets committed
- [ ] Diff touches only files listed in SCOPE
- [ ] HOT/SOT landmines referenced above are not reintroduced
</verification>

<done_criteria>
- All VERIFICATION items ticked.
- Commit(s) pushed to `{{branch}}` with the required message format.
- Return a single summary line to the orchestrator: `DONE <branch> — <files changed count> — tests <pass/skip>`.
- If blocked: return `BLOCKED <reason>` — do not work around, do not expand scope.
</done_criteria>
