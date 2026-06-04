# Task: Rename product term «Сборная группа» → «Открытая группа»

Owner decision 2026-06-03 (already recorded in KODEX). Apply the rename across the **product UI and tests** so users see «Открытая группа» everywhere «Сборная группа» / «Сборная» currently appears.

## Hard rules
- `bun` only. After edits run: `bun run typecheck && bun run lint && bun run test:run`.
- Do NOT touch: URL paths/routes, i18n keys, enum/value contracts, DB values. This is a **display-string-only** change.
- Keep «Своя группа» exactly as is — only the «Сборная» variant changes.
- Match Russian declension naturally (adjective forms too).
- Work in small batches: (1) UI strings, (2) tests, then verify.

## Exact UI replacements
1. `src/data/requests-format.ts:8` — `Сборная группа · ${...}` → `Открытая группа · ${...}`
2. `src/data/requests-format.ts:14` — `Сборная группа · Свободно мест...` → `Открытая группа · Свободно мест...`
3. `src/components/shared/request-card-final.tsx:67` — badge `"Сборная"` → `"Открытая"`
4. `src/components/shared/site-footer.tsx:35` — `тип Сборная группа` → `тип Открытая группа`
5. `src/features/traveler/components/trip-card/trip-card.tsx:213` — `Сборная группа · организатор:` → `Открытая группа · организатор:`
6. `src/app/(protected)/traveler/requests/[requestId]/page.tsx:134` — `Сборная экскурсия опубликована` → `Открытая экскурсия опубликована`
7. `src/app/(site)/how-it-works/page.tsx:11` — `своя или сборная` → `своя или открытая`
8. `src/app/dev/req-cards/page.tsx` (dev playground, lines ~78,96,138,143,155,345) — replace all `Сборная`/`сборная`/`сборной` display + description strings → `Открытая`/`открытая`/`открытой`. The badge fn at line 155 returns `"Сборная"` → `"Открытая"`.

## Exact test replacements (update assertions to new text)
- `src/components/shared/request-card-final.test.tsx:37` — `"Сборная"` → `"Открытая"`
- `src/app/dev/req-cards/page.test.tsx:30,69` — `"Сборная"` → `"Открытая"`
- `src/features/homepage/components/homepage-discovery.test.tsx:62` — `"Сборная"` → `"Открытая"`
- `src/features/requests/components/public-requests-marketplace-screen.test.tsx:53` — `"Сборная"` → `"Открытая"`
- `src/features/traveler/components/trip-card/trip-card.test.tsx:279` — `"Сборная группа · организатор: Мария К."` → `"Открытая группа · организатор: Мария К."`
- `src/features/guide/components/requests/bid-form-panel.test.tsx:64` — regex `/^Сборная группа$/` → `/^Открытая группа$/`

## After edits
- Sweep: `grep -rn "[Сс]борн" src/` — confirm ZERO remaining occurrences in `src/`. Report any left.
- Inspect `git diff --stat` — confirm only the files listed above changed. Flag any accidental scope.
- Do NOT edit `.claude/sot/*` (already handled) or `docs/*` or `.playwright-mcp/*`.

## Report back
- Files changed / intentionally not touched.
- Sweep result for `[Сс]борн` in `src/`.
- Checks: typecheck / lint / test pass counts.
- Any risk or remaining occurrence.
Commit only; do NOT push (operator pushes).
