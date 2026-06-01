# .claude/prompts

Prompt composition for QuantumHands / Cursor SDK dispatch.

## Rule

The orchestrator (Claude) composes every implementation prompt by hand:

1. Copy `skeleton.md` → `out/<task>.md`
2. Fill every `{{placeholder}}` inline.
3. Paste the relevant HOT.md entries verbatim into section 3.
4. Add any other SOT IDs from INDEX.md that apply (ERR-NNN / AP-NNN / ADR-NNN), with bodies pasted from source.
5. Dispatch via the Cursor SDK wrapper (the only sanctioned executor — never launch Cursor directly, never use the legacy `cursor-dispatch.mjs`):

```bash
node /Users/idev/quantumbek/tools/dispatch-cursor.mjs \
  --prompt-file .claude/prompts/out/<task>.md \
  --workspace /Users/idev/provodnik \
  --model auto
```

This wrapper forwards to `/Users/idev/cursor-sdk/dispatch.mjs`, which authenticates via `CURSOR_API_KEY` without the macOS keychain. Direct `Cursor.app` / `open -a Cursor` / bare `cursor` / `cursor-agent` invocation is forbidden because it hits the locked keychain and fails.

## Directories

- `skeleton.md` — the single source of truth. Do not duplicate.
- `out/` — per-task composed prompts. Gitignored; regenerated per task. Safe to delete.
- `tripster-v1/` — legacy prompts kept for reference; do not use as templates.

## No builder

There is no `build.mjs`, no template overlays, no directive syntax. The orchestrator's value is its judgment — reading plans, running Context7 research, inlining patterns and decisions. A mechanical composer either replaces that judgment (JSON input) or duplicates what the orchestrator does natively (directive expansion). We keep the orchestrator.

## If the old template set is needed

Archived at `.claude/archive/templates-v6/`. Restore only if a regression proves the skeleton insufficient.
