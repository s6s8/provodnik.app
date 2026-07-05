# Provodnik production-readiness audit — coverage matrix

Дата: 2026-07-05 (МСК). Среда: локальный production build (`bun run build` + `next start`, состояние рабочей копии ветки `handover/excel-fixes`, включая незакоммиченные правки) против живой Supabase БД (общая для staging и prod). Выборочные проверки живого prod: provodnik.app. Скриншоты: `./screenshots/`.

Статусы: ✅ checked · 🟡 partially checked · ⛔ blocked · ⏭ skipped.

## Public surfaces (anon)

| Surface / route | Status | Notes |
|---|---|---|
| `/` (home, request-first form) | ✅ | 1280 + 375, console чистый; пустой сабмит → стилизованные ошибки. Найдено: битый hero на 375 (PRD-008), «Открытые группы» (PRD-018) |
| `/form` | ✅ | 308 → `/` |
| `/ai` | 🟡 | Рендер и контент проверены; POST `/api/requests/parse` не вызывался (жгёт LLM-кредиты) — источник проверен (PRD-024) |
| `/guides` каталог | ✅ | 2 гида — оба тестовые (PRD-005); фильтр чипов работает |
| `/guides/[slug]` (ASCII slug) | ✅ | Профиль рендерится |
| `/guides/[slug]` (кириллический slug) | ✅ | **404 на всех средах, включая live prod** (PRD-001) |
| `/listings` каталог | ✅ | Пусто («Найдено 0 экскурсий»), секции скрыты по решению 2026-06-30 (PRD-021) |
| `/listings/[id]` detail | ⛔ | Нет опубликованных листингов в БД — нечего открыть |
| `/requests` каталог | ✅ | Пусто для anon из-за неприменённой RLS-миграции (PRD-002) |
| `/requests/[requestId]` detail | 🟡 | Для anon отдаёт «не найден» из-за RLS (PRD-002); под traveler-логином карточки открывались через /trips |
| `/destinations` + `[slug]` | 🟡 | Индекс пуст («Пока нет доступных направлений»); detail не открыть без данных (PRD-021) |
| `/become-a-guide`, `/for-business`, `/help`, `/how-it-works`, `/trust` | ✅ | Рендер, контент, 375px — ок; терминология: находки в help/become-a-guide (PRD-017) |
| `/policies/terms`, `/privacy`, `/cookies` | ✅ | Рендер ок, ссылки из футера ведут корректно |
| Header/footer/nav links | ✅ | Аудит всех внутренних ссылок кодом + кликами (PRD-006/007/015/025/026) |
| 404 / несуществующие маршруты | ✅ | Кастомная 404, `noindex` присутствует; «не найденные» detail-страницы отдают HTTP 200 (класс ERR-056), двойной robots-meta |
| `/dev/*` wireframe pages | ✅ | В prod-режиме 404 — утечки нет |
| robots.txt / sitemap.xml | ✅ | Присутствуют; замечания в PRD-020/031 |

## Auth and protected surfaces

| Surface | Status | Notes |
|---|---|---|
| `/auth` вход: пустая форма, неверный пароль | ✅ | Стилизованные ошибки, без перечисления аккаунтов; a11y-замечания (PRD-022) |
| Регистрация (traveler/guide) | 🟡 | UI осмотрен; реальный сабмит не выполнялся (общая prod-БД). Серверный путь проверен по коду (PRD-009) |
| Восстановление пароля | 🟡 | Страница рендерится; отправка письма не выполнялась |
| Traveler: `/trips`, `/account`, `/messages`, `/notifications` | ✅ | Логин qa-traveler; всё открывается; найдено PRD-014 |
| Traveler: `/favorites`, `/referrals`, `/account/notifications` | ✅ | Флаги выключены → «Страница кабинета не найдена» (корректно) |
| Role redirects (все комбинации трёх ролей) | ✅ | traveler→/guide → /trips; guide→/trips → /guide/profile; не-админ → экран «Нужны права администратора» |
| Guide: `/guide/*` все 9 маршрутов | ✅ | Логин qa-guide; профиль, inbox, listings, bookings, calendar, reviews, stats, contact-visibility — рендер ок |
| Guide inbox → детали запроса | ✅ | Кнопка «Подробнее» ведёт на несуществующий маршрут (PRD-006) |
| Admin: dashboard, guides, listings, bookings, moderation, audit, disputes | ✅ | Логин qa-admin; все списки рендерятся |
| Admin `/admin/guides/[id]` (карточка проверки гида) | ⛔ | Очередь проверки пуста — карточку не открыть; статус ERR-097 не подтверждён и не опровергнут |
| Anon на protected-маршрутах | ✅ | Несогласованность паттернов (PRD-016) |

## Core product flows (payments excluded)

| Flow | Status | Notes |
|---|---|---|
| Создание запроса: пустая/невалидная форма | ✅ | Валидация работает |
| Создание запроса: реальный сабмит | ⏭ | Намеренно пропущен: локальная среда пишет в живую prod-БД |
| Запрос → отклики гидов → принятие | ⛔ | Нет активных откликов у qa-аккаунтов; поверхности осмотрены статически |
| Гид: отклик на запрос (bid form) | 🟡 | Панель осмотрена в коде (a11y PRD-023); сабмит не выполнялся |
| Бронирования / отзывы / споры | 🟡 | Списки открыты под ролями; detail-переходы без данных; disputes за флагом (выкл) |
| Сообщения (чат) | 🟡 | Списки и тред под guide; realtime-путь проверен по коду (PRD-003). WebSocket из песочницы аудита блокировался — ограничение среды аудита, не продукта (endpoint проверен напрямую — доступен) |
| Онбординг гида → отправка на проверку → admin review | 🟡 | Экран с чек-листом готовности открыт; полный цикл не прогонялся (пишет в prod-БД) |
| Загрузка файлов (фото портфолио) | 🟡 | Только по коду: presigned-path с проверкой префикса userId — ок; реальная загрузка не выполнялась |
| Статусы аккаунта draft/submitted/approved | 🟡 | По коду + admin-очередям; живых анкет в очереди нет |

## Checks run

| Check | Result |
|---|---|
| `bun run typecheck` | ✅ 0 ошибок |
| `bun run lint` | ✅ 0 ошибок |
| `bun run test:run` | ✅ 224 файла / 1082 теста — все зелёные |
| `bun run build` | ✅ собирается; один upstream-400 по hero-изображению в логах |
| `bun run playwright` (E2E_BASE_URL) | ❌ 5 failed / 6 skipped / 1 passed — суита сгнила (PRD-012) |
| Route inventory | ✅ 59 page.tsx + 7 API routes, полный HTTP-обход |
| Терминология (клиент/турист/поставщик/исполнитель/биржа/готовые туры) | ✅ 9 user-visible нарушений (PRD-017) |
| RLS / data-path divergence | ✅ probe живой БД анонимным ключом + код |
| Responsive 1280/375 | ✅ ключевые страницы, overflow не найден |
| A11y basics | ✅ source-sweep + браузер (PRD-022/023/028/029) |
| SEO basics | ✅ (PRD-019/020/030/031) |
| Security/privacy basics | ✅ (PRD-003/009/010/011/024/033) |

## Blocked / skipped summary

1. ⛔ Admin guide review detail — пустая очередь на живой БД.
2. ⛔ Listing detail / booking flow — нет опубликованных листингов.
3. ⏭ Мутации в живую БД (создание запроса, отклик, регистрация, загрузка файлов) — локальная среда подключена к продовой Supabase; ограничился безопасными QA-логинами.
4. ⏭ Платёжная система — исключена заданием.
5. Каверза среды: realtime WebSocket в аудиторской песочнице блокирован — networkidle-таймауты в первом прогоне ролей были артефактом; все страницы перепроверены и работают.
