# Opus execution packet — package 1–5, 7

## Goal
Implement the approved package on this isolated `origin/main` worktree. Deliver the smallest safe, root-cause diff for items 1–4; items 5 and 7 are verified no-code closures. Commit only after all applicable checks pass. Never push.

## Read first
1. `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, and `.claude/sot/HOT.md`.
2. The owner plan at `/Users/idev/provodnik/.hermes/plans/2026-07-15_075944-package-1-5-7-final.md`.
3. Claude Ops evidence at `/Users/idev/.claude/plans/you-are-claude-ops-dapper-music.md`.
4. Before editing a shared function, trace every caller from the actual current code. Revalidate every path/symbol below; do not blindly follow stale line numbers.

## Mandatory operating policy
- Use Superpowers for implementation, debugging/TDD, and final verification.
- Ponytail is **full**: understand the flow, omit/reuse/native/stdlib before new code, fix the shared root cause once, no speculative abstractions, fewest safe files, and add the smallest runnable regression check for non-trivial logic.
- Use Context7 for React Hook Form and cmdk behavior relied upon here; record the library/docs/signature used in the final report.
- Work autonomously with safe defaults. Stop only for a proven security, payment, legal/identity, or impossible technical blocker.
- No dependency, migration, schema/data/seed change, feature-flag change, dummy Blog, social linking/sharing/auth, inline style, custom CSS class, unrelated cleanup, or git push.
- Preserve existing user input, drafts, URLs, and existing requests. Money must remain inside established money helpers; do not introduce a kopeck/ruble conversion path.

## Scope

### 1. Fresh-request budget default
- Find the true shared default in `use-request-form` and change only **fresh** default 5,000 ₽ → **1,000 ₽**.
- Preserve typed/draft values and post-auth continuation; do not touch independent AI-chat defaults or placeholders unless a test proves they represent the fresh form default.
- Add/update the smallest focused test that distinguishes fresh default from a draft/user-entered value.

### 2. Ready-excursion price: one correct shared source
- Confirm the current `ListingRecord.format` mapping and every consumer before editing. The Ops finding is that category is incorrectly being fed into `format`, while the real `private|group|combo` format already exists in the selected row.
- Split the two meanings cleanly at the mapper: category stays available for category/theme behavior; format becomes the real format enum; expose only the existing normalized price value required by the shared formatter.
- Retain catalog category filtering by switching its consumer to category where necessary.
- Reuse and extend the existing `formatExcursionPriceFrom` formatter—never create a card/tariff duplicate. For a private/group-priced listing, render the group unit and append `до N человек` using overall `max_group_size`; when a tariff-tier price is displayed, use that tier's `max_persons`.
- Make card, detail, and tariff rendering use the same formatter/language and prove parity with focused tests.
- Leave unrelated difficulty/category logic untouched.

### 3. One destination field: city, region, guide directions
- Reuse the existing `getActiveGuideDestinations` path and existing cmdk widget.
- Extend the data source with guide base city, guide regions/directions, and the existing city/region catalog only where the established types/queries support it.
- Normalize to the existing option shape and deduplicate by normalized `name|region` before the UI receives values.
- Do not rewrite the combobox or regress keyboard/ARIA/selection behavior.
- Confirm the widened source does not corrupt guide counts used by the homepage destinations block. If it would, keep the enriched set search-only and preserve listing-backed counts.

### 4. Homepage section order
- Keep `Как это работает` immediately after `Сборные группы`.
- Preserve empty guards.
- Ensure the ready-excursion flow is contiguous: `Готовые экскурсии → Гиды → Отзывы → FAQ`.
- Move `Популярные направления` after FAQ.
- Do not build Blog; it is a future slot, not a dummy section.

### 5 and 7: deliberate no-code closures
- Header order `Запросы → Готовые экскурсии` is already correct: do not change it.
- Do not add or alter footer social/logo behavior. There is no required interactive social feature.
- Record both as verified no-change items in the final report.

## Required verification
1. Focused tests for changed behavior, including price-format variants/parity, destination dedupe, and fresh-default vs draft preservation.
2. `bun run typecheck`
3. `bun run lint`
4. `bun run test:run`
5. `bun run build`
6. `git diff --check`
7. Browser QA for changed public UI at 1280px and 375px: keyboard/accessibility basics, no horizontal overflow, and clean console.

### Browser data caveat
Ready listings are feature-gated/off in production. Do **not** change production data or flags. Use a seeded local target or a temporary local-only preview configuration if already available. If price/listing visual proof cannot be obtained safely, report that exact evidence gap as a blocker; do not call it verified merely because static tests pass.

## Deliverables
- Product diff only, plus a concise report at `docs/qa/package-1-5-7-opus-report.md` containing:
  - item-by-item acceptance evidence and explicit no-change closure for 5/7;
  - changed files and root-cause/reuse decisions;
  - Context7 evidence;
  - exact commands and outcomes;
  - browser evidence or the precise blocked proof condition;
  - commit hash, if and only if committed.
- Commit with a human `type(scope): description` message only after mandatory static checks pass. No attribution trailers and no push.
