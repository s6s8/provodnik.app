# Focused-Pass Implementation Plan

**Date:** 2026-04-16
**Status:** Ready to dispatch (after parent plan kickoff)
**Spec:** `2026-04-16-focused-pass-design.md`
**Parent plan:** `2026-04-16-two-mode-architecture-plan.md`

---

## Reading order

1. Parent plan (`2026-04-16-two-mode-architecture-plan.md`) — defines the ten
   tasks and their worktrees.
2. Focused-pass spec (`2026-04-16-focused-pass-design.md`) — defines the seven
   ride-along findings and how they slot in.
3. **This plan** — defines exactly which prompt files change, which prompt
   files are new, the merge order, and the dispatch batches.

This plan does not duplicate parent task descriptions. It only describes the
**delta**.

---

## Worktree map

```
.claude/worktrees/two-mode-arch         (parent — tasks 1, 2, 3, 4, 5)
.claude/worktrees/audit-polish          (parent — tasks 6, 7, 8, 9, 10)
.claude/worktrees/focused-standalone    (NEW — tasks FP-5, FP-7)
```

Branches:
- `feat/two-mode-arch`           (parent)
- `feat/audit-polish`            (parent)
- `feat/focused-standalone`      (NEW)

---

## Prompt file changes

### Modify existing parent prompt files

| Parent prompt file | Modification |
|--------------------|--------------|
| `.claude/tasks/two-mode/03-bookingformtabs.md` | Append FP-1 (date TZ) and FP-6 (error classification) sections under TASK block |
| `.claude/tasks/two-mode/05-publish-validation.md` | Expand TASK block to include FP-3 (`submitRequest.ts` published-status guard) |
| `.claude/tasks/audit-polish/06-budget-kopecks.md` | Expand TASK block to include FP-4 (wizard write-path kopecks conversion + round-trip invariant) |
| `.claude/tasks/audit-polish/09-dashboard-label.md` | Append FP-2 (remove `* 0.8` multiplier) under TASK block |

If a prompt file would exceed ~8000 tokens after the addition, split into
`<n>a-…md` and `<n>b-…md` sibling files and update the parent plan's dispatch
batch list.

### New prompt files

```
.claude/tasks/focused-standalone/
├── fp5-inbox-session-skip.md
└── fp7-traveler-dashboard-skeleton.md
```

(File naming convention follows the parent plan: `<n>-<short-slug>.md`.)

---

## Dispatch order (combined with parent)

```
Batch 1 — parent prerequisites
  - Task 2 (/guide/orders)            cursor-agent → two-mode-arch worktree
  - Task 6+FP-4 (currency fix)        cursor-agent → audit-polish worktree
  ⏸ wait both complete + reviewed + merged

Batch 2 — main behaviour changes (parallel)
  - Task 1 (CTA swap)                 cursor-agent → two-mode-arch
  - Task 3+FP-1+FP-6 (booking form)   cursor-agent → two-mode-arch
  - Task 4 (remove shape guard)       cursor-agent → two-mode-arch
  - Task 5+FP-3 (publish validation)  cursor-agent → two-mode-arch
  - Task 7 (full-card link)           cursor-agent → audit-polish
  - Task 8 (hoist bid CTA)            cursor-agent → audit-polish
  - Task 9+FP-2 (dashboard label)     cursor-agent → audit-polish
  - FP-5 (inbox session skip)         cursor-agent → focused-standalone
  - FP-7 (dashboard skeleton)         cursor-agent → focused-standalone
  ⏸ wait all complete + reviewed

Batch 3 — final
  - Task 10 (home "two ways")         cursor-agent → audit-polish (after Alex copy)

Merge order:
  1. two-mode-arch → main (fast-forward)
  2. audit-polish → main (fast-forward)
  3. focused-standalone → main (fast-forward)
```

The two-mode-arch and audit-polish worktrees still merge in the order the
parent plan defined. focused-standalone merges last because it touches no
critical-path files.

---

## Pre-flight checklist (focused-standalone worktree)

Before dispatching FP-5 or FP-7:

- [ ] Confirm `.claude/worktrees/focused-standalone` does not exist; if it
  does, `git worktree remove` it first
- [ ] `git worktree add .claude/worktrees/focused-standalone -b feat/focused-standalone`
- [ ] `cd .claude/worktrees/focused-standalone && bun install` (or `pnpm` /
  `npm` per repo convention)
- [ ] Verify clean test baseline: `bun test` (or `pnpm test`)
- [ ] Read parent SOT files (PROJECT_MAP.md, PATTERNS.md, ANTI_PATTERNS.md,
  ERRORS.md, DECISIONS.md) and inline relevant excerpts into prompt files
- [ ] Confirm `.claude/tasks/focused-standalone/` exists and contains the two
  new prompt files

---

## FP-5 prompt outline (full content lives in the prompt file)

**File:** `features/guide/components/requests/guide-requests-inbox-screen.tsx`
**Branch:** `feat/focused-standalone`
**Estimated time:** 30 minutes

**TASK steps:**
1. Read the file and locate line ~67 where `fetchOfferedRequestIds` is invoked
   conditionally.
2. Identify the effect's dependency array — must include `session?.user?.id`.
3. Replace the silent `else` branch with an early `return`.
4. Verify the effect re-runs when `session.user.id` becomes defined by adding
   a console assertion in dev mode (remove before commit).
5. Run the page in dev, log out, log back in, refresh — confirm tab counts
   are correct on every render.

**DONE CRITERIA:**
- No silent skip remains.
- Effect dependency array includes `session?.user?.id`.
- Manual QA: tab counts correct on cold load, hot reload, and after auth
  state change.
- No console.log left behind.

---

## FP-7 prompt outline (full content lives in the prompt file)

**File:** `features/traveler/components/traveler-dashboard-screen.tsx`
**Branch:** `feat/focused-standalone`
**Estimated time:** 45 minutes

**TASK steps:**
1. Read the existing skeleton pattern in `components/listings/listing-card-skeleton.tsx`
   (or the closest equivalent in the repo). If none exists, build a minimal
   skeleton using existing Tailwind tokens.
2. Add a `loading` boolean from the existing data-fetch hook (or wrap the
   client-side load in `useState` + `useEffect`).
3. Render `<SkeletonGrid count={3} />` when `loading === true`.
4. Match grid dimensions exactly to the loaded card grid so there is no layout
   shift when data arrives.
5. Manually confirm: throttle network to "Slow 3G" in DevTools, refresh,
   observe skeleton appears immediately, real cards replace it without jump.

**DONE CRITERIA:**
- Skeleton renders during initial load.
- Zero layout shift when real data arrives (CLS check in DevTools = 0).
- No new dependencies.
- No `console.log` left behind.

---

## Modifications to parent prompt files (delta diffs)

### Parent Task 3 (`03-bookingformtabs.md`) — APPEND

```markdown
## Additional scope: FP-1 (date TZ) and FP-6 (error classification)

### FP-1 — date TZ fix

The current `todayLocalISODate()` at line 80 uses local timezone. Replace
with a helper that always returns the date in `Europe/Moscow`:

```ts
function todayMoscowISODate(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(now); // "YYYY-MM-DD"
}
```

Use it for both:
- the date input's `min` attribute on the client
- the validation lower bound on the server (matching helper in
  `features/booking/actions/submitRequest.ts`)

### FP-6 — error classification

In the catch block at line ~151, classify errors into three buckets:

```ts
catch (err) {
  if (err && typeof err === 'object' && 'code' in err) {
    if (err.code === 'auth_expired') {
      setError('Войдите снова, чтобы отправить заявку');
    } else if (err.code === 'validation') {
      // attach field-level errors via setError(field, …)
    } else {
      setError('Не удалось отправить заявку. Попробуйте ещё раз через минуту');
    }
  } else {
    setError('Не удалось отправить заявку. Попробуйте ещё раз через минуту');
  }
}
```

### DONE CRITERIA additions

- `todayMoscowISODate` exists and is used in both client and server.
- Manual QA: change OS timezone to UTC-8, attempt to book "tomorrow local"
  — server response is consistent with display.
- Three error buckets render distinct messages on the form.
```

### Parent Task 5 (`05-publish-validation.md`) — EXPAND

Replace the original TASK block with:

```markdown
## TASK

Two responsibilities, one PR:

### 5a — Publish-time guard (original parent scope)

In the listing publish action, reject publish if `price_minor IS NULL` or
the listing has no schedule rows. Return `{ error: 'listing_no_price' }` or
`{ error: 'listing_no_schedule' }`. Surface as a non-blocking inline note
in the publish form.

### 5b — Submit-time guard (FP-3)

In `features/booking/actions/submitRequest.ts`, before the insert into
`requests`:

```ts
const { data: listing } = await supabase
  .from('listings')
  .select('id, status, price_minor')
  .eq('id', input.listingId)
  .single();
if (!listing || listing.status !== 'published') {
  return { error: 'listing_unavailable' };
}
if (input.mode === 'order' && listing.price_minor == null) {
  return { error: 'listing_no_price' };
}
```

Map `listing_unavailable` and `listing_no_price` to user-facing Russian
copy in `BookingFormTabs.tsx`.

**Important:** the inquiry tab (`mode === 'question'`) skips the price check.
Inquiries against listings without a price are still allowed — they're
questions, not orders.

### DONE CRITERIA additions

- Both guards live in the same PR.
- Manual QA: take a draft listing UUID, attempt POST to `submitRequest`
  with that UUID — receive `listing_unavailable` response, no row inserted.
- Inquiry tab still allows submissions against price-less listings.
```

### Parent Task 6 (`06-budget-kopecks.md`) — EXPAND

Append to the TASK block:

```markdown
### Additional scope: FP-4 — wizard write-path

In `features/requests/components/request-wizard.tsx` line ~76, the
`budgetMap` keys map to RUB integers:

```ts
const budgetMap: Record<string, number> = {
  under5k: 5000, under10k: 10000, under20k: 20000, over20k: 30000,
};
```

In `app/(protected)/traveler/requests/new/actions.ts` line ~80, this RUB
value is stored to `budget_minor` without `* 100`. That's the F01 bug, and
the wizard is the originating call site. Fix:

```ts
budget_minor: input.budgetPerPersonRub * 100,
```

Centralise the conversion in a helper:

```ts
// data/money.ts
export const rubToKopecks = (rub: number) => Math.round(rub * 100);
export const kopecksToRub = (k: number) => k / 100;
```

Use both helpers anywhere RUB ⇄ kopecks crosses a boundary.

### Round-trip invariant test

Add a single Vitest assertion to the existing test file (or create a new
one if none exists for this module):

```ts
test('rub → kopecks → rub round-trips identity', () => {
  for (const rub of [0, 1, 50, 5000, 12345]) {
    expect(kopecksToRub(rubToKopecks(rub))).toBe(rub);
  }
});
```

### DONE CRITERIA additions

- Both write path (wizard / actions) and read path (queries / dashboard) use
  the centralised helpers.
- Round-trip invariant test passes.
- Manual QA: submit a fresh request with budget "Под 5 000 ₽", verify guide
  inbox shows "от 5 000 ₽" — not "от 50 ₽".
```

### Parent Task 9 (`09-dashboard-label.md`) — APPEND

```markdown
## Additional scope: FP-2 — remove `* 0.8` multiplier

At `features/traveler/components/traveler-dashboard-screen.tsx:177`:

```ts
const priceLabel = `от ${(budget * 0.8).toLocaleString('ru-RU')} ₽`;
```

Replace with:

```ts
const priceLabel = `от ${kopecksToRub(budgetMinor).toLocaleString('ru-RU')} ₽ / чел.`;
```

(Uses the helper introduced in Task 6.)

### DONE CRITERIA additions

- No `* 0.8` left in the codebase (`grep -r '\* 0.8'` returns no matches).
- Label matches the existing pattern in `data/supabase/queries.ts:296`.
- Manual QA: traveler dashboard for a request with budget "5 000 ₽" shows
  "от 5 000 ₽ / чел." — not "от 4 000 ₽".
```

---

## Rollback plan

Same as parent plan — checkpoint after each phase, `git reset --hard` if a
later phase breaks an earlier one.

Specifically: if FP-4 (currency centralisation) introduces a regression
in `formatRub` consumers, the round-trip test catches it. Otherwise:

```bash
git tag checkpoint/focused-pass-pre-merge
# ...if focused-standalone introduces a regression
git revert <focused-standalone merge commit>
```

---

## Slack dev-note

Same shipment as parent — use a single `slack-devnote.mjs` post that lists
all sixteen items (10 parent + 6 net-new FP). Items list (Russian, plain):

```json
{
  "theme": "Заказ напрямую и сопутствующие правки",
  "items": [
    { "kind": "new",     "area": "Кабинет гида",      "text": "Появилась лента «Заказы» с подтверждением и отказом" },
    { "kind": "new",     "area": "Карточка экскурсии", "text": "Кнопка «Заказать» ведёт на форму брони, без чужих заявок" },
    { "kind": "improve", "area": "Форма брони",       "text": "Видна итоговая сумма и вкладка «Задать вопрос»" },
    { "kind": "fix",     "area": "Форма брони",       "text": "Дата проверяется по московскому времени, без расхождения с сервером" },
    { "kind": "improve", "area": "Форма брони",       "text": "Понятные сообщения об ошибках по типу проблемы" },
    { "kind": "fix",     "area": "Заявки",            "text": "Бронирование закрытой экскурсии возвращает понятный отказ" },
    { "kind": "fix",     "area": "Публикация",        "text": "Экскурсию без цены нельзя опубликовать — мягкое напоминание" },
    { "kind": "fix",     "area": "Бронь",             "text": "Старое ограничение по типу экскурсии снято — путь одинаковый" },
    { "kind": "fix",     "area": "Цены",              "text": "Сумма в заявках, в кабинете и в письмах больше не делится на 100" },
    { "kind": "fix",     "area": "Дашборд",           "text": "Подпись бюджета однозначная, без скрытого пересчёта на 0.8" },
    { "kind": "improve", "area": "Каталог",           "text": "Карточка экскурсии у гида кликается целиком" },
    { "kind": "improve", "area": "Кабинет гида",      "text": "Кнопка «Откликнуться» поднята наверх карточки запроса" },
    { "kind": "fix",     "area": "Кабинет гида",      "text": "Счётчики вкладок «Откликнулись» / «Приняли» теперь точные на любом обновлении" },
    { "kind": "improve", "area": "Кабинет путешественника", "text": "Появился скелетон при загрузке — нет пустого экрана" },
    { "kind": "new",     "area": "Главная",           "text": "Блок «Два способа поехать» — готовая экскурсия или своя заявка" },
    { "kind": "tech", "category": "arch", "text": "Минорные единицы централизованы — кросс-границы сум защищены тестом" }
  ],
  "capabilities": [
    "Путешественник открывает понравившуюся экскурсию и бронирует её одной кнопкой — гид подтверждает в своей ленте",
    "Гид видит брони и заявки в двух разных лентах кабинета и не путает их",
    "Сумма в любом письме и любой карточке совпадает с тем, что человек указывал — без скрытых пересчётов"
  ]
}
```

(Posted by orchestrator after Batch 3 merges to main.)
