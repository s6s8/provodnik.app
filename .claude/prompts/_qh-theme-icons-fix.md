# Фикс: build падает на /dev/req-cards — Icon-компонент передаётся через server→client границу

`bun run build` падает на prerender `/dev/req-cards`:
```
Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".
  {$$typeof: ..., render: function, displayName: ...}
```
Причина: серверный `src/app/dev/req-cards/page.tsx` передаёт в клиентский `src/app/dev/req-cards/theme-icon-chip.tsx` сам компонент иконки (`THEMES[].Icon` — это функция/React-компонент) пропом. Через границу server→client функции/компоненты передавать нельзя.

## Фикс
- Клиентский `theme-icon-chip.tsx` должен принимать пропом только сериализуемое значение — `slug` темы (string), НЕ `Icon` и НЕ объект темы целиком.
- Иконку и label чип резолвит сам внутри: импортируй `THEMES`/`getTheme` из `src/data/themes.ts` (это клиент-безопасный модуль данных, без серверных импортов) и найди тему по slug → возьми `Icon` и `label` оттуда.
- Соответственно в `page.tsx` в новой секции «Иконки-only» передавай в чип только `slug`. Если где-то ещё в page.tsx тема/Icon уходит в клиентский компонент пропом — тоже перейти на slug.
- Поведение и вёрстку не менять: nutral-серый чип, иконка 14px `text-ink-2`, тултип открывается по hover И по тапу, `aria-label={label}`. Граница: page.tsx остаётся server-компонентом с `metadata`, без `'use client'`.

## Верификация (обязательно, приложи вывод)
- `bun run typecheck`
- `bun run lint`
- `bun run test:run`
- `bun run build`  ← главное: должен пройти prerender /dev/req-cards без ошибок

Закоммить (НЕ пушить):
`fix(dev/req-cards): pass theme slug not Icon component across server/client boundary`

Заверши строкой DONE с резюме и статусом build.
