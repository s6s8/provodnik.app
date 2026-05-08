# Phase 13.2 — Flag rollout + final checks

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p13-2`
**Branch:** `feat/tripster-v1-p13-2`

**This is the final wave.** It documents the flag rollout sequence and performs final pre-merge checks.

**Flags in `src/lib/flags.ts`:**
```ts
FEATURE_TRIPSTER_V1          // master kill-switch
FEATURE_TRIPSTER_TOURS       // tour-specific UI
FEATURE_TRIPSTER_KPI         // guide KPI strip
FEATURE_TRIPSTER_NOTIFICATIONS
FEATURE_TRIPSTER_REPUTATION  // 4-axis reviews
FEATURE_TRIPSTER_PERIPHERALS // help/favorites/partner/referrals/quiz
FEATURE_TRIPSTER_HELP
FEATURE_TRIPSTER_FAVORITES
FEATURE_TRIPSTER_PARTNER
FEATURE_TRIPSTER_REFERRALS
FEATURE_TRIPSTER_QUIZ
FEATURE_TRIPSTER_DISPUTES
FEATURE_DEPOSITS             // always OFF in v1
```

## SCOPE

**Create:**
1. `docs/tripster-v1-rollout.md` — rollout sequence documentation

**Modify:**
2. `src/lib/flags.ts` — verify all 13 flags are present; add any missing ones

**Run final checks:**
3. `bun run typecheck` — must exit 0
4. `bun run lint` — must exit 0

**DO NOT touch:** Any component files, migrations, or test files.

## TASK

### 1. Verify flags.ts

Read `src/lib/flags.ts`. Confirm all 13 flags are present. If any are missing, add them following the existing pattern:
```ts
FEATURE_DEPOSITS: bool("FEATURE_DEPOSITS"),
```

### 2. Create rollout documentation

```markdown
# Tripster v1 — Feature Flag Rollout Sequence

## Pre-launch (internal testing)

Set in Vercel environment variables:
```
FEATURE_TRIPSTER_V1=1
FEATURE_TRIPSTER_TOURS=1
FEATURE_TRIPSTER_KPI=1
FEATURE_TRIPSTER_NOTIFICATIONS=1
FEATURE_TRIPSTER_REPUTATION=1
FEATURE_TRIPSTER_PERIPHERALS=0
FEATURE_TRIPSTER_HELP=1
FEATURE_TRIPSTER_FAVORITES=1
FEATURE_TRIPSTER_PARTNER=0
FEATURE_TRIPSTER_REFERRALS=0
FEATURE_TRIPSTER_QUIZ=1
FEATURE_TRIPSTER_DISPUTES=1
FEATURE_DEPOSITS=0
```

## Wave 1 — Editor + Search (guides first)
- `FEATURE_TRIPSTER_V1=1`
- All sub-flags off except tours
- Guides can create and edit listings with new editor

## Wave 2 — Traveler surfaces
- Enable after 5+ active listings exist
- Enables: search, detail pages, booking form

## Wave 3 — Notifications + Reputation
- Enable after 3+ completed bookings
- `FEATURE_TRIPSTER_NOTIFICATIONS=1`, `FEATURE_TRIPSTER_REPUTATION=1`

## Wave 4 — Peripherals
- Enable after soft launch confirmed stable
- `FEATURE_TRIPSTER_PERIPHERALS=1` (enables all peripheral sub-flags except partner/referrals)

## Wave 5 — Partner + Referrals (post-v1)
- `FEATURE_TRIPSTER_PARTNER=1`, `FEATURE_TRIPSTER_REFERRALS=1`
- After partner onboarding is ready

## Never in v1
- `FEATURE_DEPOSITS=0` — payments are v2
```

### 3. Final security scan

Read the following files and verify no secrets are hardcoded:
- `src/lib/supabase/server.ts`
- `src/lib/supabase/client.ts`
- `src/lib/flags.ts`

If any hardcoded secrets are found, remove them and use env vars instead.

### 4. Commit

```bash
git add docs/tripster-v1-rollout.md src/lib/flags.ts
git commit -m "docs(rollout): Tripster v1 flag rollout sequence + final flag verification

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p13-2`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- All 13 flags present in flags.ts
- Rollout doc created
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Committed
