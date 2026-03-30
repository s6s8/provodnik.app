---
name: finish-task
description: Run the full verification checklist before committing any task — build, typecheck, CSS audit, then commit with correct format
---

# Finish Task — Verification Checklist

Use when: Codex has finished a task, or Claude has made direct edits, before committing.

## Checklist (run in order, stop on first failure)

### 1. Build
```bash
cd D:\dev\projects\provodnik\provodnik.app
bun run build
```
Must produce zero errors. Warnings are acceptable.

### 2. Typecheck
```bash
bun run typecheck
```
Zero type errors. Fix before committing.

### 3. CSS audit (manual check — read the changed files)
- [ ] No `style={{}}` added for layout purposes (padding, margin, position, z-index)
- [ ] No hardcoded hex values outside `:root` in globals.css
- [ ] No new `<style>` blocks inside component files
- [ ] Any new visual class is in `src/app/globals.css`

### 4. No inline Supabase anti-patterns
- [ ] No `createClient()` from `@supabase/supabase-js` directly in components — use `@/lib/supabase/client` or `@/lib/supabase/server`
- [ ] No `.select('*')` without explicit column list on sensitive tables (profiles, requests, offers)

### 5. Commit (never push)
```bash
git add <specific files — never git add -A>
git commit -m "$(cat <<'EOF'
type(scope): description

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
git log --oneline -1  # confirm commit exists
```

Report the commit hash to the user. Stop. Wait for push instruction.

## Commit type reference
| Type | When |
|---|---|
| `feat` | New feature or page |
| `fix` | Bug fix |
| `chore` | Config, tooling, scripts |
| `style` | CSS/visual only, no logic |
| `refactor` | Code restructure, no behavior change |
| `feat(db)` | Schema migration |
| `fix(phase0)` | Phase-tagged fix |
