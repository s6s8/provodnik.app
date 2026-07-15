# Package 1–5, 7 — Opus execution report

**Branch:** `ops/package-1-5-7-20260715` (isolated worktree off `origin/main`). **Never pushed.**
**Packet:** `docs/plans/package-1-5-7-opus-execution.md`. **Disciplines:** Superpowers (trace → smallest root-cause diff → evidence-before-claim), Ponytail full (reuse existing helpers, fix the shared root once, no speculative abstractions), Context7 (RHF + cmdk confirmation, below).

Items 1–4 implemented; item 5 is a verified no-change closure; item 7 was corrected in the final remediation (see below). Item 3 was widened to published-listing regions and same-name disambiguation in the same final remediation.

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
  - Tariff (`TariffsList.tsx`) routes both the no-tariff fallback **and every RUB per-row price cell** through the shared formatter — each row is scoped to that tier's own `max_persons`, so a `private` row now prints «от X ₽ за группу до N человек» and a `group`/`combo` row prints «за одного» instead of a bare number. Non-RUB rows keep the bare «‹amount› ‹code›» rendering (the shared formatter always emits ₽, so it is not applied there — no fabricated ruble label). The Группа column still shows each tier's `max_persons` range.
  - The discovery-catalog card path stays correct too: `format` is threaded through `PublicListing` (`format?: private|group|combo`) so `mapListing` feeds the card the real enum instead of a theme slug.
- **Tests:** `excursion-price.test.ts` covers `private`+max → «за группу до 5 человек», `private` no-max → «за группу», `group`+max → «за одного» (cap ignored), `null` → bare, unknown string → bare. `TariffsList.test.tsx` (new) renders the table and proves a `private` RUB row prints «за группу до N человек» scoped to its own `max_persons`, `group`/`combo` rows print «за одного», a non-RUB (USD) row stays «150 USD» with no ₽ and no «за группу», and a null-currency row falls back to `defaultCurrency`. Card, detail, and tariff all call this one function, so their strings are identical by construction.
- **Browser proof — BLOCKED (data), reported honestly (see Blockers).** No published listings on the reachable environment + `FEATURE_PUBLIC_CATALOG` off, so cards/detail do not render on real data.

### 3. One destination field — city, region, guide directions
- **Root cause:** the combobox source (`getActiveGuideDestinations`) reads only published-listing `city|region`; with 0 published listings it returns nothing, so the field had no suggestions.
- **Change:** new `getDestinationSuggestions(client)` in `src/lib/supabase/queries.ts` unions published-listing cities/regions with the base city and regions guides declare on **approved** profiles (`guide_profiles.base_city` + `regions`, anon-readable under the `verification_status = 'approved'` RLS policy). Normalized to the existing `{name, region, guideCount}` shape and **deduped by normalized name+region** — casing/whitespace dupes still collapse while two places that share a name in different regions stay distinct. The combobox gives each option a unique cmdk `value` and shows the region as a muted suffix only for genuinely ambiguous names; keyboard/ARIA/selection/free-text are unchanged. *(Dedupe key, published-listing regions, and same-name disambiguation were completed in the final remediation below; the original commit added cities + guide places only and keyed on `name` alone.)*
- **Guide-count safety:** kept SEPARATE from `getActiveGuideDestinations`. The homepage «Популярные направления» block keeps consuming the original listing-backed set (its counts stay accurate); only the form combobox receives the widened set. Wiring: `(home)/page.tsx` fetches both; `homepage-shell2-classic.tsx` feeds the combobox `searchDestinations ?? destinations` and the inventory block `destinations`.
- **Tests:** `queries.test.ts` — suggestions cover a listing city (Сочи), a guide base city (Элиста), and guide directions/regions (Калмыкия, Астраханская область); dedupe collapses `Элиста`/`элиста` and repeated `Калмыкия` to one each; a listing-only region («Краснодарский край») is suggested on its own; two «Никольское» in different regions stay as distinct options; empty inputs return `[]` without throwing.
- **Browser proof — LIVE:** homepage payload now carries «Элиста» (guide base city), «Калмыкия» (region / guide direction), and «Сочи» as suggestions where the old listing-only source yielded none; combobox widget (`id="destination" role="combobox"`) present and unchanged.

### 4. Homepage section order
- **Change:** in `homepage-inventory-classic.tsx`, moved «Популярные направления» from between «Готовые экскурсии» and «Гиды» to **after** «Вопросы и ответы». «Как это работает» stays right after «Сборные группы» (in the shell). Result post-groups: `Как это работает → Готовые экскурсии → Гиды → Отзывы → FAQ → Популярные направления`. No Блог built (future slot, not a dummy page). Every empty-guard (`show*` min-count) preserved.
- **Test:** existing `homepage-inventory-classic.test.tsx` min-count gates still pass (fixture updated with the new `category` field).
- **Browser proof — LIVE (visible blocks):** SSR HTML order is `Гиды → Отзывы → Вопросы и ответы → Популярные направления`; «Готовые экскурсии» and «Сборные группы» are correctly hidden (catalog flag off / no open groups) — the empty-guards hold and the surviving blocks keep the required relative order.

### 5. «Готовые экскурсии» after «Запросы» — NO CHANGE
- Header already reads «Запросы» → «Готовые экскурсии» in `src/lib/navigation.ts` (`publicPrimaryNav`, `travelerPrimaryNav`), asserted by `navigation.test.ts:165-166`. Item 5 is fully closed by item 4 (homepage content). No navigation edit made — a second edit would be pure churn.

### 7. Footer icons — visual-only, non-interactive
- The accepted package requires the footer's bottom icons to be visual-only and non-interactive (no external social navigation, share, social login/OAuth, or click handler). The original delivery left the «Мы в сети» Telegram glyph as a clickable `<a href="t.me/provodnik_help" target="_blank">` — external social navigation that violates the rule — and this report previously (wrongly) closed the item as "no change." **Corrected in the final remediation below:** the glyph is now a non-interactive `<span role="img" aria-label="Telegram">` (no href, target, rel, hover affordance, or handler), so it reads as a decorative brand mark with an accessible label and is not a fake interactive element. The Telegram **support** channel is unaffected — it remains a real link in the «Поддержка» nav (`src/lib/navigation.ts`), so no destination was lost and no URL invented.

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
- **cmdk** — `/dip/cmdk` (`src/index.tsx`, README). `Command.Input` renders `role="combobox"`, `aria-autocomplete="list"`, `aria-controls`, `aria-activedescendant` at runtime; with `shouldFilter={false}` the parent owns filtering; each `Command.Item` "should provide a unique `value`." Confirms item 3: after the final remediation the widget's `value` is the composite `name · region` (unique even when two places share a name), while the accessible name stays the plain text and the ARIA/keyboard path is left alone.

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

## Remediation follow-up (2026-07-15) — tariff per-row wording

A controller source review found the item-2 fix stopped at the no-tariff fallback: when tariff rows existed, `TariffsList` still printed a raw number + a separate group range, so a `private` tariff row omitted «за группу» and its tier cap. Closed here with the smallest safe change (`docs/plans/package-1-5-7-tariff-remediation.md`).

- **Change:** in `TariffsList.tsx`, each RUB per-row price now routes through the same `formatExcursionPriceFrom(t.price_minor, format, t.max_persons)` used by card/detail — scoped to that row's own `max_persons`. Non-RUB rows keep «‹amount› ‹code›» untouched (the shared formatter always emits ₽; not applied there). No change to card/detail, queries, deps, schema/data, flags, or the Группа column.
- **Tests:** `TariffsList.test.tsx` (new, 5 cases) — private RUB → «за группу до N человек» at the tier's max, group/combo RUB → «за одного», non-RUB USD → «150 USD» with no ₽/«за группу», null-currency → `defaultCurrency` fallback.
- **Gates (all green):** `bun run typecheck` clean · `bun run lint` 0 errors (21 pre-existing warnings, unrelated `guide-templates` files) · `bun run test:run` **1302 passed** (235 files) · `bun run build` succeeded · `git diff --check` clean.
- **Diff — remediation commit `49cec8a1`, `git show --stat`:**

```
 docs/plans/package-1-5-7-tariff-remediation.md     | 15 +++++++
 src/components/listing-detail/TariffsList.test.tsx | 47 ++++++++++++++++++++++
 src/components/listing-detail/TariffsList.tsx      | 11 +++--
 3 files changed, 70 insertions(+), 3 deletions(-)
```

(This QA-report update lands in its own follow-up commit.)

- **Remediation commit:** `49cec8a1` — never pushed.

---

## Final remediation (2026-07-15) — verified gaps before HTML delivery

An independent review found two in-scope defects the original package left open. Both closed here per `docs/plans/package-1-5-7-final-remediation.md`, smallest root-cause diff, no new deps/schema/data/flags.

**1. Destination suggestions — published-listing regions + same-name disambiguation.**
- `getDestinationSuggestions` selected `listings.region` but only added the `city`, so a region that appears only on listings was never suggestible. It also keyed dedupe on `name` alone, collapsing two same-named places in different regions into one option.
- **Change (`src/lib/supabase/queries.ts`):** each published listing now adds its `region` as a suggestion on its own; dedupe key is normalized name+region so casing/whitespace dupes still collapse but same-named-different-region places stay distinct. `getActiveGuideDestinations` (homepage «Популярные направления» counts) is untouched.
- **Change (`homepage-request-form-classic.tsx`):** the combobox builds a unique cmdk `value` per option (`name · region`) and renders the region as a muted suffix only for names that are ambiguous within the current matches — single-region options still read as a bare name (so accessible names are unchanged). Keyboard, ARIA, selection, and free-text submit are all untouched.
- **Regressions (`queries.test.ts`, +2):** a listing-only region («Краснодарский край») is suggested on its own; two «Никольское» in distinct regions surface as two distinct options with their own regions.

**2. Footer icon — visual-only, non-interactive.**
- The «Мы в сети» Telegram glyph was a clickable `<a href="t.me/provodnik_help" target="_blank">` — external social navigation the accepted package forbids for these bottom icons.
- **Change (`src/components/shared/site-footer.tsx`):** replaced with a non-interactive `<span role="img" aria-label="Telegram">` — no href/target/rel, no hover affordance, no handler. Decorative brand mark with an accessible label, not a fake interactive element. The Telegram support link still lives in the «Поддержка» nav, so no channel was lost and no URL invented.

- **Gates (all green):** `bun run typecheck` clean · `bun run lint` 0 errors (21 pre-existing warnings in untouched `src/data/**/supabase-client.ts`) · `bun run test:run` **1304 passed** (235 files) · `bun run build` succeeded · `git diff --check` clean.
- **Diff — `git diff --stat` (src only):**

```
 src/components/shared/site-footer.tsx              | 19 ++++++-------
 .../components/homepage-request-form-classic.tsx   | 31 ++++++++++++++++----
 src/lib/supabase/queries.test.ts                   | 32 +++++++++++++++++++++
 src/lib/supabase/queries.ts                        | 33 +++++++++++++---------
 4 files changed, 87 insertions(+), 28 deletions(-)
```

- **Commit:** `d488522b` (`fix(catalog): listing regions in destination search; footer icons non-interactive`) — never pushed.

---

## Honest blockers

1. **Item 2 card/detail visual QA** needs a seeded published listing; prod has none and must not be seeded.
2. **1280/375 GUI + live-console check** blocked by Chrome failing to launch in this background environment. Static + SSR + unit evidence provided in its place.

No push. Implementation commit: **`7aa99f0a`** (`feat(catalog): budget default, shared group price, destination search, homepage order`) — pre-commit hook re-ran typecheck + lint-ratchet (0 errors) + 1297 tests, all green.
