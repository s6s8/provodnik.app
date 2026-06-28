# Provodnik

Claude entry point for `/Users/idev/provodnik`.

## Read first

1. `.claude/CLAUDE.md` — canonical project rules and control-surface flow.
2. `AGENTS.md` — stack, module map, commands, and definition of done.
3. `.claude/sot/HOT.md` + `.claude/sot/INDEX.md` — active landmines and SOT lookup.
4. `.claude/rules/provodnik-orchestration.md` — Claude-specific orchestration and cleanliness rules.
5. `docs/process/claude-build-workflow.md` — Claude dispatch/runbook workflow.
6. `docs/process/repo-hygiene-cleanup.md` — cleanup plan and root-clutter policy.

## Control surface

Hermes/Quantumbek coordinates work in Telegram topics. Quantumbek plans, reviews, and verifies. QuantumHands is the default product-code executor. Claude Code is a planning/review/orchestration extension unless explicitly authorized for bounded code execution.

## Hard rules

- Never push unless explicitly instructed.
- Never expose secrets from `.env.local` or any credential store.
- Never delete tracked artifacts blindly; move/archive with `git mv` unless deletion is explicitly approved.
- Keep root clean: screenshots to `docs/qa/screenshots/<topic>/`, research to `docs/product/research/`, audits to `docs/audits/`.
- Use `/goal` for completion conditions, `/loop` only for explicit recurring maintenance, and Context7 for library/API-sensitive work.
