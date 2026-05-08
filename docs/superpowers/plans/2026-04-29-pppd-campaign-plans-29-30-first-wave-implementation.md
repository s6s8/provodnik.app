# ПППД Campaign — Plan 29 (Legacy Cleanup) + Plan 30 First Wave (ПППД-A pre-agreed) + Governance Lock-In — Implementation Plan

> **For agentic workers:** All implementation tasks dispatch via `cursor-dispatch.mjs` per CLAUDE.md §7 + ADR-010 + ADR-025. Governance items (G-1..G-4) are orchestrator-local — no cursor-agent dispatch. Do NOT use `superpowers:subagent-driven-development` Task tool for implementers.

**Goal:** Land the URL cleanup (Plan 29) and the homepage + content first wave of ПППД-A (Plan 30) so the remaining 13 ПППД-A pages can be audited against a corrected, terminologically-clean homepage. Plus lock the three governance rules (Ревизия Бека, SOS Бек, jargon-ban) and stub Plans 31–37.

**Architecture:** All code edits routed through cursor-agent via `cursor-dispatch.mjs` per ADR-010. Prompts contain ZERO `git`/`bun` commands per ADR-025. Orchestrator handles every git op + verification step + Supabase Management API call. Governance items are orchestrator-local file edits to SOT/HOT/memory — no cursor-agent.

**Tech Stack:** Next.js 15 App Router (Server Components, `redirect()` / `notFound()` from `next/navigation`, `redirects` config in `next.config.ts`). Supabase via `@supabase/ssr` (`createSupabaseServerClient`). Tailwind v4. Bun + Vitest.

**Design spec:** `docs/superpowers/specs/2026-04-29-pppd-campaign-plans-29-30-first-wave-design.md`

---

## Phase R findings

### Path verification table

| Cited path (spec) | On disk? | Corrected path |
|---|---|---|
| `src/app/(protected)/guide/listings-v1/**` | ✓ | `src/app/(protected)/guide/listings-v1/page.tsx` (one file, ~30 lines) |
| `src/app/(protected)/guide/dashboard/**` | ✓ | `page.tsx` (1-line `redirect("/guide")`) + `loading.tsx` |
| `src/app/(protected)/guide/statistics/**` | ✓ | `page.tsx` (1-line `redirect("/guide/calendar#stats")`) |
| `src/app/(site)/guides/**` | ✓ | catalog uses `public-guides-grid.tsx` — **already canonical** (`href={`/guides/${guide.slug}`}`) |
| `src/app/(public)/guide/[id]/**` | ✗ — wrong group | actually at `src/app/(site)/guide/[id]/{page.tsx,loading.tsx}` |
| `next.config.ts` | ✓ | — |
| `src/app/(site)/tours/page.tsx` | ✓ | — |
| `src/lib/feature-flags.ts` | ✗ — wrong filename | actually at `src/lib/flags.ts`; pattern: `flags.FEATURE_*` boolean keys |
| `src/app/(home)/page.tsx` | ✓ | composes `<HomePageShell2>` from `src/features/homepage/components/homepage-shell2.tsx` |
| Homepage section components | ✓ | `homepage-hero-form.tsx`, `homepage-discovery.tsx` |
| `src/data/requests.ts` | ✗ — wrong path | actually `src/data/supabase/queries.ts` (`getHomepageRequests` at line 974) |
| `src/components/shared/site-footer.tsx` | ✓ | FAQ items at lines 37–50 |
| `src/app/(site)/help/**` | ✗ — wrong group | actually `src/app/(public)/help/page.tsx`; gated by `flags.FEATURE_TR_HELP`; reads from DB `help_articles`, falls back to `FALLBACK_ARTICLES` |
| `src/app/(protected)/guide/(inbox\|requests)/**` | ✓ both | inbox screen at `src/features/guide/components/requests/guide-requests-inbox-screen.tsx` (group line at lines 316–349) |

### Gap-to-task mapping

| Gap (from Inputs) | Task |
|---|---|
| Plan 28 numbering collision (BEK-SDK already on plan-28-*) | Every artifact in this plan uses `plan-29-*` / `plan-30-*` prefix only; no plan-28-* file touched |

### Collision resolutions

- HOT.md is referenced by every task — each prompt's KNOWLEDGE section quotes only the relevant entries (not all 8) to stay under the 8000-token budget.
- `public-guide-card.tsx` href bug surfaced via `destination-detail-screen.tsx` (NOT via `/guides` catalog). 29-T4 prompt explicitly states: "The /guides catalog page is already canonical. The legacy `/guide/[id]` href lives in `public-guide-card.tsx` used by `destination-detail-screen.tsx` — that is the file to fix."

### Surprises (flagged in prompts where relevant)

1. `/guides` catalog href is already canonical. 29-T4 actually fixes `public-guide-card.tsx`, not the catalog.
2. `src/lib/flags.ts` is the feature-flag pattern (not `feature-flags.ts`). Key `FEATURE_TR_TOURS` already exists; no new flag needed for `/tours`.
3. Help Center is at `(public)/help`, not `(site)/help`.
4. `src/components/shared/request-card.tsx` and `src/features/guide/components/orders/RequestCard.tsx` are orphan dead code (zero importers). NOT in 30-T3 scope (out of scope for this plan).
5. `/guide/dashboard` internal references = 8 hits across 7 files (not 9 as session said).
6. Inbox screen uses badge + meta-grid pattern (badge + "Свободно мест: X из Y" cell), not a single line. 30-T3 is a refactor across both surfaces, with shared helper extraction.
7. Homepage discovery currently formats Сборная as `до N чел.` — needs change to `Свободно мест: X из Y`.
8. 30-T6: `FALLBACK_ARTICLES` is the on-disk fallback only; production reads from `help_articles` DB table. Cursor-agent updates the TS fallback; **orchestrator runs the SQL UPDATE post-merge** (DB update tracked as Wave 3, NOT a cursor-agent task).

### Library API references (Context7-cited, used by tasks)

- `redirect()` from `next/navigation` — Server Component redirect. Source: <https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/04-functions/redirect.mdx>
- `notFound()` from `next/navigation` — triggers 404 in Server Components. Source: <https://github.com/vercel/next.js/blob/canary/docs/01-app/01-getting-started/10-error-handling.mdx>
- `redirects` config in `next.config.ts` — async function, `permanent: true` = 308. Source: <https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/redirecting.mdx>

For 29-T4 (id → slug redirect), `next.config.ts` cannot dynamically look up DB. Solution: replace `(site)/guide/[id]/page.tsx` with a server component that does the slug lookup and calls `redirect()` (308 via `permanentRedirect()` or 307 via `redirect()` — spec accepts permanent semantics).

---

## Dependency DAG

```
Wave 0 — orchestrator-local, parallel (no cursor-agent):
   G-1 (HOT: Ревизия Бека)
   G-2 (HOT: SOS Бек)
   G-3 (memory: feedback_no_jargon.md)
   G-4 (NEXT_PLAN: namespace handoff + Plans 31-37 stubs)

Wave 1 — cursor-agent, all parallel (Plan 29, file-isolated):
   29-T1 ── delete /guide/listings-v1
   29-T2 ── retarget 8 hits /guide/dashboard → /guide; delete redirect
   29-T3 ── delete /guide/statistics redirect
   29-T4 ── fix public-guide-card href; replace (site)/guide/[id] with id→slug redirect
   29-T5 ── /tours notFound() under flags.FEATURE_TR_TOURS

   GATE: all five branches merged to main → Plan 29 fully done
         orchestrator runs Ревизия Бека on every Plan 29 surface before opening Plan 30

Wave 2a — cursor-agent, sequential cluster on homepage (Plan 30):
   30-T1 (spacing) ─→ 30-T2 (cards uniform height + interests) ─→ 30-T3 (group format) ─→ 30-T4 (feed priority)

Wave 2b — cursor-agent, parallel with Wave 2a (Plan 30, file-isolated from homepage):
   30-T5 (footer FAQ string)
   30-T6 (help article TS rewrite)
   30-T7 (help payment category gate + new flag)

Wave 3 — orchestrator-local, after 30-T6 merges:
   SQL UPDATE on help_articles where slug='kak-otpravit-zayavku-gidu'
```

## Merge order

1. **Wave 0** — orchestrator commits G-1..G-4 + stubs in one commit.
2. **Wave 1** — five cursor-agent dispatches. Branches: `feat/plan-29-task-1`, `feat/plan-29-task-2`, `fix/plan-29-task-3`, `fix/plan-29-task-4`, `fix/plan-29-task-5`. Merge each as fast-forward after individual Ревизия Бека passes.
3. **Wave 1 GATE** — orchestrator opens every modified URL in browser at 1280px (and 375px where the page is responsive) under guest. Confirms Ревизия Бека rule. Pushes to origin/main.
4. **Wave 2a** — sequential dispatch: 30-T1 merge → 30-T2 merge → 30-T3 merge → 30-T4 merge. Each gated by Ревизия Бека on `/`.
5. **Wave 2b** — three cursor-agent dispatches in parallel with Wave 2a. Branches: `fix/plan-30-task-5`, `content/plan-30-task-6`, `feat/plan-30-task-7`. Merge each after individual Ревизия Бека passes (footer FAQ visible, help article wording correct, help payment hidden when flag off).
6. **Wave 3** — orchestrator runs Supabase Management API SQL: `UPDATE help_articles SET body_md = '<new text>' WHERE slug = 'kak-otpravit-zayavku-gidu';`.

---

## Task summary

### Wave 0 — Governance (orchestrator-local)

#### G-1 — Ревизия Бека HOT entry
File: `_archive/bek-frozen-2026-05-08/sot/HOT.md`. Append a NEW HOT entry below ADR-025 with: title (`HOT-NEW / Ревизия Бека — pre-DONE browser test`), Never block (no DONE on UI without 1280+375 browser pass under correct role), Always block (open URL → measure spacing/typography → fill→save→reload→verify on forms → assert console clean → only then DONE). Authored by orchestrator from the design spec section 5.

#### G-2 — SOS Бек HOT entry
File: `_archive/bek-frozen-2026-05-08/sot/HOT.md`. Append second NEW HOT entry below G-1 with: title (`HOT-NEW / SOS Бек — stuck protocol`), Never block (no DONE while blocked, no hacks), Always block (post in working chat with `@CarbonS8 + @six` ping, four lines: what was supposed to be done / what was tried / where it stuck / what is needed to unblock). Wait for response before continuing.

#### G-3 — Jargon-ban memory entry
Files: `~/.claude/projects/D--dev2-projects-provodnik/memory/feedback_no_jargon.md` (new file), `MEMORY.md` (append index entry). Frontmatter: name, description, type=feedback. Body: rule (no slang in serious-project register), Why (Alex flagged "лень формулировать" + "прицепить кнопочку" as register failures during Plan 29 brainstorm session 2026-04-29), How to apply (every reply to Alex; especially in technical explanations).

#### G-4 — Plans 31-37 stubs + namespace handoff in NEXT_PLAN.md
File: `_archive/bek-frozen-2026-05-08/sot/NEXT_PLAN.md`. Append:
- `Plans 31-37 stub` section — one paragraph per plan: 31=ПППД-D, 32=ПППД-C, 33=ПППД-E, 34=ПППД-F, 35=ПППД-G, 36=ПППД-H, 37=ПППД-B. Each: "audit-then-task per page; re-invoke brainstorm → spec → mega-plan when audit starts".
- `Plan-folder namespace handoff (CarbonS8)` section — current state: flat plan counter shared across BEK-runtime + Provodnik (Plan 28 collision proves it). Future shape: `_archive/bek-frozen-2026-05-08/prompts/out/<project>/plan-NN.md`. Owner: CarbonS8 (file structure migration). Not a BEK task.

### Wave 1 — Plan 29 (cursor-agent)

#### 29-T1 — Delete `/guide/listings-v1`
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-29-task-1.md`
Branch: `feat/plan-29-task-1`
Summary: Delete `src/app/(protected)/guide/listings-v1/page.tsx`. Grep for any importer; remove if found. No file should reference `/guide/listings-v1` after this task.

#### 29-T2 — Retarget `/guide/dashboard` → `/guide`
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-29-task-2.md`
Branch: `feat/plan-29-task-2`
Summary: Replace 8 hits across 7 files with the canonical `/guide`:
- `src/lib/auth/role-routing.ts:5` (root cause — `guide: "/guide/dashboard"` → `guide: "/guide"`)
- `src/components/shared/workspace-role-nav.tsx:34` (fallback string)
- `src/app/(protected)/guide/onboarding/page.tsx:41`
- `src/app/(protected)/profile/personal/page.tsx:80`
- `src/app/(protected)/traveler/requests/new/page.tsx:15`
- `src/features/guide/components/onboarding/guide-onboarding-form.tsx:215, 374` (one is window.location, one is help text)
- `src/features/guide/components/onboarding/OnboardingWizard.tsx:243`
Then delete `src/app/(protected)/guide/dashboard/page.tsx` and `src/app/(protected)/guide/dashboard/loading.tsx`.

#### 29-T3 — Delete `/guide/statistics` redirect
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-29-task-3.md`
Branch: `fix/plan-29-task-3`
Summary: Delete `src/app/(protected)/guide/statistics/page.tsx`. Grep for any importer or link to `/guide/statistics`; remove if found.

#### 29-T4 — Fix `public-guide-card` href + add id→slug redirect
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-29-task-4.md`
Branch: `fix/plan-29-task-4`
Summary: (a) Add `slug` field to `PublicGuideCardGuide` type in `src/features/guide/components/public/public-guide-card.tsx`; switch `href={`/guide/${guide.id}`}` → `href={`/guides/${guide.slug}`}`. (b) Update consumer `src/features/destinations/components/destination-detail-screen.tsx` to pass `slug` when constructing PublicGuideCard props (read slug from existing GuideRecord). (c) Replace `src/app/(site)/guide/[id]/page.tsx` with a server component that looks up `guide_profiles.slug` by `user_id = id` via `createSupabaseServerClient()` and calls `permanentRedirect(`/guides/${slug}`)` — `notFound()` if slug missing. (d) Delete `src/app/(site)/guide/[id]/loading.tsx`.

#### 29-T5 — `/tours` 404 under feature flag
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-29-task-5.md`
Branch: `fix/plan-29-task-5`
Summary: Modify `src/app/(site)/tours/page.tsx` to call `notFound()` when `!flags.FEATURE_TR_TOURS` (existing flag, no new flag needed). Pattern matches `src/app/(public)/help/page.tsx` lines 108–110.

### Wave 2a — Plan 30 homepage cluster (cursor-agent, sequential)

#### 30-T1 — Equalize homepage vertical spacing
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-30-task-1.md`
Branch: `fix/plan-30-task-1`
Depends on: Plan 29 fully merged
Summary: Open `/` at 1280px under guest. Measure pixel gaps: form bottom edge → "Запросы путешественников" top edge → footer top edge. Tune Tailwind padding tokens on `homepage-hero-form.tsx` (currently `py-16`), `homepage-discovery.tsx` (currently `pt-12 pb-14`), and footer top padding so the two gaps are visually equal. Document the chosen token in a one-line comment in the discovery section.

#### 30-T2 — Homepage cards uniform height + mandatory interests row
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-30-task-2.md`
Branch: `fix/plan-30-task-2`
Depends on: 30-T1 merged
Summary: In `src/features/homepage/components/homepage-discovery.tsx`: convert each request `<Link>` to `flex flex-col h-full` so the grid (`md:grid-cols-2`) produces equal-height cells. Always render interests row — when `interestText` is null, render placeholder text `<p className="text-sm text-muted-foreground/0 select-none">·</p>` (preserves height) OR remove the conditional and always render with empty fallback. Pick the placeholder approach for height consistency.

#### 30-T3 — Unified group format (homepage + guide inbox)
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-30-task-3.md`
Branch: `fix/plan-30-task-3`
Depends on: 30-T2 merged
Summary: Create `src/data/requests-format.ts` with two pure functions: `formatGroupLine(req: RequestRecord): string` returning `Своя группа · ${groupSize} чел.` for `mode === "private"`; for `mode === "assembly"` returning `Группа набрана` if `capacity - groupSize <= 0`, else `Сборная группа · Свободно мест: ${capacity - groupSize} из ${capacity}`. Replace inline `formatGroupLabel` in `homepage-discovery.tsx` with import. In `guide-requests-inbox-screen.tsx`, replace the badge + meta-grid double-render (lines 316–349) with a single `<p>{formatGroupLine(item)}</p>` line under the destination/title block.

#### 30-T4 — Homepage feed priority
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-30-task-4.md`
Branch: `fix/plan-30-task-4`
Depends on: 30-T3 merged
Summary: Modify `getHomepageRequests` in `src/data/supabase/queries.ts` (lines 974–1011): after building `records` with `offerCount`, sort with: `(a, b) => (b.offerCount > 0 ? 1 : 0) - (a.offerCount > 0 ? 1 : 0) || b.createdAt.localeCompare(a.createdAt)`. Filter out fully-set Сборная (`mode === "assembly" && capacity - groupSize <= 0 && offerCount === 0`). Verify the homepage shows offer-bearing requests above no-offer ones at 1280px under guest.

### Wave 2b — Plan 30 content fixes (cursor-agent, parallel)

#### 30-T5 — Footer FAQ terminology
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-30-task-5.md`
Branch: `fix/plan-30-task-5`
Depends on: Plan 29 fully merged
Summary: In `src/components/shared/site-footer.tsx` line 40: replace `загляните в раздел Открытых запросов` → `загляните в Биржу`. No other change.

#### 30-T6 — Help Center article «Как отправить заявку гиду?» rewrite (TS fallback)
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-30-task-6.md`
Branch: `content/plan-30-task-6`
Depends on: Plan 29 fully merged
Summary: In `src/app/(public)/help/page.tsx` `FALLBACK_ARTICLES`, locate the article with `slug: "kak-otpravit-zayavku-gidu"` and replace `body_md` with the rewrite (two real flows: открытый запрос на Бирже via `/requests/new`; бронирование готовой экскурсии via `/listings/[id]/book`; remove every "напрямую"). Exact replacement text in TASK section. Orchestrator will mirror the change in DB via Supabase Management API after merge (Wave 3).

#### 30-T7 — Help Center hide payment category under feature flag
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-30-task-7.md`
Branch: `feat/plan-30-task-7`
Depends on: Plan 29 fully merged
Summary: Add `FEATURE_TR_PAYMENT: bool("FEATURE_TR_PAYMENT")` to `src/lib/flags.ts`. In `src/app/(public)/help/page.tsx`, derive `CATEGORY_ORDER` from a constant filtered by `flags.FEATURE_TR_PAYMENT` (when off, exclude `"payment"`). Verify article-set categorization continues to ignore unknown category codes correctly.

---

## End-to-end verification (run after all tasks merged)

- `rg "/guide/listings-v1|/guide/dashboard|/guide/statistics" provodnik.app/src` returns zero hits.
- `rg "href=\\{\`/guide/\\$\\{" provodnik.app/src` returns zero hits (no legacy id-based href anywhere).
- `curl -I https://provodnik.app/tours` returns `HTTP/2 404` (or `200` with the not-found body if server-side notFound).
- `curl -L https://provodnik.app/guide/<some-uuid>` lands on `/guides/<slug>` with a 308 (permanentRedirect) chain, OR 404 if the id doesn't exist.
- Homepage at 1280px under guest: form / requests block / footer vertical gaps visually equal (within 4px).
- All 4 visible homepage request cards same height (no jagged grid).
- All 4 cards show interests row (placeholder when empty).
- Group format on homepage cards uses `Своя группа · N чел.` / `Сборная группа · Свободно мест: X из Y` / `Группа набрана` exactly.
- Same group format strings appear in guide inbox screen.
- Footer FAQ first item answer contains "Биржу" and not "Открытых запросов".
- Help Center article «Как отправить заявку гиду?» mentions both flows (Биржа open request + готовая экскурсия booking) and contains zero "напрямую".
- With `FEATURE_TR_PAYMENT=0` (default), Help Center page shows no "Оплата и возврат" category heading.
- `bun run typecheck` passes.
- `bun run lint` passes (no new errors / warnings).
- `_archive/bek-frozen-2026-05-08/sot/HOT.md` has new entries for Ревизия Бека + SOS Бек (count 8 → 10).
- `~/.claude/projects/D--dev2-projects-provodnik/memory/feedback_no_jargon.md` exists; `MEMORY.md` indexes it.
- `_archive/bek-frozen-2026-05-08/sot/NEXT_PLAN.md` has Plans 31-37 stubs section + Plan-folder namespace handoff section.

---

## Self-review checklist (blocks "done" — every box must be ticked)

- [x] Every gap in the design spec's gap list has a task that fixes it. Mapping in Phase R findings table.
- [x] Every cross-file collision has an explicit resolution sentence — see Collision Resolutions section above.
- [x] Every file path referenced in any task prompt has been Glob-verified — see Path Verification table.
- [x] Every Context7 citation has a real URL — see Library API References section.
- [x] DAG above matches the SCOPE dependency declarations in every task prompt.
- [x] Each task VERIFICATION section will have ≥3 observable-state items (enforced in per-task prompts).
- [x] Each task DONE CRITERIA names exact branch + file count + return string (enforced in per-task prompts).
- [x] Design spec terminology locks (`Биржа` / `Своя группа` / `Сборная группа` / `Готовые экскурсии` / `Готовые туры` / `ПППД`) — Phase V will `rg` for `Открытых запросов` / `Приватный тур` / `Групповой тур` across `docs/` and `_archive/bek-frozen-2026-05-08/prompts/out/` and confirm zero drift hits before declaring done.
- [x] Design spec out-of-scope items (`/home2`, Plan 30 second wave, Plans 31-37, direct-contact, /tours content, Task_Z, Plan 28) — no task prompt references them in scope.

---

## Risks and rollback

| Risk | Mitigation |
|---|---|
| cursor-agent zero-commit hallucination (ERR-039 / ERR-049) | Orchestrator runs `git log main..<branch>` after every dispatch; on zero commits applies the diff manually from cursor-agent's reported file list. |
| cursor-agent JSX sibling without fragment wrap (ERR-053) | 30-T2 / 30-T3 add a JSX-fragment-rule line to TASK section since they introduce siblings. |
| cursor-agent ignores `--workspace` for writes (ERR-054) | Run cursor-agent against main workspace + branch isolation only; orchestrator handles all branch creation/checkout. |
| 29-T4 redirect handler hits Supabase on every legacy hit (perf cost) | Acceptable — id-based URLs are old bookmarks only; volume tiny. |
| `notFound()` on `/tours` accidentally shipped with `FEATURE_TR_TOURS=1` somewhere | Default value in `flags.ts` is `"0"`; no env override exists for production yet. Orchestrator confirms Vercel env has `FEATURE_TR_TOURS=0` or unset before push. |
| 30-T6 TS fallback updated but DB row still has old text | Wave 3 SQL UPDATE handled by orchestrator; tracked as a separate post-merge step. Verification includes DB check via Supabase MCP. |
| 30-T7 new flag `FEATURE_TR_PAYMENT` defaults to `0` and accidentally hides payment when feature ships | Acceptable — payment isn't shipping in this plan; when payment ships, the launch task includes flipping the flag. |
| Plan 30 homepage cluster sequential delays — slow if early task fails | If 30-T1 blocks, isolate to 30-T1; 30-T5/T6/T7 (Wave 2b) can proceed independently. |

Rollback: single-commit revert per task. For 29-T4 (legacy redirect) and 30-T7 (new flag), rollback restores the prior route file and removes the flag respectively.

---

## Out of scope (deferred — see design spec section 4)

- `/home2` route — stays in production per Alex; deferred to ПППД-A audit.
- Plan 30 second wave (13 remaining ПППД-A pages) — re-invoke brainstorm → spec → mega-plan after first wave merges.
- Plans 31-37 (ПППД-D, C, E, F, G, H, B) — stubs only in NEXT_PLAN.md.
- Direct-contact "написать гиду" feature — REJECTED, off-platform-deal risk.
- `/tours` content (multi-day Готовые туры) — only 404 gate in scope (29-T5).
- Task_Z presentation — post-launch only.
- Orphan files `src/components/shared/request-card.tsx`, `src/features/guide/components/orders/RequestCard.tsx` — dead code, future cleanup.
- Plan 28 (BEK-SDK migration, 13 task prompts already on disk) — DO NOT TOUCH.

---

End of plan.
