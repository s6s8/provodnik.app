# STATE — design refactor autonomous run

## North Star (fixed)
**Every Provodnik surface renders from the same AA-contrast token/component kit — no duplicate components, no off-scale literals, no a11y gaps — with the repo verify chain green.**

Measurable: DESIGN_REFACTOR_PLAN.md §7 gates 1–3 pass mechanically (repo chain green; contrast script exit 0; grep gates at zero/whitelist), §7.4–7.6 (screenshots/axe/smoke) pass on the seeded local target or are honestly recorded as blocked.

## Acceptance checklist (derived from plan §7)
1. `bun run typecheck && bun run lint && bun run test:run && bun run build` green. (`playwright` = best-effort, see BLOCKERS)
2. Contrast node script (plan §7.2) exits 0.
3. Grep gates zero / whitelisted:
   - `space-[xy]-` ≤2 files (ui/calendar.tsx, ui/avatar.tsx)
   - `text-\[[0-9.]+px\]` = 0
   - `rounded-\[[0-9]` = 0
   - `min-h-\[44px\]` = 0
   - `backdrop-blur-\[20px\]` = 0
   - raw palette `(bg|text|border)-(sky|rose|purple|emerald|slate|gray|zinc)-[0-9]` in src/components+src/features = 0
   - `#[0-9A-Fa-f]{6}` in tsx = 0 (whitelist opengraph-image.tsx, global-error.tsx)
   - `Provodnik` in tsx copy = 0
   - `size="icon` without aria-label = 0
4. Every T-01…T-41 committed or explicitly blocked/reverted.
5. Clean tree, no push.

## P0 recon (observed 2026-07-13)
- Repo: Next 15 App Router + Tailwind v4 CSS-first tokens + shadcn/ui, bun, vitest, playwright, Supabase.
- Worktree `/private/tmp/provodnik-design-refactor-implementation`, branch `feat/design-refactor-implementation-20260713` (non-protected; `main` protected, never touched, never push).
- Baselines run once: typecheck OK; lint 0 errors / 21 pre-existing warnings; tests 232 files / 1195 tests pass; build OK.
- `node_modules` absent in fresh worktree → `bun install` required (done).
- `.env.local` absent in worktree (worktrees don't inherit untracked files); the repo one points at PROD → unsafe for browser/E2E writes. Local seeded Supabase via colima is the safe target (see PLAYBOOK).
- Plan input `.design-audit/` (RUBRIC, INVENTORY, FINDINGS, findings/G1..G6, screens/) present in this worktree.

## Assumptions
- A1: Cyrillic UI copy is canonical; brand in UI = «Проводник».
- A2: `.design-audit/screens/` baseline exists; AFTER-capture diff is best-effort — plan's capture script is not in-repo, so screenshot proof is by targeted Playwright captures of touched routes, not a full 63×3 re-shoot, unless the stack allows it.
- A3: Grep gates are the primary mechanical proof; visual proof supplements it.

## Ledger
Status: todo / doing / done(<sha>) / blocked(<condition>). Exact touches + steps live in DESIGN_REFACTOR_PLAN.md §6 under the same T-id (that IS the card body); this table adds class/proof/status.

| ID | NS intent | class | proof | deps | status |
|---|---|---|---|---|---|
| T-01 | AA tokens | git | contrast script exit 0 | — | todo |
| T-02 | Badge tokens | git | grep text-[0.7rem]=0 | T-01 | todo |
| T-03 | Button success | git | grep success:=1; typecheck | T-01 | todo |
| T-04 | form atoms (CLI) | git | 3 files exist; typecheck | — | todo |
| T-05 | ListRow overflow/nesting | git | grep rounded-[12px]=0; no form-in-a | — | todo |
| T-06 | StickyActionBar | git | grep rgba/text-[1x]/env(safe = 0 | — | todo |
| T-07 | delete dead + Scrim | git | grep hero-overlay=0; tests pass | — | todo |
| T-08 | dedupe EmptyState/AvatarStack | git | grep dup imports = 0 | — | todo |
| T-09 | footer contrast | git | grep /35|/45 = 0 | — | todo |
| T-10 | header mobile | git | 375 pill contains controls; aria-labels | — | todo |
| T-11 | focus recipe gaps | git | grep focus-visible:ring-3 ≥1 each | T-01 | todo |
| T-12 | param badges tokened | git | grep sky-|rose-|purple-|emerald- = 0 | T-01,02 | todo |
| T-13 | OpenGroupCard | git | grep cn( ≥1; ≤2 pills | T-02 | todo |
| T-14 | PublicGuideCard | git | grep [Npx]/rgba = 0 | T-01,02 | todo |
| T-15 | StepCard everywhere | git | grep StepCard ≥3 in request-detail | — | todo |
| T-16 | StatTile | git | grep 'bg-background/60 p-3' = 0 | — | todo |
| T-17 | GlassCard adoption | git | grep backdrop-blur-[20px] = 0 | — | todo |
| T-18 | PageHeader sweep | git | grep raw h1 = 0 | — | todo |
| T-19 | segmented controls | git | grep grid-cols-3 = 0 in trips | T-04 | todo |
| T-20 | loading/pending | git | no "..." button labels | — | todo |
| T-21 | EmptyState adoption | git | listed screens use EmptyState | T-08 | todo |
| T-22 | discovery chips | git | h-11 + overflow container | T-11 | todo |
| T-23 | guide bottom-nav | git | shortLabel present; text-xs | — | todo |
| T-24 | admin shell | git | grep rounded-[1 = 0; md:block | — | todo |
| T-25 | status semantics | git | one DISPUTE_STATUS_META | T-02,03 | todo |
| T-26 | auth flow | git | one h1; no Provodnik; Alert atoms | T-01 | todo |
| T-27 | request detail | git | grep [Npx] = 0 in 2 files | T-15 | todo |
| T-28 | guide forms | git | grep FIELD_CLASS = 0 | T-04,20 | todo |
| T-29 | booking detail | git | grep 0.6875rem/min-h-[44px]/space-y = 0 | T-18 | todo |
| T-30 | messaging | git | grep rem-literals = 0 | T-20,21 | todo |
| T-31 | review/dispute/book forms | git | grep text-green-600 = 0; aria wiring | T-20 | todo |
| T-32 | notifications page | git | space-y=0; retry action | T-05,19,25 | todo |
| T-33 | marketing pass | git | max-w-[760px]=0; not-found chrome | T-02,11 | todo |
| T-34 | admin pages pass | git | min-h-[44px]/tracking-[0.1x]/space-y=0 | T-04,18,24,25 | todo |
| T-35 | traveler cabinet | git | grep appearance-none = 0 | T-04,20 | todo |
| T-36 | space-y sweep | git | grep space-[xy]- ≤2 files | — | todo |
| T-37 | flag-gated detail routes | git | hex=0; req-card gone | T-06,08,15 | todo |
| T-38 | icon-button + headings | git | size="icon without aria-label = 0 | — | todo |
| T-39 | copy sweep | git | Provodnik/Опубл./Найти тур = 0 | T-33 | todo |
| T-40 | motion polish | git | accordion keyframes; motion-reduce | T-33 | todo |
| T-41 | final verification | git | all §7 gates | all | todo |

## Verdict
(pending)
