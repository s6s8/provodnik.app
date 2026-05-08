# Post-Deployment Verification Checklist

**Required before marking plan/tasks DONE and shipping to production.**

Each check must pass. If any check fails, hold deployment and document the issue in SOT/ERRORS.md.

---

## 1. Functional Test ✓ (Does it work?)

**What:** User-visible features work as designed.

**How:**
- Load each modified page/screen in browser
- Click through primary user journeys
- Verify UI renders correctly (no broken layouts, text overflow, etc.)
- Test on mobile if touch interfaces are involved

**Pass criteria:**
- No 404s or crashes
- All buttons/links respond
- Data displays correctly
- Form submissions work

**Example failure:** Button click goes nowhere, page freezes, wrong data displays.

---

## 2. Runtime Test ✓ (Any errors?)

**What:** No runtime errors in logs or console.

**How:**
- Open DevTools Console on each modified page → zero errors
- Check Vercel runtime logs: `vercel logs <project-id>` or deployment dashboard
- Search for `ERROR`, `WARN`, `exception`, `Uncaught` in logs
- Test error paths (invalid input, network timeout, etc.)

**Pass criteria:**
- Console: no red errors
- Runtime logs: no error-level entries
- Network requests: no 5xx responses

**Example failure:** Console has `undefined is not a function`, Vercel logs show DB connection errors, API returns 500.

---

## 3. Code Cleanliness Test ✗ (Orphaned code?)

**What:** No dead code, forgotten debug statements, or incomplete cleanup.

**How:**

### 3a. Check modified files for debris:
```bash
# Search all modified files for:
git diff main..branch -- src/ | grep -E "(console\.|TODO|FIXME|debugger|//@ts-ignore)" 
```

### 3b. Search for orphaned queries/state:
- If you hid a UI component (e.g., a tab), grep for its old state variables:
  ```bash
  git log main..branch --oneline | head -1 # Find commit
  git show <commit> | grep -E "const \[.*\]|useState|useQuery" # State created
  git diff main -- src/ | grep -v "const \[.*\]" | grep "acceptedOfferIds" # Still used?
  ```

### 3c. Check for unused imports/exports:
- Each modified file should have no `import` statements for things never used
- Run `bun run lint` on modified files

### 3d. Look for partial refactors:
- If a feature was disabled (e.g., `display: none`), grep for its supporting code:
  ```bash
  # Example: "Принятые" tab hidden
  grep -r "acceptedOfferIds" src/features/guide/
  grep -r "Принятые" src/  
  grep -r "accepted.*filter" src/
  ```

**Pass criteria:**
- Zero `console.log`, `debugger`, `TODO` in modified code
- No unused imports
- No orphaned state/queries that were disabled but not deleted
- `bun run lint` shows no new warnings

**Example failure:** Code has `console.log('debug')`, query still fetches unused data, CSS has `display: none` but the fetch still happens.

---

## 4. Completeness Audit ✗ (Was refactor complete?)

**What:** Related changes are atomic. If you touched file A, all related cleanup in B/C is also done.

**How:**

### 4a. Check git diff scope:
```bash
git diff main..branch --name-only
```
Review: Does the change set make sense? Are there missing files?

**Example:** You changed `/guide/inbox` but didn't update the route redirects, so old URL still works but points to stale page.

### 4b. Review each modified file's git diff:
```bash
git diff main..branch -- src/features/guide/components/inbox/guide-inbox-screen.tsx
```
Ask: 
- Is this a complete fix or a partial band-aid?
- Are there TODOs or "remove this later" comments?
- Does the PR description match what actually changed?

### 4c. Check for cascading impact:
- If you removed a prop from Component A, did you update all callers?
- If you changed a database query shape, did you update the type definitions?
- If you renamed a route, did you update navigation links?

```bash
# Example: Renamed /guide/statistics → redirect to /guide/calendar
grep -r "guide/statistics" src/  # Should find redirects/links, not components
grep -r "/guide/calendar" src/   # Should find new location
```

### 4d. Type safety check:
```bash
bun run typecheck
```
Zero errors. If there are `@ts-ignore` comments, they must have a reason (comment above them explaining why).

**Pass criteria:**
- git diff scope is complete (no missing files)
- Each modified file is a complete fix, not a band-aid
- No cascading orphaned references
- typecheck passes
- No unexplained `@ts-ignore` or "TODO: fix later" patterns

**Example failure:** You hid a tab but didn't remove the query, didn't update types, didn't clean up redirects. The change is incomplete.

---

## Workflow

**For each task/plan before marking DONE:**

```
[ ] 1. Functional: Live page load + happy path works
[ ] 2. Runtime: No console errors, Vercel logs clean
[ ] 3. Cleanliness: No console.log, orphaned queries, unused imports
[ ] 4. Completeness: All related code cleaned up, cascades handled, typecheck passes
```

**If any check fails:**
1. Document in `.claude/sot/ERRORS.md` (what was found, why it matters)
2. Decide: fix now (dispatch cursor-agent) or defer (add to next plan as T0)
3. Update this checklist with the pattern you found (prevent repeat)

---

## Quick Commands

```bash
# All checks at once (approximation):
git diff main..branch --name-only | wc -l  # Scope size
bun run typecheck                            # Type safety
bun run lint src/                            # Code cleanliness
git diff main..branch | grep -E "(console\.|TODO|FIXME|debugger)"  # Debris
```

---

## Common Patterns to Catch

| Pattern | What to Look For | Action |
|---------|------------------|--------|
| Hidden UI (e.g., tab) | State/queries still execute | Remove unused fetches + state |
| Renamed route | Old links/imports still exist | Update all callers, add redirects |
| Removed component | Orphaned imports in other files | Grep and clean |
| Changed query shape | Type definitions out of sync | Update types, run typecheck |
| Partial refactor | `@ts-ignore` or "fix later" comments | Complete the refactor now |

---

## Who Runs This

**Orchestrator** (before marking tasks DONE): Runs checks 1–4 on all modified code.

**cursor-agent** (during implementation): Responsible for passing checks 3–4; orchestrator spot-checks during review.

**Optional: Automation** — Could be a GitHub action pre-merge, but manual verification is more reliable for now.
