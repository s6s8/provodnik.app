# Wave 0.1 — Pre-flight: feature flag registry

## CONTEXT

You are working inside a git worktree of the Provodnik Next.js 15 App Router app. **Your working directory (`.`) IS the app root.** Package manager is `bun`. TypeScript strict mode.

**Repo layout conventions (non-negotiable):**
- Source lives under `src/` — `src/lib/`, `src/app/`, `src/components/`, etc.
- TS path alias `@/*` points at `./src/*`
- Vitest only picks up `src/**/*.test.{ts,tsx}`
- Test script: `bun run test:run <path>` (non-watch)

This is Wave 0.1 of the Tripster v1 replication. You are setting up the feature flag registry.

**State at dispatch time:** `src/lib/flags.test.ts` already exists from a prior run. **Do NOT rewrite it. Do NOT read it. Do NOT touch it.** Leave it exactly as it is. Your only job is to create `src/lib/flags.ts` and commit both files together.

## SCOPE

**Branch:** `feat/tripster-v1/p0` (already checked out in this worktree)
**Worktree root:** current directory

**What you build:**
1. `src/lib/flags.ts` — typed feature flag registry (content inlined below)
2. A single commit on `feat/tripster-v1/p0`

**Out of scope:**
- Do NOT modify `middleware.ts`
- Do NOT wire flags into any existing component
- Do NOT touch `.env` files
- Do NOT rewrite `src/lib/flags.test.ts` (it already exists and is correct)
- Do NOT run `bunx vitest run` (ERR-013 — hangs on Windows)
- Do NOT run shell investigation commands (ERR-015 — cursor-agent shell hangs on chained `cd && ls` commands)
- Do NOT run `ls`, `find`, or any chained `&&`/`||` shell command
- Do NOT create files outside `src/lib/`

## FORBIDDEN COMMANDS

These WILL hang cursor-agent's shell tool — never invoke them:
- `bunx vitest run` / `bunx vitest` / `npx vitest` (ERR-013)
- Any chained shell command: `cd X && ls Y`, `ls A || ls B`, etc. (ERR-015)
- `find` with multi-flag options

## KNOWLEDGE (from SOT)

From ERRORS.md:
- **ERR-013:** cursor-agent shell hangs on `bunx vitest run` on Windows. Use `bun run test:run <file>` instead, or skip test runs entirely and let orchestrator verify from outside.
- **ERR-014:** repo uses `src/lib/`, NOT `lib/` at root. Vitest config only picks up `src/**/*.test.{ts,tsx}`.
- **ERR-015:** cursor-agent shell tool hangs on chained `cd && ls && ls || ls` investigation commands on Windows. Skip investigation — go straight to Write for fully-inlined specs.

From PATTERNS.md:
- Vitest tests colocate next to source as `*.test.ts`
- Exports use named `export const` + `export type` — no default exports except React components
- TS path alias `@/*` → `./src/*`

## TASK

Execute these steps in order. No investigation. No `ls`. No `cd`. No chained commands.

### Step 1 — Write `src/lib/flags.ts`

Use the Write tool. The file path is `src/lib/flags.ts` (relative to your current working directory). Content — copy exactly:

```ts
const env = (k: string, d = "0"): string =>
  typeof process !== "undefined" && process.env[k] !== undefined ? (process.env[k] as string) : d;

const bool = (k: string): boolean => env(k, "0") === "1";

export const flags = {
  FEATURE_TRIPSTER_V1: bool("FEATURE_TRIPSTER_V1"),
  FEATURE_TRIPSTER_TOURS: bool("FEATURE_TRIPSTER_TOURS"),
  FEATURE_TRIPSTER_KPI: bool("FEATURE_TRIPSTER_KPI"),
  FEATURE_TRIPSTER_NOTIFICATIONS: bool("FEATURE_TRIPSTER_NOTIFICATIONS"),
  FEATURE_TRIPSTER_REPUTATION: bool("FEATURE_TRIPSTER_REPUTATION"),
  FEATURE_TRIPSTER_PERIPHERALS: bool("FEATURE_TRIPSTER_PERIPHERALS"),
  FEATURE_TRIPSTER_HELP: bool("FEATURE_TRIPSTER_HELP"),
  FEATURE_TRIPSTER_FAVORITES: bool("FEATURE_TRIPSTER_FAVORITES"),
  FEATURE_TRIPSTER_PARTNER: bool("FEATURE_TRIPSTER_PARTNER"),
  FEATURE_TRIPSTER_REFERRALS: bool("FEATURE_TRIPSTER_REFERRALS"),
  FEATURE_TRIPSTER_QUIZ: bool("FEATURE_TRIPSTER_QUIZ"),
  FEATURE_TRIPSTER_DISPUTES: bool("FEATURE_TRIPSTER_DISPUTES"),
  FEATURE_DEPOSITS: bool("FEATURE_DEPOSITS"),
} as const;

export type FlagName = keyof typeof flags;
export const isEnabled = (k: FlagName): boolean => flags[k];
```

### Step 2 — Typecheck

Run ONE bash command:
```
bun run typecheck
```
Expected: no new TypeScript errors introduced by `src/lib/flags.ts`. (Existing repo errors, if any, are acceptable as long as your file does not add new ones.)

### Step 3 — Git add

Run ONE bash command:
```
git add src/lib/flags.ts src/lib/flags.test.ts
```

### Step 4 — Git commit

Run ONE bash command:
```
git commit -m "feat(tripster-v1): phase 0 pre-flight — flag registry"
```

### Step 5 — Report

In your final assistant message, state:
- Commit SHA (short form from git)
- That `src/lib/flags.ts` was created
- That `src/lib/flags.test.ts` was left untouched
- That `bun run typecheck` did not introduce new errors

Then STOP. No further action.

## INVESTIGATION RULE

**DO NOT INVESTIGATE.** Everything you need is in this prompt. Do not run `ls`, `find`, `cd`, chained commands, or any shell exploration. Go straight to Step 1 (Write tool).

If the Write tool returns an error because `src/lib/` does not exist, STOP and report that exact error. Do not try to `mkdir` or work around it.

## TDD CONTRACT

Relaxed per ERR-013: the test file already exists (written in a prior run and verified correct by the orchestrator). You do not need to re-run vitest. Orchestrator verifies tests externally after this dispatch exits.

Your only in-agent verification is Step 2 (`bun run typecheck`).

## ENVIRONMENT

- **Working directory:** the worktree root (current dir)
- **Package manager:** `bun` (never `npm` or `yarn`)
- **Typecheck command:** `bun run typecheck` (the npm script)
- **FORBIDDEN:** vitest invocations, chained shell commands, `find`, `ls` with multiple flags, `cd` in the same line as other commands

## DONE CRITERIA

- `src/lib/flags.ts` exists, exports `flags`, `isEnabled`, `FlagName`
- `src/lib/flags.test.ts` is unchanged from dispatch-time state (pre-existing, untouched)
- `bun run typecheck` introduces no new errors from your file
- Single commit on `feat/tripster-v1/p0` with message `feat(tripster-v1): phase 0 pre-flight — flag registry`
- No files touched outside `src/lib/`
- No shell investigation commands ever run
