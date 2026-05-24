---
name: provodnik-money
description: Use ONLY when touching files in apps/provodnik/code that read or write currency amounts — any column ending in _minor (budget_minor, price_minor, etc.), any reference to rubles, kopecks, rubToKopecks, or kopecksToRub. Covers AP-012/ERR-025 — wizard write paths MUST convert RUB → kopecks via src/data/money.ts; missed conversion makes write paths 100× wrong.
---

# Currency amounts in provodnik MUST go through money.ts

### AP-012 / ADR-013 — Currency crosses go through `src/data/money.ts`
**Never** inline `* 100` / `/ 100` or write `_minor` columns directly in feature code. A missed conversion made the entire wizard write path 100× too small (ERR-025).
**Always** use `rubToKopecks(rub)` / `kopecksToRub(kopecks)`. `grep '\* 100\|/ 100\|_minor'` should return zero hits outside `src/data/money.ts` and its direct consumers. Round-trip Vitest test guards the invariant.

### ERR-025 — Wizard write paths must convert RUB → kopecks
**Never** write `budget_minor: input.budgetPerPersonRub` (or any `_minor` field) without calling `rubToKopecks`. Symptom: "от 50 ₽" on a 5000 ₽ request. See ADR-013.
**Always** run `rubToKopecks(input.budgetPerPersonRub)` on insert. Read side uses `kopecksToRub` for display.

```ts
// CORRECT
import { rubToKopecks } from '@/data/money';
const payload = { budget_minor: rubToKopecks(input.budgetPerPersonRub) };

// WRONG — silently writes 50 instead of 5000
const payload = { budget_minor: input.budgetPerPersonRub };
```