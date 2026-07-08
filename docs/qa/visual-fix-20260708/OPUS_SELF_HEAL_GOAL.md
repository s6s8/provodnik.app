# Opus self-healing visual fix goal — 2026-07-08

You are Opus acting as senior product engineer + visual QA fixer for Provodnik.

Workspace: `/tmp/provodnik-opus-visual-fixes-20260708`  
Base branch: `fix/visual-audit-self-heal-20260708` from current `origin/main`  
Live audit source of truth: `docs/qa/visual-audit-20260708/FABLE_VISUAL_AUDIT.md` plus `findings.json` / `routes.json`.

## Mission

Fix the visual/product issues from the Fable audit as completely as possible in one self-healing loop. Do not stop at code edits. Continue through rendered verification, screenshot evidence, and a final report.

## Authority

The operator explicitly authorized Opus to work on all audit issues, fix them, and produce a report. You may edit product code and tests in this worktree. Do **not** push, merge, deploy, mutate production DB, or expose secrets.

## Hard constraints

- Read `CLAUDE.md`, `.claude/CLAUDE.md`, `AGENTS.md`, and relevant SOT before editing.
- Do not print or write credentials.
- Do not edit `.env*` files.
- Do not do DB migrations unless absolutely necessary; visual fixes should be code-only. If a finding needs data cleanup (e.g. QA guide public), implement safe app-level hiding/filtering where possible and document any remaining data-plane action.
- Keep artifacts under `docs/qa/visual-fix-20260708/`.
- If you cannot fully fix a finding, still improve the safe parts and explicitly mark remaining blocker.
- Prefer shared components/tokens over page-by-page hacks.
- Avoid broad unrelated refactors.

## Findings to address

Treat these as the backlog, sorted by priority:

### High
1. F-01: Desktop request detail hero is empty/broken for anon + traveler request pages.
2. F-02: `/account/notifications` renders cabinet 404 / React error; implement/redirect/fix route/nav.
3. F-03: `/destinations` and `/listings` are public soft-404s; implement pages, redirect to canonical pages, or return true 404 intentionally. Prefer useful public pages or canonical redirects if faster.

### Medium
4. F-04: Guide mobile bottom nav overlaps content on profile/bookings/calendar/contact visibility.
5. F-05: Guide profile mobile form labels cramped.
6. F-06: Traveler trips mobile tabs overlap.
7. F-07: Traveler notifications mobile card clipped.
8. F-08: Public request cards have empty dark image blocks.
9. F-09: Mobile request breadcrumb/top offset inconsistent.

### Low / polish
10. F-10: QA guide/test data publicly visible; hide/filter production QA guide safely.
11. F-11: Desktop guide category chip clipped.
12. F-12: `/ai` mobile input placeholder covered by send button.
13. F-13: Orphan footer “Поддержка” link under footer on mobile.
14. F-14: Public guide profile mobile huge empty gap when no excursions/reviews.
15. F-15: `/guide/listings` orphan `<` chevron button.
16. F-16: Guide profile document button poor contrast.
17. F-17: `/account` says profile complete while fields empty.
18. F-18: Traveler booking detail dead gap + duplicated placeholder “Маршрут”.
19. F-19: Traveler request mobile price panel lacks side padding.
20. F-20: Home hero secondary label weak contrast.

## Required self-healing loop

1. Inventory affected source files and routes.
2. Implement fixes in small coherent batches.
3. Run targeted checks after each batch where practical.
4. Start local production or dev server and capture verification screenshots for key fixed surfaces at desktop and mobile.
5. If a screenshot reveals a fix did not work, patch again and recapture.
6. Final verification must include at minimum:
   - `bun run typecheck`
   - `bun run lint`
   - `bun run build`
   - targeted tests if you add/update tests
   - Playwright/browser screenshot proof for representative fixed pages
7. Write `docs/qa/visual-fix-20260708/OPUS_VISUAL_FIX_REPORT.md` with:
   - summary of changes
   - finding-by-finding status table: Fixed / Improved / Blocked / Not attempted
   - exact files changed
   - exact commands run and results
   - screenshot evidence paths
   - remaining risks/blockers
8. Also write `docs/qa/visual-fix-20260708/fix-status.json` with machine-readable statuses.

## Acceptance bar

Do not claim complete if verification did not run. If broad lint has pre-existing failures, prove changed files clean and document the exact pre-existing blocker. But still run the requested broad commands and record output.

## Return contract

Final response should be concise and include:
- changed file count
- finding status counts
- verification command results
- report path
- blockers, if any
