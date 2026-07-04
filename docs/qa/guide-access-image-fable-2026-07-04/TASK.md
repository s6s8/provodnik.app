# Fable task — guide access + guide image complaints (2026-07-04)

You are working in this isolated worktree:

`/Users/idev/provodnik/.claude/worktrees/guide-access-image-fable-20260704-172342`

Branch: `fix/guide-access-image-fable-20260704`, based on `origin/main` at `0975b5e3`.

## User/colleague complaint (source of truth)

Russian original:

> Мендут,
> Не могу зайти на страницу профиля гида, мои поездки (гид), детальная страница гида - та же проблема с картинкой расстянутой.
> Займись пока этими проблемами. Я побежал футболку покупать, ни одной приличной футболки оказывается

Interpretation:

1. A guide cannot enter the guide profile page.
2. A guide cannot enter "my trips" / guide bookings area.
3. Public guide detail page still has the same stretched image problem.

## Goal

Find root causes, fix them minimally, and produce verifiable proof. Do not stop until either:

- all three complaints are fixed and verified locally/browser + tests, or
- a concrete external blocker is proven with exact evidence and a safe partial fix/report exists.

## Required first reads

- `CLAUDE.md`
- `.claude/CLAUDE.md`
- `AGENTS.md`
- `.claude/sot/HOT.md`
- `.claude/sot/INDEX.md`
- relevant route/components/tests for guide profile, guide bookings/trips, and public guide detail image.

## Scope

Allowed:

- guide-protected route/access/auth/role redirect fixes
- guide profile route/page/data loading fixes
- guide bookings / guide trips route fixes
- public guide detail image sizing / aspect ratio fix
- targeted tests and QA screenshots under `docs/qa/guide-access-image-fable-2026-07-04/`
- local commit if verification passes

Forbidden:

- unrelated refactors or design rewrites
- broad navigation redesign
- destructive DB mutations
- printing secrets/tokens/raw credentials
- pushing to GitHub, merging PRs, or deploying VPS without explicit operator approval

## Investigation requirements

1. Reproduce/inspect the three failures before editing.
2. Test as a guide user where possible. Use existing QA auth conventions from project docs/scripts; if login is blocked, document the exact blocker and still verify routes by server/browser evidence where possible.
3. For route access issues, verify final URL/body, not HTTP 200 alone; Next can return not-found body with 200.
4. For stretched image issue, inspect rendered image dimensions/CSS at 1280px and 375px. Fix the actual component/CSS cause, not only a screenshot artifact.
5. Use Superpowers for workflow discipline before/while executing the fix.
6. Use Context7 for relevant Next.js image/App Router docs if touching those APIs.
7. Use Ponytail for a minimalism/code-quality review before finalizing.
8. In `FINAL.md`, explicitly state how Superpowers, Context7, and Ponytail were used.

## Verification gates

Run at minimum:

- `bun run typecheck`
- `bun run lint`
- focused tests for touched data/routes/components
- `bun run build` unless a real environment blocker prevents it
- Playwright/browser checks at 1280px and 375px for:
  - guide profile page access
  - guide bookings/my trips page access
  - public guide detail page image not stretched

Full `bun run test:run` / `bun run playwright` is preferred if practical; if not, explain why and run targeted coverage.

## Deliverables

1. Product-code fix committed locally on the branch, if verification passes.
2. QA artifacts under `docs/qa/guide-access-image-fable-2026-07-04/`, including screenshots if browser verification runs.
3. Final report at:

`docs/qa/guide-access-image-fable-2026-07-04/FINAL.md`

The report must include:

- root causes for each of the three complaints
- changed files
- exact commands and pass/fail outputs
- screenshot/proof paths
- local commit hash if committed
- honest blockers/limitations

## Return contract

When complete, print the full contents of `FINAL.md` in the Claude transcript.
