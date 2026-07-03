# СВОДКА — Wildberries Excel sweep (Provodnik_01.07.26_V1), 2026-07-03

Source: `Provodnik_01.07.26_V1.xlsx` → Sheet1 rows 1–23 (строки 10 в исходнике нет — нумерация 9→11), Sheet9, Sheet10.
Скриншоты: `docs/qa/screenshots/wildberries-excel-sweep-2026-07-03/`.
Baseline: `origin/main` @ `6cc97bfb` — the exact commit running on `vps.provodnik.app` (verified via SSH: `/opt/provodnik` git HEAD = `6cc97bfb`, `provodnik.service` active).
Branch with new fixes: `sweep/wildberries-excel-0703`.

Classification legend: FIXED (this sweep) · ALREADY_FIXED (on main/live, re-verified) · OWNER_DECISION · NOT_REPRODUCED · BLOCKED.

## Sheet1

| № | Issue | Class | Evidence |
|---|---|---|---|
| 1 | Скрыть разделы «Направления»/«Экскурсии» | ALREADY_FIXED (re-verified ✅✅✅) | Live `/`: only sections «Открытые группы», «Как это работает»; `/destinations` и `/listings` — пустые оболочки (200, пустой `<main>`). Code: `homepage-shell2-classic.tsx:34,72` |
| 2 | Убрать микротекст «Бесплатно · без регистрации …» под формой | ALREADY_FIXED (re-verified ✅✅✅) | Live `/`: строка отсутствует (curl, «Бесплатно»/«без регистрации» = 0 вхождений). Остаток живёт только на несвязанном экспериментальном роуте `/ai` (`hero-conversation.tsx:212-217`), на него нет ссылок с сайта |
| 3 | `/become-a-guide` — текст | OWNER_DECISION (Badma) | Страница живая (200, h1 «Станьте гидом Проводника»). Нужен финальный текст от Бадмы |
| 4 | `/auth?role=guide` — утвердить текст | OWNER_DECISION (Badma) | Форма живая; текущие подписи: «Как к вам обращаться», «Телефон для проверки», «Создайте пароль». Нужно утверждение |
| 5 | Регистрация гида только с реальным телефоном | ALREADY_FIXED (re-verified ✅✅✅) | Клиент: `auth-entry-screen.tsx:133-136` блокирует пустой; сервер: `signUpAction.ts:62-64` возвращает `phone_required` + проверка уникальности `phone_normalized`. Ограничение: формат номера не валидируется (только «есть цифры») — флаг на улучшение |
| 6 | После регистрации гид попадает в «Входящие запросы», а не на анкету | **FIXED (this sweep)** | Root cause: клиент `resolvePostAuthRedirectPath(role,next)` возвращал `/guide` (→`/guide/inbox`) и затирал серверный `dashboardPath="/guide/profile"`. Fix: `auth-entry-screen.tsx` — при sign-up без `?next=` берём `result.dashboardPath`; `?next=` по-прежнему в приоритете. +2 unit-теста |
| 7 | «Пройти верификацию» скроллит вниз страницы | ALREADY_FIXED (re-verified ✅✅✅) | `guide-profile-checklist.tsx:22-26` — `scrollIntoView({block:"start"})`, якорь = начало секции. Живой клик недоступен: QA-гид уже approved, CTA скрыт |
| 8 | Первый инфоблок анкеты не сохраняется | ALREADY_FIXED (re-verified ✅✅✅) | `profile-actions.ts:88-111` — update-then-insert fallback (лечит «update matched 0 rows» для нового гида) |
| 9 | Календарь формы: выбранная дата не отображается | ALREADY_FIXED + live-verified | `homepage-request-form-classic.tsx:151-155` рендерит выбранную дату + тест `*.date.test.tsx`. Live: клик «Когда» → выбор дня → кнопка показывает «2 августа» (скриншоты `row9-*.png`) |
| 11 | `/account` (vps): второй мигающий курсор | NOT_REPRODUCED | В коде нет кастомного caret/blink (grep по `caret|blink|caret-color|contentEditable` — пусто); live-проба: 0 blink-анимаций при фокусе поля имени (`rows11-12-account-name-focused.png`). Похоже на артефакт браузера/расширения (автозаполнение/переводчик). Если воспроизводится — нужен браузер/ОС репортера |
| 12 | `/account` (prod): то же | NOT_REPRODUCED | Тот же вывод, общий код |
| 13 | Документы верификации со статусом «draft» | ALREADY_FIXED | `guide/profile/page.tsx:84-91` — статусы переведены (`draft` → «Не отправлен», карточка загрузки показывает «Файл загружен» ✓). Live: текста «draft» на `/guide/profile` нет |
| 14 | Статус «Имя путешественника — Заполнено» внизу `/account` | **FIXED (this sweep)** | Переименовано по выбору владельца: пункт чек-листа теперь «Профиль заполнен» + галочка (`traveler-profile-completion.ts`). Скриншот «до»: `row14-account-bottom.png` |
| 15 | `/guides` — «Не удалось загрузить гидов», гидов нет | ALREADY_FIXED + live-verified | Main: `search_guides` с `p_has_listings:false` (`queries.ts:380,472`), publish-миграция `20260702000001`, slug+`is_available` при approve (`moderation.ts`). Live: 2 карточки гидов; DB: оба approved-гида `is_available=true`, slug задан |
| 16 | Админка: что такое «Тип гида»? | ALREADY_FIXED (answered) | Это «Кто будет проводить экскурсии» из формы регистрации гида (индивидуальный гид / агентство / команда), колонка `guide_profiles.guide_type`. НЕ правовой статус (самозанятый/ИП/юрлицо — отдельное поле «Правовой статус»). В админке добавлена поясняющая подпись (`admin/guides/[id]/page.tsx:161-168`) |
| 17 | `contact-visibility` — нужна ли фишка | OWNER_DECISION (Badma) | Решение: оставить/убрать поощрительную настройку видимости контактов. Код не трогали |
| 18 | `/become-a-guide` финальный текст | OWNER_DECISION (Badma) | Дубль строки 3 |
| 19 | Что за страница `/account`? | ANSWERED (не баг) | Это «Личные настройки/Профиль». Доступ: меню аватара в шапке и мобильный drawer — пункт «Профиль» (traveler/admin); у гидов вместо неё `/guide/profile`. Неавторизованным — экран «Войдите в аккаунт» (live 200) |
| 20 | Logout уводит на `localhost:3000` | ALREADY_FIXED + live-verified | `api/auth/signout/route.ts` — public origin из `x-forwarded-host`, localhost запрещён в production. Live: POST `/api/auth/signout` → `303 Location: https://vps.provodnik.app/` |
| 21 | С `/auth?role=guide` нельзя уйти | ALREADY_FIXED + live-verified | Live: ссылка «На главную» (стрелка, сверху слева) + логотип-ссылки `href="/"` (`auth/page.tsx:82-97`, в карточке формы `auth-entry-screen.tsx:251-256`) |
| 22 | Убрать все тестовые запросы с сайта | OWNER_DECISION (готов метод) | Массовое удаление живых данных без «Go» не выполнял. Метод: SQL через Supabase (`delete from traveler_requests` каскадно заденет офферы/брони/чаты). По команде — выполню и приложу вывод |
| 23 | Удаление аккаунтов: какой tool? чьи аккаунты не трогать? | ANSWERED + OWNER_DECISION | Инструмент есть: `/admin/users` → карточка пользователя → danger zone «Удалить демо-аккаунт» (жёсткое удаление через `auth.admin.deleteUser`, причина обязательна, только demo-аккаунты). НЕ УДАЛЯТЬ: `qa-admin@example.com`, `qa-guide@example.com`, `qa-traveler@example.com` (e2e-фикстуры), `admin@provodnik.app` (ваш админ), демо-гид «Жюль Верников». Аккаунты, созданные вами/Бадмой вручную, тул может не считать demo — такие удаляются только через Supabase; список на удаление подтвердите. Сам ничего не удалял (вне scope) |

## Sheet9 — breadcrumb «Поездки > Россия > Москва»

ALREADY_FIXED + live-verified. `request-detail-screen.tsx:56-74` — крошка теперь «Запросы» (кликабельная ссылка на `/requests`), «Поездки» и избыточная «Россия» удалены, город = текущая страница. Live `/requests/2343523a-…`: `<a href="/requests">Запросы</a> › Волгоград`; «Поездки» — 0 вхождений. Исходный URL из Excel (`0c50e2ee-…`) отдаёт «Запрос не найден» — запрос удалён.

## Sheet10 — `/admin/guides` не открывался

ALREADY_FIXED + live-verified. Live под `qa-admin`: страница загружается, ошибки «Не удалось…» нет, очередь с пояснением («В основной очереди только анкеты со статусом „На проверке“…»), вкладка «Черновики» доступна (`sheet10-admin-guides.png`). Причина исходного бага (approved-гиды без slug/`is_available`) закрыта фиксами строки 15.

## Изменения этого прогона

- `src/features/auth/components/auth-entry-screen.tsx` — редирект после регистрации гида на анкету (row 6).
- `src/lib/profile/traveler-profile-completion.ts` — «Профиль заполнен» (row 14).
- Тесты: +2 в `auth-entry-screen.test.tsx`, обновлены 2 assertion'а чек-листа.

## Пост-ревью (2026-07-04, high-effort code review диффа)

- **Fix:** отклонённый `?next=` (открытый редирект, чужая роль, `/`) больше не уводит нового гида на `/guide` вместо анкеты: валидация next вынесена в `resolveSafeNextPath()` (`safe-redirect.ts`), sign-up использует её напрямую (`?? result.dashboardPath`). `resolvePostAuthRedirectPath` переписан через хелпер — поведение для sign-in/сервера не изменилось. +4 unit-теста (`safe-redirect.test.ts`) и +3 параметризованных кейса (`auth-entry-screen.test.tsx`).
- **Принятое ограничение:** при прерванной регистрации (вкладка закрыта до клиентского редиректа) серверный редирект `/auth` отправит уже-аутентифицированного гида на `/guide` (инбокс), а не на анкету. Не регрессия этого PR (поведение существовало до него); инбокс показывает CTA «Пройти верификацию» для неподтверждённых гидов. Серверный гейтинг неверифицированных гидов — отдельная задача.
- **Hygiene:** скриншоты перенесены в каноничный `docs/qa/screenshots/<topic>/`; из PR убраны случайные `.tmp/*.sql`, `/.tmp/` в `.gitignore`.

## Верификация (worktree `sweep/wildberries-excel-0703`)

- `bun run typecheck` — exit 0.
- `bun run lint` — 0 errors (21 pre-existing warnings, все есть и на main).
- `bun run test:run` — 215 файлов, 1082 теста, все зелёные.
- `bun run build` — успешно.
- Live VPS smoke: `/`, `/guides`, `/auth?role=guide`, `/become-a-guide`, `/requests/*`, `/account`, `/guide/profile`, `/admin/guides`, signout — всё проверено (см. таблицу).
- Supabase (hosted, read-only): `guide_profiles` — 2×(approved, is_available=true, slug задан). Данные не менялись; миграции этого прогона не требовались (publish-миграция уже на main).

## Context7

Перед правками: `/vercel/next.js` (Next 16.2.6) — `redirect(url)` только для server/render-контекстов; в обработчиках событий клиентских компонентов — router либо полная навигация. Оставлен существующий паттерн `window.location.assign` (полная навигация подхватывает новые auth-cookies), изменён только приоритет целей.

## Ограничения (честно)

1. Строки 3, 4, 17, 18 — только Badma: тексты и продуктовое решение по contact-visibility.
2. Строка 22 — удаление тестовых запросов и строка 23 — удаление аккаунтов: жду явного «Go» со списком.
3. Строка 6 — фикс в коде и тестах; live-проверка на VPS возможна только после merge+deploy (создание нового аккаунта гида на прод-базе для проверки не выполнял).
4. Строки 11/12 — не воспроизводятся ни в коде, ни headless; нужен браузер репортера, если повторится.
5. Локальный Playwright e2e-прогон не запускался (нужен локальный сервер); live-VPS smoke выполнен вместо него.
