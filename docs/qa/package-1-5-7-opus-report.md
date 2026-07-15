# Package 1–5, 7 — Opus execution report

**Branch:** `ops/package-1-5-7-20260715` (isolated worktree off `origin/main`). **Never pushed.**
**Packet:** `docs/plans/package-1-5-7-opus-execution.md`. **Disciplines:** Superpowers (trace → smallest root-cause diff → evidence-before-claim), Ponytail full (reuse existing helpers, fix the shared root once, no speculative abstractions), Context7 (RHF + cmdk confirmation, below).

Items 1–4 implemented; items 5 and 7 are verified no-change closures.

---

## Item-by-item acceptance evidence

### 1. Fresh-request budget default → 1 000 ₽
- **Root cause / change:** one literal in the single source. `src/features/homepage-classic/components/use-request-form.ts` `DEFAULT_VALUES.budgetPerPersonRub: 5000 → 1000`. Zod min is already `1_000` so the value validates.
- **Preserved:** draft/typed values untouched — the form flows draft through RHF `values={draft ? {…DEFAULT_VALUES, …draft}}` with `resetOptions.keepDirtyValues: true`, so changing the *default* only affects a fresh form (Context7-confirmed). AI-chat placeholder `«…5000 ₽»` and the budget input placeholder `«например, 5000»` are placeholders, not the fresh default — left untouched per packet.
- **Test:** `homepage-request-form-classic.destination.test.tsx` — "renders the defaults when there is no draft" now asserts `1000`; the sibling "puts the stored draft back into the visible inputs" still asserts the typed `7000` is preserved. Both distinguish fresh-default from user-entered.
- **Browser:** homepage renders HTTP 200; the budget input is present. RHF applies the default on hydration (uncontrolled `register`), exercised green in jsdom by the test above.

### 2. Ready-excursion price — one correct shared source
- **Root cause:** `ListingRecord.format` was populated from DB `listings.category`, not the real `listings.format` enum. So the card's `getFormatLabel(listing.format)` always returned `""` and the card printed `formatRubNumber + «с человека»`, while the detail used `formatExcursionPriceFrom(...)`. Two meanings on one field.
- **Split at the mapper** (`src/lib/supabase/queries-core.ts`): added `category: string` (from `row.category`) and repointed `format` to the real `row.format` enum. The `difficulty` heuristic still reads `row.category` directly — untouched. The catalog theme path switched to the category source: `(site)/listings/page.tsx` now calls `mapDbCategoryToThemeSlug(listing.category)`.
- **One formatter, extended** (`src/components/listing-detail/excursion-price.ts`): `formatExcursionPriceFrom(priceFromMinor, format, maxGroupSize?)` — `private → «от X ₽ за группу до N человек»` (N = overall `max_group_size`); `group/combo → «за одного»`; unknown/null → bare. `format` widened to `string | null | undefined` so card records (typed `format: string`) share the one formatter instead of a card-only copy. No parallel formatter created.
- **Wired on card, detail, tariff:**
  - Card (`listing-card.tsx`) calls the shared formatter with `rubToKopecks(listing.priceRub)` (money crosses only via `src/data/money.ts`, AP-012), real `format`, and `groupSize`; the format badge now resolves.
  - Detail (`ExcursionShapeDetail.tsx`) passes `listing.max_group_size` to the same formatter.
  - Tariff (`TariffsList.tsx`) routes its no-tariff fallback through the shared formatter (given `format` + `maxGroupSize` from detail); per-row cells keep the currency-aware number rendering, and the Группа column already shows each tier's `max_persons` range.
  - The discovery-catalog card path stays correct too: `format` is threaded through `PublicListing` (`format?: private|group|combo`) so `mapListing` feeds the card the real enum instead of a theme slug.
- **Tests:** `excursion-price.test.ts` covers `private`+max → «за группу до 5 человек», `private` no-max → «за группу», `group`+max → «за одного» (cap ignored), `null` → bare, unknown string → bare. Card, detail, and tariff all call this one function, so their strings are identical by construction.
- **Browser proof — BLOCKED (data), reported honestly (see Blockers).** No published listings on the reachable environment + `FEATURE_PUBLIC_CATALOG` off, so cards/detail do not render on real data.

### 3. One destination field — city, region, guide directions
- **Root cause:** the combobox source (`getActiveGuideDestinations`) reads only published-listing `city|region`; with 0 published listings it returns nothing, so the field had no suggestions.
- **Change:** new `getDestinationSuggestions(client)` in `src/lib/supabase/queries.ts` unions published-listing cities/regions with the base city and regions guides declare on **approved** profiles (`guide_profiles.base_city` + `regions`, anon-readable under the `verification_status = 'approved'` RLS policy). Normalized to the existing `{name, region, guideCount}` shape and **deduped by normalized `name`** — the cmdk widget keys each `Command.Item` on `d.name`, so name-level dedupe is what guarantees the unique `value` cmdk requires (Context7). The combobox component (keyboard/ARIA/selection) is untouched.
- **Guide-count safety:** kept SEPARATE from `getActiveGuideDestinations`. The homepage «Популярные направления» block keeps consuming the original listing-backed set (its counts stay accurate); only the form combobox receives the widened set. Wiring: `(home)/page.tsx` fetches both; `homepage-shell2-classic.tsx` feeds the combobox `searchDestinations ?? destinations` and the inventory block `destinations`.
- **Tests:** `queries.test.ts` — suggestions cover a listing city (Сочи), a guide base city (Элиста), and guide directions/regions (Калмыкия, Астраханская область); dedupe collapses `Элиста`/`элиста` and repeated `Калмыкия` to one each with no colliding names; empty inputs return `[]` without throwing.
- **Browser proof — LIVE:** homepage payload now carries «Элиста» (guide base city), «Калмыкия» (region / guide direction), and «Сочи» as suggestions where the old listing-only source yielded none; combobox widget (`id="destination" role="combobox"`) present and unchanged.

### 4. Homepage section order
- **Change:** in `homepage-inventory-classic.tsx`, moved «Популярные направления» from between «Готовые экскурсии» and «Гиды» to **after** «Вопросы и ответы». «Как это работает» stays right after «Сборные группы» (in the shell). Result post-groups: `Как это работает → Готовые экскурсии → Гиды → Отзывы → FAQ → Популярные направления`. No Блог built (future slot, not a dummy page). Every empty-guard (`show*` min-count) preserved.
- **Test:** existing `homepage-inventory-classic.test.tsx` min-count gates still pass (fixture updated with the new `category` field).
- **Browser proof — LIVE (visible blocks):** SSR HTML order is `Гиды → Отзывы → Вопросы и ответы → Популярные направления`; «Готовые экскурсии» and «Сборные группы» are correctly hidden (catalog flag off / no open groups) — the empty-guards hold and the surviving blocks keep the required relative order.

### 5. «Готовые экскурсии» after «Запросы» — NO CHANGE
- Header already reads «Запросы» → «Готовые экскурсии» in `src/lib/navigation.ts` (`publicPrimaryNav`, `travelerPrimaryNav`), asserted by `navigation.test.ts:165-166`. Item 5 is fully closed by item 4 (homepage content). No navigation edit made — a second edit would be pure churn.

### 7. Footer logos — NO CHANGE
- `src/components/shared/site-footer.tsx` has no logo/brandmark/partner-logo strip. The only icon-bearing element is a legitimate Telegram **support** link (`t.me/provodnik_help`, `<a target="_blank">`) — not a "logo," not a share action, not social auth. The requirement (bottom logos stay purely visual, no links/handlers/external nav/share/social-auth) is satisfied by absence: there is nothing to make non-interactive and nothing to add. No footer edit made.

---

## Changed files (17) — `git diff --stat`

```
 src/app/(home)/page.tsx                            |  8 ++-
 src/app/(site)/listings/page.tsx                   |  5 +-
 src/components/listing-detail/ExcursionShapeDetail.tsx |  8 ++-
 src/components/listing-detail/TariffsList.tsx      | 12 +++-
 src/components/listing-detail/excursion-price.test.ts | 16 +++++-
 src/components/listing-detail/excursion-price.ts   | 14 +++--
 src/components/shared/listing-card.tsx             | 15 +++--
 src/data/public-listings/types.ts                  |  2 +
 .../components/homepage-inventory-classic.test.tsx |  1 +
 .../components/homepage-inventory-classic.tsx      | 66 +++++++++++---------
 ...page-request-form-classic.destination.test.tsx  |  2 +-
 .../components/homepage-shell2-classic.tsx         |  5 +-
 .../components/use-request-form.ts                 |  2 +-
 .../public/public-listing-discovery-screen.tsx     |  3 +-
 src/lib/supabase/queries-core.ts                   |  6 +-
 src/lib/supabase/queries.test.ts                   | 48 ++++++++++++++
 src/lib/supabase/queries.ts                        | 64 +++++++++++++++++++
 17 files changed, 222 insertions(+), 55 deletions(-)
```

Root-cause/reuse decisions: item 2 fixed once at the shared mapper + one shared formatter (not a card band-aid); item 3 added one data function and reused the existing combobox untouched; item 4 was a pure JSX reorder. No new dependency, migration, schema/data/seed change, flag change, or second formatter/widget/footer.

---

## Context7 evidence

- **React Hook Form** — `/react-hook-form/documentation` (`useform.mdx`). `values` "Overwrites `defaultValues` by default"; `resetOptions.keepDirtyValues: true` — "user-interacted input will be retained." Signature relied on: `useForm({ defaultValues, values, resetOptions })`. Confirms item 1: changing `DEFAULT_VALUES.budgetPerPersonRub` affects only a fresh form; drafted/typed budgets survive via the existing `values` + `keepDirtyValues` path.
- **cmdk** — `/dip/cmdk` (`src/index.tsx`, README). `Command.Input` renders `role="combobox"`, `aria-autocomplete="list"`, `aria-controls`, `aria-activedescendant` at runtime; with `shouldFilter={false}` the parent owns filtering; each `Command.Item` "should provide a unique `value`." Confirms item 3: dedupe the data by normalized `name` (the widget's `value={d.name}`) and leave the widget's ARIA/keyboard alone.

---

## Commands and outcomes

| Command | Result |
|---|---|
| `bun run typecheck` | **pass** (exit 0) |
| `bun run lint` | **pass** — 0 errors, 21 pre-existing warnings in untouched `src/data/**/supabase-client.ts` |
| `bun run test:run` | **pass** — 234 files, 1297 tests |
| `bun run build` | **pass** — "Compiled successfully" |
| `git diff --check` | **clean** (see note) |

Note: `src/data/public-listings/types.ts` is a pre-existing CRLF outlier (43 CRLF lines in HEAD; its sibling `mapper.ts` and the repo at large are LF). Rather than emit a 45-line EOL-normalization diff (unrelated churn), the two added lines were written LF so `git diff --check` passes with a 2-line diff.

---

## Browser evidence and the blocked proof condition

- **GUI browser (1280/375, interactive console) — BLOCKED by environment.** Playwright's Chrome cannot launch in this background job (repeated `SIGTRAP` / `CVDisplayLinkCreateWithCGDisplay failed` — no display/GPU). Substituted with the running dev server (`:3100`, prod env, read-only — no form submitted, no data mutated): homepage HTTP 200, `/listings` redirect clean, dev log free of compile/runtime errors, and the SSR/payload assertions above (items 1, 3, 4). True 375px overflow/console checks could not be run without the GUI.
- **Item 2 visual proof — BLOCKED by data.** The reachable environment has **0 published listings** and `FEATURE_PUBLIC_CATALOG` off, so cards and the excursion detail never render on real data. Seeding prod is forbidden; no local seeded Supabase exists in this worktree. Item 2 is proven by the formatter/parity unit tests instead. To close the visual gap, run against a seeded local Supabase (memory `project_local_seeded_e2e_target`) with ≥1 published `private`-format listing and confirm card + detail + tariff emit an identical «от X ₽ за группу до N человек».

---

## Honest blockers

1. **Item 2 card/detail visual QA** needs a seeded published listing; prod has none and must not be seeded.
2. **1280/375 GUI + live-console check** blocked by Chrome failing to launch in this background environment. Static + SSR + unit evidence provided in its place.

No push. Implementation commit: **`7aa99f0a`** (`feat(catalog): budget default, shared group price, destination search, homepage order`) — pre-commit hook re-ran typecheck + lint-ratchet (0 errors) + 1297 tests, all green.
