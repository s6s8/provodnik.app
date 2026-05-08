# Provodnik project rules — orchestrator-driven

This file is the per-project canonical for `provodnik.app`. Read it before any non-trivial change.

## Control surface

The macmini Telegram orchestrator (`@QuantumBekBot` in supergroup `-1003617072585`, app slug `provodnik`) is the **sole control surface** for product changes. Every ticket — research → spec → plan → dispatch → consistency → verify → ship → post-work → devnote — flows through Telegram.

- **General topic (id 1):** submitter `/new <description>` to start a ticket; tap `Proceed` / `Refine` / `Cancel` on the per-session topic gates.
- **Audit topic (id 3):** owner-only commands (`/override`, `/audit`, `/sessions`, `/freeze`, `/git status`, `/vercel deploys`, `/devnote draft <sid>`, `/devnote send <sid>`).
- **Hand-edits** via Windows IDE are allowed but **discouraged** — they bypass SOT discipline and consistency gates. If you must, commit + push to `main` so the orchestrator picks up the new state.

## SOT layout

| Path | Role |
|---|---|
| `.claude/sot/HOT.md` | Top landmines — orchestrator inlines these into every cursor-agent prompt |
| `.claude/sot/INDEX.md` | One-line lookup of all SOT IDs (ERR-NNN, AP-NNN, ADR-NNN, PP-NNN) |
| `.claude/sot/ERRORS.md` | Error post-mortems |
| `.claude/sot/ANTI_PATTERNS.md` | Banned patterns |
| `.claude/sot/DECISIONS.md` | Architectural decisions |
| `.claude/sot/PATTERNS.md` | Approved patterns |
| `.claude/sot/API_REFERENCE.md` | Library/API gotchas |
| `.claude/sot/DEPENDENCY_GRAPH.md` | Module relationships |
| `.claude/sot/PROJECT_MAP.md` | Codebase tour |
| `.claude/sot/KODEX.md` | Кодекс «Протуберанец» — behavioural code (process, communication, verification) |
| `.claude/sot/METRICS.md` | Tracked metrics |
| `.claude/sot/NEXT_PLAN.md` | Pending work queue |
| `.claude/sot/_archive/` | Historical SOT (findings, screenshots, retired specs) — gitignored, kept on local disk only |
| `.claude/checklists/` | Active checklists (post-deployment-verification, discipline-traps, codex-protuberanets-sweep) |
| `.claude/prompts/skeleton.md` | Cursor-agent prompt template the orchestrator composes from |

## Stack and conventions

See `AGENTS.md` for stack details, module map, CSS rules, architecture rules, env vars, and verification. Hard rules from there:

- Package manager: `bun` (never npm/yarn).
- Verify chain: `bun run typecheck && bun run lint && bun run test:run && bun run playwright && bun run build`.
- RLS is the security boundary; no app-layer-only filtering.
- No custom CSS classes; tailwind + shadcn/ui only.
- File uploads: presigned URL via Server Action → direct browser upload.

## Commit policy

| Author | Hooks | Push allowed |
|---|---|---|
| Hand-edits via Windows IDE | pre-commit hook runs (typecheck/lint snapshot) | yes, after explicit user approval |
| Orchestrator commits | `--no-verify` (orchestrator's verify-runner already ran the full chain) | yes, only after SHIP_GATE clicked |

`--no-verify` is the **only** hook bypass allowed. The orchestrator gate runs the full verify chain before ship; the pre-commit hook would just duplicate work.

## SHIP_GATE checklist (Ревизия Бека — canonical four-step gate)

Inlined in `.claude/checklists/post-deployment-verification.md` and posted by the orchestrator at SHIP_GATE. The gate URL is the Vercel preview deploy. **Both 1280px AND 375px viewports must pass before clicking Ship.**

## Migration history

- **2026-05-08:** collapsed the bek-era Windows daemon workflow into orchestrator-native paths. Outer workspace at `D:/dev2/projects/provodnik/` retired; canonical macmini path is `/Users/idev/projects/provodnik.app/`. Historical bek runtime archived at `_archive/bek-frozen-2026-05-08/` (gitignored, on local disk only). See:
  - Spec: `docs/superpowers/specs/2026-05-08-provodnik-into-orchestrator-design.md` (in `quantumbek/` repo, not here)
  - Plan: `docs/superpowers/plans/2026-05-08-provodnik-into-orchestrator-plan.md`
  - Runbook: `docs/superpowers/plans/2026-05-08-provodnik-tasks.md`

## When you must hand-edit

1. Pull `origin/main` first (always). Macmini bot may have committed since you last looked.
2. Branch from `main` (don't commit straight to it).
3. Run `bun run typecheck && bun run lint` before push.
4. Push the branch; Vercel preview will build.
5. Open a quick PR or merge yourself if the change is trivial.
6. After merge, the orchestrator picks up `main` on its next ticket.

If you're tempted to push straight to `main` — don't. The orchestrator can't `/freeze` a hand-push fast enough, and a bad commit takes the live site down.
