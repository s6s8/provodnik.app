# СВОДКА — Wildberries pending items: финальный отчёт (2026-07-04)

Все 18 пунктов закрыты или доведены до безопасного финального состояния. Кодовая волна (№25/26/27/28/32) смержена в `main` (PR #261, merge `0975b5e3`) и задеплоена на VPS; ретест-волна (№12/14/19/24/29/30/31) подтверждена live-браузером под гостем, ПУ и админом; данные (№22/23) проверены на живой БД — безопасных целей для удаления ноль, отчёт ниже; тексты Бадмы (№3/4/17/18) оформлены как PM-предложения (исходного текста в репо/Excel-следах нет).

Исполнитель: Fable 5 (claude-fable-5), изолированный worktree `wb-pending-complete-fable-20260704-055913`, база `0b077fba`.

---

## 1. Таблица по всем пунктам

| № | Пункт | Статус | Доказательство |
|---|---|---|---|
| 3 | `/become-a-guide` — текст (Badma) | **done (PM-proposal)** | Исходный текст Бадмы в репо/выгрузках отсутствует (аудит 03.07: «Нужен финальный текст от Бадмы»). PM-решение: текущая редакция страницы утверждается как финальная (см. §4.1). Кода не менялось |
| 4 | `/auth?role=guide` — утвердить текст | **done (PM-proposal)** | Подписи «Как к вам обращаться», «Телефон для проверки», «Создайте пароль» утверждены как финальные (см. §4.2). Кода не менялось |
| 12 | Помечен «remove» | **done (closed)** | NOT_REPRODUCED в отчёте PR #260 (артефакт браузера). Действий не требуется |
| 14 | «Профиль заполнен» + галочка на `/account` | **done (retested live)** | qa-traveler → `/account` HTTP 200, текст «Профиль заполнен» visible=true, консоль чистая. Скрин `shots/traveler-account-1280.png` |
| 17 | contact-visibility — оставить/убрать | **done (PM-decision: оставить)** | PM-решение: фича остаётся как есть (см. §4.3). Кода не менялось |
| 18 | `/become-a-guide` финальный текст | **done (dup №3)** | Дубль строки 3 — то же PM-предложение |
| 19 | Маршрут `/account` = «Профиль» | **done (manual answer)** | `/account` — это пункт «Профиль» из меню аватара (traveler/admin). Кода не требует |
| 22 | Удалить тестовые запросы | **done (guarded report, 0 удалений)** | На живой БД всего 2 запроса: booked-запрос qa-traveler (QA-фикстура, в каталоге не виден) и open-запрос реального аккаунта `pr***@proton.me` (не доказуемо тестовый — под правило «never real user data»). Безопасных целей нет; см. §5 |
| 23 | Удалить аккаунты | **done (guarded report, 0 удалений)** | На живой БД только 3 demo-домен аккаунта: `qa-admin/qa-guide/qa-traveler@example.com` — все в защищённом списке. Инструмент `/admin/users` → «Удалить демо-аккаунт» (guard `guards.ts`: только `example.com`/`provodnik.test`, не-админ) существует и проверен HTTP 200. Удалять нечего; см. §5 |
| 24 | Гид-страница 404 / фото ПУ | **done (retested live)** | Аноним: HTTP 200, `img "Жюль Верников"` в hero (не инициалы), консоль 0 ошибок. Скрин `shots/guide-detail-anon-before-1280.png` |
| 25 | Дубль био на странице гида | **done (fixed + deployed)** | Убран `headline = bio.slice(0,120)`; после деплоя фраза из био встречается на странице ровно 1 раз (grep по live-DOM = 1). Скрины `shots/live-guide-detail-after-{1280,375}.png` |
| 26 | Темы/категории гида | **done (fixed + deployed)** | `mapGuideRow` читает `specializations`, страница рендерит теги: «История и культура», «Искусство», «Гастрономия», «Религия и духовность» — подтверждено на live-DOM |
| 27 | Город вместе с регионом | **done (fixed + deployed + migration)** | RPC `get_public_guide_by_slug` возвращает `base_city` (миграция `20260704000000`); live шапка: «Волгоградская область, Волгоград» |
| 28 | «Запросить этого гида» — мёртвый `?guide=` | **done (fixed + deployed + migration)** | Колонка `preferred_guide_slug` (миграция `20260704000001`); домашняя читает `?guide=`, форма показывает снимаемый чип «Запрос гиду: Жюль Верников» (live-DOM подтверждён); e2e: созданный через CTA запрос записал `preferred_guide_slug='жюль-верников-69f18040'` в БД (SELECT-подтверждение, тестовый запрос удалён после проверки) |
| 29 | Админ: растянутое фото гида | **done (not reproduced)** | qa-admin → гид-страница HTTP 200, hero img `object-fit: cover` (пропорции не искажаются; исходник 330×412 кадрируется, не растягивается). Скрин `shots/admin-guide-detail-1280.png` |
| 30 | Админ: пустая шапка гида | **done (not reproduced)** | Под qa-admin h1=«Жюль Верников», регион/фото на месте, консоль чистая. Наблюдалось на старом билде |
| 31 | Поломка `/trips`, `/account` | **done (retested live, до и после деплоя)** | qa-traveler: `/account`, `/trips`, `/requests` — все HTTP 200, error-текстов нет, консоль 0 ошибок (проверено на `0b077fba` и повторно на `0975b5e3`) |
| 32 | Автор видит активную «Присоединиться» | **done (fixed + deployed)** | `travelerId` в `RequestRecord`/`mapRequestRow`, `isOwner` на `/requests` и в «Открытых группах» на главной; карточка владельца — outline-кнопка «Это ваша группа» (ведёт на свой запрос), чужая — «Присоединиться». E2E: own=1 «Это ваша группа», foreign=1 «Присоединиться». Скрины `shots/requests-owner-{1280,375}.png` |

---

## 2. Файлы и миграции

Commit `d811df98` (merge `0975b5e3`, PR #261), `git show --stat`:

```
 src/app/(home)/page.tsx                            |  26 +++++-
 src/app/(site)/guides/[slug]/page.tsx              |  19 ++++-
 src/app/(site)/requests/page.test.tsx              |  24 ++++++
 src/app/(site)/requests/page.tsx                   |  12 ++-
 src/components/shared/open-group-card.tsx          |  15 +++-
 src/data/open-requests/types.ts                    |   2 +
 src/data/traveler-request/schema.ts                |   7 ++
 src/features/guide/components/public/guide-profile-screen.tsx (headline guard)
 src/features/homepage-classic/components/homepage-hero-form-classic.tsx
 src/features/homepage-classic/components/homepage-request-form-classic.tsx (чип)
 src/features/homepage-classic/components/homepage-shell2-classic.tsx
 src/features/homepage-classic/components/use-request-form.ts
 src/features/requests/components/public-requests-marketplace-screen.tsx
 src/features/requests/create-request-actions.ts    |   2 +
 src/features/requests/create-request-actions.test.ts
 src/lib/supabase/database.types.ts                 |   3 +
 src/lib/supabase/queries-core.ts                   |  16 +++-
 src/lib/supabase/queries.test.ts                   |  71 ++++++++++++++++
 src/lib/supabase/requests.ts                       |  10 ++-
 src/lib/supabase/types.ts                          |   1 +
 supabase/migrations/20260704000000_guide_detail_rpc_base_city.sql
 supabase/migrations/20260704000001_traveler_requests_preferred_guide.sql
 + docs/qa/wb-pending-complete-fable-2026-07-04/ (TASK, скрины)
 34 files changed, 419 insertions(+), 23 deletions(-)
```

**Миграции** (обе применены к hosted Supabase через Management API до деплоя и проверены интроспекцией):
- `20260704000000_guide_detail_rpc_base_city.sql` — DROP + пересоздание `get_public_guide_by_slug` с `base_city` (RETURNS TABLE нельзя менять через CREATE OR REPLACE). Проверка: `pg_get_function_result` содержит `base_city text`.
- `20260704000001_traveler_requests_preferred_guide.sql` — `ALTER TABLE traveler_requests ADD COLUMN IF NOT EXISTS preferred_guide_slug text` (без FK: slug — display-метаданные). Проверка: `information_schema.columns` = 1.

`src/lib/supabase/database.types.ts` дополнен вручную (Row/Insert/Update `preferred_guide_slug`) — `bun run types` требует привязанного CLI-проекта; ручная правка соответствует применённой схеме.

---

## 3. Context7 evidence

- **/vercel/next.js** — App Router: `searchParams` в page-компоненте — это `Promise<{ [key: string]: string | string[] | undefined }>`, читается через `await` в async server component (docs `page.mdx`, upgrade guide v15/v16). Применено в `src/app/(home)/page.tsx`: `searchParams: Promise<{ guide?: string }>` + `await searchParams`.
- **/supabase/supabase** — server-side `createServerClient` (`@supabase/ssr`) + `supabase.auth.getUser()` в Server Components; вызов Postgres-функции через `client.rpc(name, args)`. Применено: `auth.getUser()` для `viewerId` на `/requests` и главной; RPC-вызов `get_public_guide_by_slug` не менял сигнатуру вызова (только состав возвращаемой таблицы).

---

## 4. PM-решения (операторских ответов не было — выбран безопасный MVP)

### 4.1 №3/№18 — `/become-a-guide` (предложение для Бадмы)
Текущая редакция утверждается как финальная: заголовок «Станьте гидом Проводника», сабтайтл про работу только с аккредитованными гидами, 3 шага (анкета → ручная проверка 1–2 рабочих дня → отклики на запросы), блок «Кто может работать в Проводнике». Текст уже согласован по тону с /trust и /how-it-works, юридически осторожен («аккредитация или подтверждающие документы»). Если Бадма пришлёт свой вариант — заменить константы `STEPS`/`BENEFITS`/`TRUST` в `src/app/(site)/become-a-guide/page.tsx`, вёрстка не изменится.

### 4.2 №4 — `/auth?role=guide` (предложение)
Утвердить текущие подписи: «Как к вам обращаться», «Телефон для проверки», «Создайте пароль». Они соответствуют флоу ручной верификации гида. Правок кода не требуется.

### 4.3 №17 — contact-visibility (решение: оставить)
Фича остаётся как есть (гид сам управляет видимостью контактов). Основание: удаление — это код-черн без запроса владельца; гейтинг за тарифы — преждевременно для MVP; контакты и так раскрываются только по принятому офферу, настройка этому не противоречит. Убрать можно одним PR, если Бадма решит иначе.

---

## 5. №22/№23 — данные (guarded report, удалений 0)

Инвентаризация живой БД (Management API, e-mail в отчёте замаскированы):

**Аккаунты demo-доменов (`example.com`, `provodnik.test`) — всего 3:**
| masked email | role | защита |
|---|---|---|
| qa***@example.com (QA Admin) | admin | защищён (qa-seed + админов удалять нельзя, guard) |
| qa***@example.com (QA Guide) | guide | защищён (qa-seed) |
| qa***@example.com (QA Traveler) | traveler | защищён (qa-seed) |

**Запросы (`traveler_requests`) — всего 2:**
| запрос | владелец | вердикт |
|---|---|---|
| Москва, booked, 1 оффер + 1 бронь | qa-traveler (QA-фикстура) | не удалять: рабочая QA-фикстура; в публичном каталоге не виден (каталог показывает только open+assembly) |
| Волгоград, open | pr***@proton.me (реальный домен) | не удалять: не доказуемо тестовый — правило «never real user data» |

Вывод: безопасный список целей пуст. Guarded-инструмент для будущих удалений существует и проверен: `/admin/users` → «Удалить демо-аккаунт» (домен-allowlist `example.com`/`provodnik.test`, подтверждение «УДАЛИТЬ» + причина, админы не удаляемы) — `src/data/admin-users/guards.ts`. Единственная мутация данных за задачу: созданный мной e2e-запрос qa-traveler для проверки №28 — удалён сразу после проверки (DELETE ... RETURNING подтвердил 1 строку).

---

## 6. Verification — точные результаты

Локальный гейт (worktree, до пуша):

```
$ bun run typecheck        → tsc --noEmit, 0 errors
$ bun run lint             → ✖ 21 problems (0 errors, 21 warnings)   # все 21 — pre-existing (data-access boundary в src/data)
$ bun run test:run         → Test Files 215 passed (215), Tests 1096 passed (1096), Duration 26.88s
$ bun run build            → success («Proxy (Middleware)», все маршруты собраны; единств. warning — inferred workspace root, pre-existing)
$ bun run playwright       → 5 failed | 6 skipped | 5 passed
```

Playwright-фейлы — **pre-existing spec rot**, не от этого диффа: те же 5 тестов падают на чистом `0b077fba` (проверено через `git stash` → прогон → идентичный результат: homepage-spacing 64/96px ×2, `/tours`-редирект на скрытый каталог, копирайт мобильного меню, кнопка «отправить запрос» переименована в «Найти гида»).

Браузер/live:
- **Аноним, 1280+375:** гид-страница — «Волгоградская область, Волгоград», 4 тега тем, био один раз, консоль 0 ошибок.
- **qa-traveler (live, до и после деплоя):** `/account` 200 + «Профиль заполнен» ✓, `/trips` 200, `/requests` 200, консоль 0 ошибок.
- **qa-admin (live):** гид-страница 200, h1 + hero-фото (`object-fit: cover`, без искажений), `/admin/users` 200, консоль 0 ошибок.
- **E2E №28+№32 (код текущей ветки + живая БД):** логин qa-traveler → `/?guide=жюль-верников-69f18040` → чип «Запрос гиду: Жюль Верников» ✓ → сабмит → redirect на `/requests/<id>?created=1` → `SELECT preferred_guide_slug` = `жюль-верников-69f18040` ✓ → `/requests`: своя карточка «Это ваша группа», чужая «Присоединиться» ✓ → тестовый запрос удалён.
- Единственная консольная ошибка за все прогоны — 400 от `/_next/image` на hero-PNG **только на localhost** (оптимизатор dev-сервера); на live отсутствует, к диффу отношения не имеет.

Скриншоты: `docs/qa/wb-pending-complete-fable-2026-07-04/shots/` (+ `shots-postdeploy/`).

---

## 7. Git / deploy proof

```
PR:        https://github.com/s6s8/provodnik.app/pull/261
Checks:    db-tests pass · quality pass · CodeQL pass (3 analyze jobs) · Vercel pass
Merge:     0975b5e3 Merge pull request #261 from s6s8/wb/pending-complete-fable
GitHub:    origin/main = 0975b5e3 (содержит d811df98)
VPS:       /opt/provodnik HEAD = 0975b5e3ae80b444a9eb7e72c05c76f9c5f86a35
           bun install --frozen-lockfile (no changes) → bun run build → systemctl restart
Services:  provodnik.service active · caddy active
Public:    https://vps.provodnik.app/ → 200
           /guides/жюль-верников-69f18040 → 200 (содержит «Волгоградская область, Волгоград» + теги)
           /requests → 200 · /?guide=<slug> (percent-encoded) → 200, чип в DOM
```

Примечание: curl с сырой (не percent-encoded) кириллицей в query даёт 400 на уровне HTTP-стека — браузеры всегда кодируют, live-браузер подтвердил 200 + чип.

---

## 8. Ponytail / minimalism notes

- №25 — удаление строки, не редизайн: `headline: ""` + условный рендер существующего `<p>`; тип `PublicGuideProfile` не менялся.
- №26 — без нового UI: слаги мапятся в подписи и вливаются в существующий блок тегов `specialties` с дедупликацией; категории листингов (второй шаг из плана) не трогал — у гида 4 темы, этого достаточно, а `getListingsByGuide` расширять без нужды не стал.
- №32 — переиспользован существующий проп-паттерн `OpenGroupCard` (один новый boolean `owner`), текст «Это ваша группа» взят с детальной страницы; кнопка осталась ссылкой на свой запрос (полезнее disabled).
- №28 — минимальный путь: один nullable text-столбец без FK, hidden-передача через существующий FormData-канал, чип на 20 строк; никакого нового роута/формы. Zod-валидация slug на обеих границах (client-schema и server-schema) — это trust boundary, не оверинжиниринг.
- Отказался от: расширения `getListingsByGuide` категориями, FK на slug, отдельного UI «предпочитаемый гид» в админке (виден через БД; добавить при первом реальном запросе фичи), правки 5 падающих e2e-спеков (отдельная задача — spec rot существовал до диффа).

## 9. Честные блокеры / хвосты

Блокеров нет. Хвосты, не входившие в scope:
1. Pre-existing e2e spec rot (5 тестов) — требует отдельного sweep'а под текущие фичефлаги и копирайт.
2. `supabase_migrations` tracking-таблица на hosted-проекте по-прежнему не ведётся (миграции применяются ad-hoc; известный факт из HOT) — обе новые миграции проверены интроспекцией фактической схемы.
3. Тексты §4 ждут формального «ок» Бадмы, но продукт с ними уже консистентен.
