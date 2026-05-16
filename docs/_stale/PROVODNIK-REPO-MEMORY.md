> STALE — pre-orchestrator workflow. Kept for history only. Current model: .claude/sot/PRODUCT.md + .claude/CLAUDE.md.

# PROVODNIK-REPO-MEMORY.md

## Purpose
- Repo-local note for how coding context is stored and maintained for `D:\dev\projects\provodnik\provodnik.app`.
- Goal: let humans and agents recover the repo shape quickly without rescanning everything.

## Memory model
- Stable memory lives in repo files.
- Live status lives in `s6s8/provodnik.app-Tasks` issues, pull requests, and GitHub Projects.
- Planning source of truth lives in `IMPLEMENTATION.md`.

## Stable files
- `IMPLEMENTATION.md`: canonical execution plan and current product-direction source of truth
- `AGENTS.md`: canonical root instructions, paths, rules, and runbook
- `.github/copilot-instructions.md`: repo-wide AI defaults
- `.github/instructions\*.instructions.md`: path-specific guidance
- `.cursor\rules\*.mdc`: Cursor project rules
- `docs\architecture\module-map.md`: module ownership and boundaries
- `docs\process\mvp-orchestration-roadmap.md`: historical sequencing reference
- `docs\process\paperclip-agent-contract.md`: active Paperclip role contract
- `docs\process\paperclip-cto-instructions.md`: CTO operating instructions for Paperclip
- `docs\process\paperclip-cursor-executor.md`: Cursor executor contract for Paperclip lanes
- `docs\adr\*`: durable technical decisions
- `.github\CODEOWNERS`: review ownership by path

## Update policy
- If module ownership or boundaries change, update `module-map.md` and `.github/CODEOWNERS`.
- If repo workflow or agent behavior rules change, update `AGENTS.md`, Cursor rules, and this file if the repo workflow itself changed.
- If a durable technical decision is made, add an ADR.
- If work is merely in progress, blocked, or done, update the issue or project item, not the stable memory files.

## Practical workflow
1. Read `AGENTS.md`.
2. Read `IMPLEMENTATION.md`.
3. Read `docs/architecture/module-map.md`.
4. Read any path-specific instruction file that matches the touched area.
5. Read `docs/process/orchestration-workflow.md` for issue/project/worktree conventions.
6. Read relevant ADRs only if the task touches an enduring decision.
7. Use issues or project items for current status.

## Live work tracking
- `s6s8/provodnik.app-Tasks` issues are the task record.
- GitHub Project `Provodnik` is the status board:
  - `https://github.com/users/s6s8/projects/1`
- Worktrees isolate code changes but do not replace issue tracking.
- Pull requests carry review and merge state.

## Cursor notes
- Cursor project rules live in `.cursor/rules`.
- Test scoped rules with real file context.
- Use `cursor-agent --model auto` by default.
