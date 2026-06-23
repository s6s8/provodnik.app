# Visual Audit — "Mira's Visual Gate"

Reusable visual-QA harness: logs in per role, walks every route top-down, full-page screenshots @desktop+mobile, then AI-vision scores each page against the flagship (`/requests/[id]`) + the Clean Trust canon.

## Run capture
```bash
node scripts/visual-audit/capture.mjs          # against AUDIT_BASE (default https://provodnik.app)
AUDIT_BASE=https://dev.provodnik.app node scripts/visual-audit/capture.mjs   # working tree
```
Demo accounts (prod): `traveler.anna / guide.baatr / admin.demo @demo.provodnik.app`, password via `AUDIT_PW` (default `Provodnik-QA-2026!`). Output → `audit/screens/<role>/<route>__{desktop,mobile}.png` + `audit/manifest.json`.

## Assess
`RUBRIC.md` = the scored canon checklist (8 axes, 0–5). Dispatch the **`mira-design-director`** subagent (`.claude/agents/`) on the screenshots → per-page scores, homogeneity-vs-flagship, defects, fixes. For a full sweep, fan out one agent per archetype cluster, then synthesize systemic findings.

## What "done" means
No page ships as done if `hero ≤ 2`, `imagery ≤ 2` (stock/off-place), or any axis is `broken`. Imagery that misrepresents a place = automatic fail. Re-run after each redesign PR as a regression gate.
