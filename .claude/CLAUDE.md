# Provodnik project rules

This file is the per-project canonical for Provodnik at `/Users/idev/provodnik`. Read it before any non-trivial change.

## Control surface

Hermes/Quantumbek in Telegram topics owns coordination for product changes. The legacy Quantumbek orchestrator, FSM, and Atelier surface are decommissioned from active use.

- **Hermes/Quantumbek:** coordinate tasks, ownership, and release state in Telegram topics.
- **Quantumbek:** think, plan, review, and verify. It must not mutate product code.
- **QuantumHands:** execute all product-code edits.
- **Hand-edits:** keep them explicit, scoped, and reflected in git/SOT when they change durable workflow.

## SOT layout

| Path | Role |
|---|---|
| `.claude/sot/HOT.md` | Top landmines — include in every QuantumHands prompt |
| `.claude/sot/INDEX.md` | One-line lookup of all SOT IDs (ERR-NNN, AP-NNN, ADR-NNN, PP-NNN) |
| `.claude/sot/ERRORS.md` | Error post-mortems |
| `.claude/sot/ANTI_PATTERNS.md` | Banned patterns |
| `.claude/sot/DECISIONS.md` | Architectural decisions |
| `.claude/sot/PATTERNS.md` | Approved patterns |
| `.claude/sot/API_REFERENCE.md` | Library/API gotchas |
| `.claude/sot/DEPENDENCY_GRAPH.md` | Module relationships |
| `.claude/sot/PROJECT_MAP.md` | Codebase tour |
| `.claude/sot/KODEX.md` | Кодекс «Протуберанец» — the canonical memory file: product canon (model, MVP, glossary, flow) + behavioural code (process, communication, verification). Captured rules append via `/kodex` |
| `.claude/sot/METRICS.md` | Tracked metrics |
| `.claude/sot/NEXT_PLAN.md` | Pending work queue |
| `.claude/sot/_archive/` | Historical SOT (findings, screenshots, retired specs) — gitignored, kept on local disk only |
| `.claude/checklists/` | Active checklists (post-deployment-verification, discipline-traps, codex-protuberanets-sweep) |
| `.claude/prompts/skeleton.md` | QuantumHands prompt template |

## Stack and conventions

See `AGENTS.md` for stack details, module map, CSS rules, architecture rules, env vars, and verification. For non-trivial Claude Code work, always require the trio: Superpowers for workflow discipline, Ponytail for minimalism/review, and Context7 for library/API-sensitive evidence; prompts and final reports must mention all three.

Hard rules from there:

- Package manager: `bun` (never npm/yarn).
- Verify chain: `bun run typecheck && bun run lint && bun run test:run && bun run playwright && bun run build`.
- RLS is the security boundary; no app-layer-only filtering.
- No custom CSS classes; tailwind + shadcn/ui only.
- File uploads: presigned URL via Server Action → direct browser upload.

## Commit policy

| Author | Hooks | Push allowed |
|---|---|---|
| QuantumHands edits | pre-commit hook runs (typecheck/lint snapshot) | no; commit only and wait for operator push |
| Operator hand-edits | pre-commit hook runs (typecheck/lint snapshot) | yes, after explicit approval |

Do not bypass hooks unless the operator explicitly approves it for a verified emergency.

## SHIP_GATE checklist (Ревизия Бека — canonical four-step gate)

Inlined in `.claude/checklists/post-deployment-verification.md` and used at release verification. The gate URL is the Vercel preview deploy. **Both 1280px AND 375px viewports must pass before shipping.**

## Migration history

- **2026-05-08:** collapsed the bek-era Windows daemon workflow into orchestrator-native paths. Outer workspace at `D:/dev2/projects/provodnik/` retired. Historical bek runtime archived at `_archive/bek-frozen-2026-05-08/` (gitignored, on local disk only). See:
  - Spec: `docs/superpowers/specs/2026-05-08-provodnik-into-orchestrator-design.md` (in `quantumbek/` repo, not here)
  - Plan: `docs/superpowers/plans/2026-05-08-provodnik-into-orchestrator-plan.md`
  - Runbook: `docs/superpowers/plans/2026-05-08-provodnik-tasks.md`
- **2026-05-31:** Provodnik is isolated at `/Users/idev/provodnik`. The legacy Quantumbek orchestrator/FSM/Atelier surface is decommissioned from active use. Hermes/Quantumbek in Telegram topics coordinates; Quantumbek plans/reviews/verifies without product-code mutation; QuantumHands executes product-code edits.

## When you must hand-edit

1. Pull `origin/main` first (always). Macmini bot may have committed since you last looked.
2. Branch from `main` (don't commit straight to it).
3. Run `bun run typecheck && bun run lint` before push.
4. Push the branch; Vercel preview will build.
5. Open a quick PR or merge yourself if the change is trivial.

If you're tempted to push straight to `main`, don't. A bad commit takes the live site down.

## Data access + layering (refactor 2026-06)
All Supabase I/O in src/lib/supabase/<domain>.ts; src/data = static only. lib/data must not import features (eslint-enforced). Full convention: docs/architecture/feature-structure.md
