# Phase 4.4–4.8 — Type branches: waterwalk/masterclass/photosession/quest/activity

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-4`
**Branch:** `feat/tripster-v1-p4-4`

**Note:** Waves 4.4–4.8 cover 5 listing types. Since all their sections are already implemented as shared leaves (wave 4.2) and the shell routes based on `SECTIONS_BY_TYPE`, these types are already functionally complete. This wave bundles the verification pass for all 5 types in one worktree.

**SECTIONS_BY_TYPE coverage:**
- `waterwalk`: basics/photos/schedule/tariffs/idea_route_theme/audience_facts/meeting_point ✓ (all shared)
- `masterclass`: basics/photos/schedule/tariffs/org_details/audience_facts/meeting_point ✓ (all shared)
- `photosession`: basics/photos/schedule/tariffs/org_details/meeting_point ✓ (all shared)
- `quest`: basics/photos/schedule/tariffs/idea_route_theme/org_details/audience_facts/meeting_point ✓ (all shared)
- `activity`: basics/photos/schedule/tariffs/org_details/audience_facts/meeting_point ✓ (all shared)

**All sections are implemented. No new files needed.**

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Bun.

## SCOPE

**No new files to create.**

**Modify (if needed):**
1. `src/features/guide/components/listings/ListingEditorV1/ListingEditorShell.tsx`
   - Verify the type-picker shows correct Russian labels for all 8 types
   - Verify `SECTIONS_BY_TYPE` routing is correct for waterwalk/masterclass/photosession/quest/activity
   - If any label or routing is wrong, fix it

**Verify only (no code changes expected):**
- `src/features/guide/components/listings/ListingEditorV1/types.ts` — SECTIONS_BY_TYPE for these 5 types
- `src/features/guide/components/listings/ListingEditorV1/sections/index.ts` — all sections exported

## TASK

### Step 1: Read the shell

Read `ListingEditorShell.tsx` and confirm:

1. Type picker cards include all 8 types with these Russian labels:
   - excursion → "Экскурсия"
   - waterwalk → "Прогулка на воде"
   - masterclass → "Мастер-класс"
   - photosession → "Фотосессия"
   - quest → "Квест"
   - activity → "Активность"
   - tour → "Тур"
   - transfer → "Трансфер"

2. `SECTION_COMPONENTS` map includes: basics, photos, schedule, tariffs, idea_route_theme, audience_facts, org_details, meeting_point (the shared leaves from 4.2)

If any label is missing or wrong, fix it directly. If any section key is missing from `SECTION_COMPONENTS`, note it — those will be added in later waves (4.9, 4.10, 4.12).

### Step 2: Fix any issues found

Only fix issues found in step 1. No new functionality.

### Step 3: Typecheck

```bash
C:\Users\x\.bun\bin\bun run typecheck
C:\Users\x\.bun\bin\bun run lint
```

Both must exit 0.

### Step 4: Commit

If no changes were needed: create an empty commit to mark the wave as complete:
```bash
git commit --allow-empty -m "chore(editor): 4.4-4.8 type branches verified — all sections present via shared leaves

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

If fixes were made:
```bash
git commit -m "fix(editor): type picker labels + section routing for waterwalk/masterclass/photosession/quest/activity

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

## INVESTIGATION RULE

Read the shell file before doing anything. Do not assume.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p4-4`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- All 8 types have correct Russian labels in the type picker
- SECTION_COMPONENTS covers all shared section keys
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Committed (with or without code changes)
