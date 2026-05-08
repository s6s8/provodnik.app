# Plans 05 + 06 + 07 — Consolidated Implementation Plan

**Date:** 2026-04-25
**Plan banner:** Guide Inbox cleanup + Photo Library & Route Builder + Homepage v2 Exchange Portal

---

## Terminal State Instruction

When all 11 tasks are DONE and merged to main, post this message in the project channel:
> `Plans 05+06+07 complete. Guide inbox clean, route builder live, homepage is the portal. Run e2e smoke from spec §12 then post Slack dev-note.`

---

## 1. Goal

Ship three inter-dependent feature sets in a single sequenced run:

- **Plan 05** fixes the guide inbox data layer (Russian dates, mode badge, interests, mandatory budget), redesigns the request cards, moves the traveler's full description into the bid-response panel, and deletes vestigial routes.
- **Plan 06** adds a guide photo-library (`guide_location_photos` table), a portfolio management page, a public photo grid on the guide profile, and a route-builder integrated into the bid-response panel.
- **Plan 07** replaces the marketing homepage with a full request-creation form, guest auth-gate dialog, and route swap so `/` becomes the booking portal.

All three are **frontend-only** except Plan 06 Task 1 (DB migration). No other schema changes.

---

## 2. Architecture Decisions

- `src/lib/dates.ts` is **created** by Plan 05 Task 1 (exports `formatRussianDateRange`, `formatTimeRange`, `todayMoscowISODate`). Plan 06 Task 4 **appends** `formatDurationMinutes` to the same file. Dispatch must respect this order.
- `bid-form-panel.tsx` is touched by **two tasks**: Plan 05 Task 3 adds the context block; Plan 06 Task 4 adds the route builder. Merge 05-T3 first. 06-T4 implementer must read the merged file before touching it.
- Plan 05 uses `main` branch (direct commits). Plan 06 uses `feat/plan-06-photo-library` branch. Plan 07 uses `main`.
- Terminology lock: `"Своя группа"` for `mode="private"`, `"Сборная группа"` for `mode="assembly"`. String `"Приватный тур"` is forbidden in all code and prompts.
- Mode enum: `"private" | "assembly"` in TypeScript. DB column: `open_to_join boolean`.
- Budget display is mandatory — no "По договорённости" fallback.
- Description in BidFormPanel: full text, no line-clamp, with empty-state fallback "Описание не указано".
- `starts_at` / `ends_at` on `guide_offers` populated for first time by Plan 06 Task 4. Downstream consistency decision deferred (logged in DECISIONS.md after merge).
- Registration always via `signUpAction` (server-only). Logout always via `/api/auth/signout`.

---

## 3. Tech Stack (verified by Context7 R2)

| Library | Version | Key pattern used |
|---|---|---|
| Next.js | 15 (App Router) | `'use server'` actions; `revalidatePath` before `redirect`; Server Components fetch data, pass as props |
| @supabase/ssr | latest | `createServerClient` with cookie getAll/setAll in server pages; `createSupabaseBrowserClient` in `'use client'` only |
| react-hook-form | v7 | `useForm` + `zodResolver`; `useWatch` for reactive derived values; `useController` for custom inputs |
| shadcn/ui Dialog | latest | `<Dialog open={controlled} onOpenChange={fn}>` — no DialogTrigger needed when controlled externally |
| Tailwind CSS | v4 | No `center`/`padding` on container — use `@utility container` to customize; `@apply` with complex classes via experimental flag |
| Bun | latest | `bun run typecheck`, `bun run lint`, `bun run test:run` |
| zod | latest | schema-first validation; `z.infer` for type derivation |

---

## 4. Dependency DAG

```
Plan 05 Task 1 ─── creates RequestRecord.mode/interests + src/lib/dates.ts
    │
    ├── Plan 05 Task 2 (inbox screen)
    │
    ├── Plan 05 Task 3 (BidFormPanel context block) ──────────────┐
    │                                                              │
    └── Plan 07 Task 2 (HomepageRequestForm) [uses mode enum]     │
                                                                  ▼
Plan 05 Task 4 (delete pages) [after Task 2]           Plan 06 Task 4 (route builder)
                                                        [REQUIRES 05-T3 + 06-T1 + 06-T2]

Plan 06 Task 1 (DB migration + types) [independent of Plan 05]
    │
    ├── Plan 06 Task 2 (portfolio page)  ──────────────┐
    │                                                  │ (provides listGuideLocationPhotos)
    └── Plan 06 Task 3 (public photo grid)             │
                                                       ▼
                                             Plan 06 Task 4 (route builder)

Plan 07 Task 1 (AuthGate dialog) [independent]
    │
    └── Plan 07 Task 2 (HomepageRequestForm)
            │
            └── Plan 07 Task 3 (hero + shell + route swap)
```

---

## 5. Merge Order

Sequential total ordering (no ambiguity):

1. **Plan 05 Task 1** — branch: main — foundational data layer + dates.ts
2. **Plan 05 Task 2** — branch: main — inbox screen redesign [depends: 05-T1]
3. **Plan 05 Task 3** — branch: main — BidFormPanel context block [depends: 05-T1]
4. **Plan 05 Task 4** — branch: main — delete vestigial pages [depends: 05-T2]
5. **Plan 06 Task 1** — branch: feat/plan-06-photo-library — DB migration + types
6. **Plan 06 Task 2** — branch: feat/plan-06-photo-library — portfolio page [depends: 06-T1]
7. **Plan 06 Task 3** — branch: feat/plan-06-photo-library — public profile grid [depends: 06-T1] (PARALLEL with 06-T2 if separate worktree)
8. **Plan 06 Task 4** — branch: feat/plan-06-photo-library — route builder [depends: 05-T3 merged + 06-T1 + 06-T2]
9. **Plan 07 Task 1** — branch: main — HomepageAuthGate dialog (no deps, can run after 05-T1 in parallel)
10. **Plan 07 Task 2** — branch: main — HomepageRequestForm [depends: 07-T1 + 05-T1 mode enum]
11. **Plan 07 Task 3** — branch: main — hero + shell + route swap [depends: 07-T1 + 07-T2]

**Note on parallelism:**
- Steps 2+3 can run in parallel (different files, both depend only on step 1).
- Steps 6+7 can run in parallel in separate worktrees.
- Steps 9 can start once step 1 is done (no dependency on 05-T2/T3/T4).

---

## 6. Task Summaries

**Plan 05 Task 1** (`plan-05-task-1.md`) — Extends `RequestRecord` with `mode: "private" | "assembly"` and `interests: string[]`, fixes time slicing (`.slice(0,5)`), fixes description field (no more `formatFormatPreference`), makes budget mandatory, adds `formatRussianDateRange` + `formatTimeRange` to new `src/lib/dates.ts`, adds `todayMoscowISODate` helper. Single file scope: `queries.ts` + new `dates.ts`.

**Plan 05 Task 2** (`plan-05-task-2.md`) — Redesigns the guide inbox screen: removes "Сводка по запросам" card, renames filter to "Все направления", removes "Подробнее" link, adds mode badge (using `"Своя группа"` / `"Сборная группа"` — never `"Приватный тур"`), adds interests chips, adds separate time line, adds `N из M чел.` for assembly mode. Single file scope: `guide-requests-inbox-screen.tsx`.

**Plan 05 Task 3** (`plan-05-task-3.md`) — Adds a request context block to `BidFormPanel` between the panel header and the offer form. Shows mode badge (correct terminology), interests chips, and full description without line-clamp (empty fallback: "Описание не указано"). Single file scope: `bid-form-panel.tsx`.

**Plan 05 Task 4** (`plan-05-task-4.md`) — Deletes 4 files: `[requestId]/page.tsx`, `[requestId]/loading.tsx`, `[requestId]/offer/page.tsx`, `guide-request-detail-screen.tsx`. Keeps `actions.ts`. Greps for remaining references and removes them.

**Plan 06 Task 1** (`plan-06-task-1.md`) — DB migration `20260424000001_guide_photo_library.sql` and type updates. Adds `guide_location_photos` table, `guide-portfolio` enum value, `route_stops`/`route_duration_minutes` columns to `guide_offers`. Updates `types.ts`.

**Plan 06 Task 2** (`plan-06-task-2.md`) — Portfolio management page: 4 CRUD functions in `guide-assets/supabase-client.ts`, server page with auth guard, client screen with upload/grid/delete, nav link in `site-header.tsx`.

**Plan 06 Task 3** (`plan-06-task-3.md`) — Public guide profile photo grid: new `getGuideLocationPhotos` query, photo fetch in `guides/[slug]/page.tsx` via `Promise.all`, `photos` prop on `GuideProfileScreen`, new `GuidePhotoGrid` component. Can run in parallel with Task 2 in a separate worktree.

**Plan 06 Task 4** (`plan-06-task-4.md`) — Route builder in `BidFormPanel`: photo picker from portfolio, duration selects (hours + minutes), date + start time inputs, auto-calculated end time, `formatDurationMinutes` appended to `dates.ts`, schema extension in `offers.ts`, `submitOfferAction` updated to read route data from FormData. Implementer must read merged file first — context block from 05-T3 must be preserved.

**Plan 07 Task 1** (`plan-07-task-1.md`) — `HomepageAuthGate` dialog: controlled open state, sign-in via browser client, sign-up via `signUpAction` (never `supabase.auth.signUp`), role hardcoded `"traveler"`, fires `onAuthSuccess` callback.

**Plan 07 Task 2** (`plan-07-task-2.md`) — `HomepageRequestForm`: full request form matching `traveler-request-create-form.tsx` schema, progressive disclosure, 3-col interests grid, datalist city autocomplete, guest → auth-gate flow, authed → direct submit. Sticky mobile submit button.

**Plan 07 Task 3** (`plan-07-task-3.md`) — Wire-up: creates `HomepageHeroForm` (server component), swaps `HomePageHero2` for `HomepageHeroForm` in `homepage-shell2.tsx`, swaps root route from `HomePageShell` to `HomePageShell2` with correct queries (`getActiveGuideDestinations`, `getHomepageRequests`), removes dead `/listings` link from `homepage-hero2.tsx`.

---

## 7. Self-Review Checklist

- [ ] Every gap in master spec section 10 is addressed. List: gap → task number + line range where fixed.
  - Gap 1 (Russian dates): plan-05-task-1.md Task section steps 1-2 — `formatRussianDateRange` created in `dates.ts`
  - Gap 2 (Separate time line): plan-05-task-2.md Task section step 5 — separate time row using `formatTimeRange`
  - Gap 3 (`N из M чел.`): plan-05-task-2.md Task section step 6 — assembly group size format
  - Gap 4 (Budget mandatory): plan-05-task-1.md Task section step 3 — no "По договорённости" fallback
  - Gap 5 (Terminology drift): plan-05-task-2.md step 4 + plan-05-task-3.md step 2 — "Своя группа" used in both
  - Gap 6 (No line-clamp): plan-05-task-3.md Task section step 2 — `whitespace-pre-line` not `line-clamp-3`
  - Gap 7 (Empty description fallback): plan-05-task-3.md Task section step 2 — "Описание не указано" in muted italic
  - Gap 8 (Delete detail-screen component): plan-05-task-4.md Task section step 1 — deletes `guide-request-detail-screen.tsx`

- [ ] Every collision in master spec section 9 has an explicit resolution. List: collision → affected prompts + the resolution sentence.
  - bid-form-panel.tsx collision → plan-05-task-3.md + plan-06-task-4.md: "Merge 05-T3 first; 06-T4 reads merged file and inserts route builder inside the form section, not touching the context block."
  - dates.ts collision → plan-05-task-1.md + plan-06-task-4.md: "05-T1 creates the file with formatRussianDateRange + formatTimeRange; 06-T4 appends formatDurationMinutes to the existing file."
  - Mode enum collision → plan-05-task-1.md, plan-06-task-4.md, plan-07-task-2.md: "Consistent `'private' | 'assembly'` in TypeScript; mapped from `open_to_join boolean` in all read paths."
  - Interest slug overlap → plan-05-task-2.md, plan-05-task-3.md, plan-07-task-2.md: "Three maps serve different layers; DRY-ing into a shared module is deferred to a future plan."

- [ ] Zero `Приватный тур` strings across all task prompts and the master plan.
  - Verified by self-review step in STEP 8 (rg command).

- [ ] Every file path in every prompt exists on disk (confirmed in R1).
  - `src/lib/dates.ts` — MISSING (created by 05-T1; properly marked as CREATE).
  - All other referenced paths exist. Details in path-verification table below.

- [ ] Dependency DAG in the master plan matches the SCOPE dependency declarations in every task.
  - Each task prompt SCOPE section declares `depends_on:` matching the DAG above.

- [ ] Every Context7 citation has a real URL (not invented).
  - Next.js: `https://github.com/vercel/next.js/blob/canary/docs/01-app/01-getting-started/07-mutating-data.mdx`
  - @supabase/ssr: `https://context7.com/supabase/ssr/llms.txt`
  - react-hook-form: `https://context7.com/react-hook-form/react-hook-form/llms.txt`
  - shadcn/ui Dialog: `https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/components/base/dialog.mdx`
  - Tailwind CSS v4: `https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/upgrade-guide.mdx`

- [ ] Merge order is a total ordering (no ambiguity about which task first).
  - Steps 1-11 in Merge Order section above with explicit dependency annotations.

- [ ] Each task VERIFICATION section has at least 3 observable-state items.
  - All 11 tasks have ≥3 observable-state VERIFICATION items.

- [ ] Each task DONE CRITERIA specifies branch + file count + return string.
  - All 11 tasks specify all three.
