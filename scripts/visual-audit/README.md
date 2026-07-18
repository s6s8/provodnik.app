# Visual Audit — "Mira's Visual Gate"

Reusable visual-QA harness: logs in per role, walks every route top-down, full-page screenshots @desktop+mobile, then AI-vision scores each page against the flagship (`/requests/[id]`) + the Clean Trust canon.

## Run capture
```bash
node scripts/visual-audit/capture.mjs          # against AUDIT_BASE (default https://provodnik.app)
AUDIT_BASE=https://dev.provodnik.app node scripts/visual-audit/capture.mjs   # working tree
```
Output → `audit/screens/<role>/<route>__{desktop,mobile}.png` + `audit/manifest.json`.

### QA credentials — single authoritative source

Use the seeded e2e fixtures, **not** the old `*@demo.provodnik.app` demo accounts (those passwords have drifted and no longer authenticate on prod — see the 2026-07-18 launch QA, F-ADM-001/F-ADM-008). The one working source of truth is [`tests/e2e/fixtures.ts`](../../tests/e2e/fixtures.ts) → `SEED_USERS`:

| Role | Email | Password |
|------|-------|----------|
| admin | `qa-admin@example.com` | `QA_SEED_PASSWORD` env var (in `.env.local`) |
| guide | `qa-guide@example.com` | `QA_SEED_PASSWORD` |
| traveler | `qa-traveler@example.com` | `QA_SEED_PASSWORD` |

Never hard-code or print the password; read it from the environment at run time (`AUDIT_PW=$QA_SEED_PASSWORD`).

## Assess
`RUBRIC.md` = the scored canon checklist (8 axes, 0–5). Dispatch the **`mira-design-director`** subagent (`.claude/agents/`) on the screenshots → per-page scores, homogeneity-vs-flagship, defects, fixes. For a full sweep, fan out one agent per archetype cluster, then synthesize systemic findings.

## What "done" means
No page ships as done if `hero ≤ 2`, `imagery ≤ 2` (stock/off-place), or any axis is `broken`. Imagery that misrepresents a place = automatic fail. Re-run after each redesign PR as a regression gate.
