# Archive Manifest

> Inventory of the gitignored `_archive/` tree. `_archive/` itself is not
> tracked; this manifest is, so the contents are discoverable from the repo.
> Last reviewed: 2026-05-17.

The `_archive/` directory holds two frozen snapshots from the pre-orchestrator
era. They are kept on local disk for history but excluded from git. Anything of
lasting value must be recovered into the tracked tree (as the Tripster research
was, below) — otherwise it is not part of the project's knowledge.

## `_archive/bek-frozen-2026-05-08/`

Snapshot of the "bek" working tree frozen 2026-05-08.

| Subtree | Contents | Status |
|---|---|---|
| `MISSION.md` | Frozen mission statement | Superseded by `docs/superpowers/specs/2026-04-13-provodnik-mission-vision.md` |
| `specs/` | Frozen design specs | Archived — superseded by `docs/superpowers/specs/` |
| `audit/`, `audits/` | Frozen audit notes | Archived — no action |
| `.claude-runtime/research/tripster/` | Tripster deep research (8 `.md` files + `shots/`) | **RECOVERED** → `docs/product/research/tripster/` on 2026-05-17 (8 `.md` files; `shots/` left in archive) |
| `.claude-runtime/` (rest) | Old runtime: `bek/`, `docs/`, `lib/`, `logs/`, `tasks/`, `worktrees/`, `worktrees-app/`, helper shell scripts | Archived — no action |
| `sessions/` | Frozen session transcripts | Archived — no action |
| `logs/` | Frozen logs | Archived — no action |
| `data/`, `prototypes/`, `scripts/`, `src/`, `worktrees/`, `tmp/` | Frozen working dirs / scratch | Archived — no action |
| `tmp_apply_bucket.js`, `tmp_apply_qa_rls.js`, `tmp_query_users.mjs`, `tmp_query_users.ps1` | One-off scratch scripts | Archived — no action |

## `_archive/2026-pre-orchestrator/`

Pre-orchestrator planning and audit documents.

| Subtree | Contents | Status |
|---|---|---|
| `PLAN.md`, `PHASE2.md`, `BACKLOG.md` | Pre-orchestrator planning docs | Archived — superseded by `.claude/sot/NEXT_PLAN.md` |
| `PRODUCT.md` | Pre-orchestrator product doc | Superseded — current model is `.claude/sot/PRODUCT.md` + `docs/product/` |
| `DESIGN.md`, `SITE.md`, `VISUAL-ISSUES.md` | Pre-orchestrator design notes | Archived — superseded by `docs/design/` |
| `AUDIT-REPORT.md`, `AUDIT-FIX-PLAN.md`, `CODEBASE.md` | Pre-orchestrator audit | Archived — no action |
| `AGENTS.md`, `STAKEHOLDER-FEEDBACK.md` | Pre-orchestrator agent + stakeholder notes | Archived — no action |
| `orphans/`, `outer-bek-repo-2026-05-09/`, `tooling-caches/` | Orphaned files / outer-repo snapshot / tooling caches | Archived — no action |
