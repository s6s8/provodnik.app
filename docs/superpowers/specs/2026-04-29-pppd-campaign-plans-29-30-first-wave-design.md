# ПППД Campaign + Plan 29 (Legacy Cleanup) + Plan 30 (ПППД-A First Wave) + Governance Lock-In — Design

Date: 2026-04-29
Author: BEK (orchestrator) + Alex (product)
Status: APPROVED — ready for `/mega-plan`

---

## 1. Background

The site is in the **ПОСЛЕ** (honest-rebuild) phase. Two business halves exist in parallel:

- **Биржа** — custom request marketplace (traveler files an open request, guides bid).
- **Готовые экскурсии** (`/listings`) — single-day published excursions catalogue (Tripster-style). Confirmed back, stays. Pricing rule for guides also active on Tripster: not lower than Tripster price.
- **Готовые туры** (`/tours`) — multi-day tours. Deferred. The page must return a hard 404 under a feature flag (file kept, gated). NOT deleted (this is half the business model long-term).

The session corrected three drift points:

1. False "DONE" report on a homepage spacing task without browser verification.
2. Slang/jargon in BEK's responses ("лень формулировать", "прицепить кнопочку") in a serious-project context.
3. No umbrella structure for the page-by-page desktop audit (71 pages, 8 groups). Created and named **ПППД** (постраничная приёмка десктопа). Audit order: A → D → C → E → F → G → H → B.

The session also removed the previously-considered "написать гиду напрямую" feature (free-form direct-contact) on the off-platform-deal risk argument from Alex. Two structured channels remain: booking a published excursion, or filing an open request on Биржа. Locked product axiom: **ленивый гид — голодный гид** — guides without published listings are not given a bypass channel; they must publish.

## 2. Goals

1. Land **Plan 29 (Legacy cleanup)** before Plan 30 audit so URL space is stable.
2. Land **Plan 30 first wave (ПППД-A homepage + content fixes)** so the remaining 13 ПППД-A pages can be audited against a corrected homepage standard.
3. Lock the three governance rules into SOT/HOT/memory before any new dispatch (so they apply to every cursor-agent prompt going forward).
4. Stub Plans 31–37 in `_archive/bek-frozen-2026-05-08/sot/NEXT_PLAN.md` so the umbrella scope is visible without pre-tasking unmeasured pages.

## 3. Scope — In

### Plan 29 — Legacy cleanup (5 cursor-agent tasks)

| # | Task | Files in scope | Type |
|---|------|---|---|
| 29-T1 | Delete `/guide/listings-v1` route + every link/import that references it | `src/app/(protected)/guide/listings-v1/**`, any importers (grep) | Delete + ref scrub |
| 29-T2 | Retarget all internal links `/guide/dashboard` → `/guide`; remove the `/guide/dashboard` redirect file | grep across `src/` for the literal string `/guide/dashboard`, plus `src/app/(protected)/guide/dashboard/**` | Refactor + delete |
| 29-T3 | Remove the `/guide/statistics` redirect | `src/app/(protected)/guide/statistics/**` | Delete |
| 29-T4 | Fix `/guides` (catalogue) card `href`: legacy `/guide/[id]` → canonical `/guides/[slug]`. Add a 301 redirect from `/guide/[id]` to `/guides/[slug]`. Delete the legacy route file. | `src/app/(site)/guides/**`, `src/app/(public)/guide/[id]/**` (legacy), `next.config.*` (redirect) | Bug fix + delete + redirect |
| 29-T5 | `/tours` returns hard 404 under feature flag. File stays in repo, gated. Pattern matches existing `/help` flag. | `src/app/(site)/tours/**`, `src/lib/feature-flags.ts` (or equivalent) | Feature gate |

### Plan 30 first wave — ПППД-A pre-agreed (7 cursor-agent tasks)

| # | Task | Files in scope | Type |
|---|------|---|---|
| 30-T1 | Equalize vertical spacing: between request form ↔ "Запросы путешественников" block ↔ footer. Measure in browser at 1280px under guest. | `src/app/(home)/page.tsx` + homepage section components | Spacing fix |
| 30-T2 | Homepage request cards: uniform height, mandatory interests row at all states. If chip data is empty: either show a placeholder OR hide the row uniformly across all cards. | homepage request card component(s) | UI consistency |
| 30-T3 | Unified group format on every surface (homepage + guide inbox): `Своя группа · N чел.` (closed group, exact N) / `Сборная группа · Свободно мест: X из Y` (open group, X = capacity − registered) / `Группа набрана` (full — sinks or hides). | homepage request card + `src/app/(protected)/guide/(inbox|requests)/**` card component | UI rule |
| 30-T4 | Homepage feed priority: requests with offers first, "no answers yet" sinks; fully-set Сборная sinks or hides. Sort key in the data fetcher. | `src/data/requests.ts` (or homepage data fetcher) + homepage section | Sort fix |
| 30-T5 | Footer FAQ terminology: "Открытых запросов" → "Биржа" (or "Запросы" — pick the one in current nav). Replace literal string. | `src/components/shared/site-footer*.tsx` (and any FAQ component) | Terminology |
| 30-T6 | Help Center article «Как отправить заявку гиду?» — rewrite. Two real flows only: (a) Биржа open request — `/requests/new`; (b) booking a published excursion — `/listings/[id]/book`. Remove every "напрямую" / direct-message phrasing. | `src/app/(site)/help/**` (article markdown or component) | Content rewrite |
| 30-T7 | Help Center category visibility: hide "Оплата" category until the payment feature is implemented. Feature flag, not delete. | Help Center category list + `src/lib/feature-flags.ts` | Feature gate |

### Governance lock-in (4 orchestrator-local tasks — NOT cursor-agent)

| # | Task | Target | Type |
|---|------|---|---|
| G-1 | Add **Ревизия Бека** rule as new HOT entry. Mandate: before any DONE on UI tasks, BEK opens the affected page in browser at 1280px and 375px under the role that uses it; on form tasks, runs fill→save→reload→verify; otherwise no DONE. Green typecheck does not substitute. | `_archive/bek-frozen-2026-05-08/sot/HOT.md` (NEW entry, not edit) | SOT write |
| G-2 | Add **SOS Бек** rule as new HOT entry. Stuck format: ping `@CarbonS8 + @six` with four lines — what was supposed to be done / what was tried / where it stuck / what is needed to unblock. After SOS no DONE. No hacks while waiting. | `_archive/bek-frozen-2026-05-08/sot/HOT.md` (NEW entry, not edit) | SOT write |
| G-3 | Save jargon-ban rule to memory. No slang in serious-project register ("лень формулировать", "прицепить кнопочку", "тупой принцип" toward team members, etc.). Reason: false signals that work is being treated casually. Apply in every reply, especially to Alex. | `~/.claude/projects/D--dev2-projects-provodnik/memory/feedback_no_jargon.md` + index in `MEMORY.md` | Memory write |
| G-4 | Append plan-folder namespace handoff note to `NEXT_PLAN.md`. Current state: flat counter shared across projects (BEK-runtime + Provodnik), Plan 28 collision proves it. Future shape: `_archive/bek-frozen-2026-05-08/prompts/out/<project>/plan-NN.md`. Owner: CarbonS8. Not a BEK task. | `_archive/bek-frozen-2026-05-08/sot/NEXT_PLAN.md` (append section) | SOT write |

Plus a 5th orchestrator task that always runs at the start: write Plans 31–37 stubs (one paragraph each) into `NEXT_PLAN.md`.

## 4. Scope — Out (deferred, with reason)

| Item | Why deferred | Where it goes |
|---|---|---|
| `/home2` route | Alex confirmed: keep in production, do not delete | Will be inspected during ПППД-A audit (BEK opens it in browser; if it differs from `/`, file separate task) |
| Plan 30 second wave (13 remaining ПППД-A pages) | Audit-then-task — needs BEK to open each in browser at 375/1280 first | Re-invoke brainstorm → spec → mega-plan after first wave merges |
| Plans 31–37 (ПППД-D, C, E, F, G, H, B) | Audit-then-task per group | Stub paragraphs in `NEXT_PLAN.md`; each gets fresh brainstorm pass |
| Direct-contact "написать гиду" feature | REJECTED on off-platform-deal risk | Permanently out — never a deferred queue item |
| `/tours` content (multi-day tours) | Готовые туры feature is deferred | Only the 404 gate is in scope (29-T5); content out |
| Task_Z presentation | Post-launch only per Alex | Tracked in BEK memory; nothing to do now |
| Plan 28 (BEK-SDK migration, 13 tasks) | Unrelated work — same plan folder, different project (BEK-runtime, not Provodnik) | DO NOT TOUCH its files. Numbering jumps to 29+ |
| Free-form spec changes during ПППД audit | Out of plan-29/30 scope | Each new finding becomes a NEW task in a new plan, not a silent expansion |

## 5. Architecture & dependencies

All 12 implementation items are dispatched as **cursor-agent** subagents per CLAUDE.md §7 + ADR-010 (dispatch via `cursor-dispatch.mjs`) + ADR-025 (zero `git`/`bun` in prompts).

All 4 governance items + the 5th stub-write are **orchestrator-local** actions (file edits to `_archive/bek-frozen-2026-05-08/sot/*` and the memory dir). Not cursor-agent.

Dependency DAG:

```
Wave 0 (orchestrator-local, parallel):
  G-1, G-2, G-3, G-4, NEXT_PLAN-stubs

Wave 1 (cursor-agent, parallel-safe — file-isolated):
  29-T1, 29-T2, 29-T3, 29-T5

Wave 2 (cursor-agent, depends on Wave 1):
  29-T4   (touches both /guides catalog cards and legacy /guide/[id] surfaces)

Wave 3 (cursor-agent, mixed):
  Sequential cluster on homepage:    30-T1 → 30-T2 → 30-T3 → 30-T4
  Parallel-safe with cluster:        30-T5, 30-T6, 30-T7

Plan 30 first wave starts only after Plan 29 fully merged to main.
```

## 6. Knowledge / landmines

Every cursor-agent prompt MUST include the relevant entries verbatim in section 3 (KNOWLEDGE):

- **AP-014 / ERR-034 / ERR-036** — client/server import boundary (relevant whenever a task touches both client and server modules; split shared constants into `*-types.ts`).
- **ADR-010** — cursor-agent dispatch ONLY via `cursor-dispatch.mjs`. The orchestrator runs the dispatch; the prompt itself does not contain the dispatch command — the prompt is the cargo, not the truck.
- **ADR-025 / ERR-047** — cursor-agent prompts contain ZERO `git` and ZERO `bun` commands. Orchestrator runs all git ops + verification.
- **ERR-053** — JSX fragment rule when adding a sibling next to an existing element. If the orchestrator detects this pattern in a planned edit, it must wrap the result in `<>...</>`.
- **ERR-054** — cursor-agent ignores `--workspace` for writes. Orchestrator copies the worktree-changed files manually if a worktree was used; or works in main and worktree-protects via branch only.
- **AP-010** — TZ-naive calendar dates: pin TZ via `todayMoscowISODate` helper. (Relevant if Plan 30 touches any date display.)
- **AP-012 / ADR-013** — money helpers in `src/data/money.ts`; no inline `* 100` / `/ 100`. (Relevant if Plan 30-T2/T3/T4 touches budget rendering.)

## 7. Verification — every cursor-agent task

1. `git log main..<branch>` shows commit(s) — anti-ERR-039 / ERR-049 (cursor-agent zero-commit hallucination).
2. `bun run typecheck` 0 errors.
3. `bun run lint` 0 errors.
4. **Ревизия Бека** (this is a hard rule, not a recommendation): orchestrator opens the affected page(s) in a browser at 1280px under guest (and 375px when responsive), confirms VISUALLY, confirms console clean. For form tasks: fill → save → reload → verify the persisted state.
5. Diff touches only the files listed in SCOPE. Scope creep blocks the merge; redispatch with tighter SCOPE.

## 8. End-to-end success criteria

- **Plan 29:** `rg "/home2|/guide/listings-v1|/guide/dashboard|/guide/statistics|/guide/\\["` over `src/` shows zero hits except `/home2` (which stays). `/tours` returns 404 in production. URL audit clean. No 404s on any public-facing nav link.
- **Plan 30 first wave:** homepage at 1280px shows visually-equal vertical spacing between form / requests block / footer. All 4 visible request cards same height. Group line uses canonical format on EVERY surface (homepage + guide inbox). Offers-first ordering observable in production data. Footer FAQ uses "Биржа". Help Center article describes only the two real flows. Payment category hidden.
- **Governance:** `_archive/bek-frozen-2026-05-08/sot/HOT.md` has Ревизия Бека + SOS Бек entries. `~/.claude/projects/D--dev2-projects-provodnik/memory/feedback_no_jargon.md` exists and is indexed in `MEMORY.md`. `_archive/bek-frozen-2026-05-08/sot/NEXT_PLAN.md` has the namespace handoff section + Plans 31–37 stubs.

## 9. Risks

| Risk | Mitigation |
|---|---|
| cursor-agent reports DONE without committing (ERR-039 / ERR-049) | Wave 0 lands Ревизия Бека rule first; orchestrator verifies `git log main..<branch>` after every dispatch and applies edits manually if zero commits. |
| cursor-agent writes JSX siblings without fragment wrap (ERR-053) | Orchestrator pre-checks task prompts that add sibling elements; flags fragment requirement explicitly in TASK section. |
| cursor-agent ignores `--workspace` (ERR-054) | Run cursor-agent against main workspace + branch isolation only; orchestrator handles all branch ops. |
| Removing legacy `/guide/[id]` while a redirect is needed (29-T4) | Add the 301 redirect FIRST, then delete. Verify in browser that `/guide/<old-id>` lands on `/guides/<slug>` before declaring DONE. |
| `/tours` 404 misconfigured — accidental SEO hit | Use Next.js `notFound()` from a server component gated by feature flag; leave the route file in repo; do NOT delete. Verify response is `404 Not Found`, not `200` with empty content. |
| Plan 30 audit drift — auditor finds a new bug mid-task | Per spec rule: new finding becomes a NEW task in a NEW plan. No silent scope expansion (RULES section in skeleton). |
| Translator/jargon drift in commit messages | Commit format is fixed: `[<worktree-name>] task-N: concise description`. |

## 10. Rollback

Single-commit revert per task (each task = one branch = one commit, per RULES section). If a task was applied directly by the orchestrator (anti-ERR-049 path), still single-commit.

## 11. Terminology locks

- **Биржа** (not "Открытые запросы", not "Открытых запросов"). When the nav says "Запросы", "Биржа" still works in long-form copy; either is OK. "Открытых запросов" forbidden.
- **Готовые экскурсии** (one-day catalogue). NOT "Готовые туры".
- **Готовые туры** (multi-day, deferred). Use only when discussing the deferred feature. Do NOT mix with `/listings` content.
- **Своя группа** / **Сборная группа** — locked group-mode names. Never "приватный тур" / "групповой тур".
- **ПППД** — постраничная приёмка десктопа — campaign name. Do not rename mid-campaign.

`/mega-plan` Phase V (terminology check) must `rg` for the forbidden strings across `docs/` and `.claude/prompts/out/` and confirm zero drift hits.

## 12. Notes for the orchestrator (BEK)

- This spec replaces nothing — Plan 28 (BEK-SDK 13 tasks) stays in place. Do NOT overwrite plan-28-* files.
- Wave 0 governance items run first because their content (Ревизия Бека) is the verification rule that gates Wave 1+ tasks.
- Plan 30 first wave does not start until Plan 29 is fully merged to `main` (URL space stable for the audit).
- After this spec's tasks all merge, the next session re-invokes brainstorm → spec → mega-plan for Plan 30 second wave (13 remaining ПППД-A public pages, audit-then-task per page).

---

End of design.
