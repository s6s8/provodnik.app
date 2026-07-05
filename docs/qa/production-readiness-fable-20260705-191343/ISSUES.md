# Provodnik production-readiness audit — issues list

## Executive summary

СВОДКА: продукт технически собран крепко (сборка, типы, линт, 1082 юнит-теста — зелёные; RLS-граница в целом держит; админка защищена в три слоя), но к запуску не готов из-за трёх пробок: публичные профили гидов с русскими именами открываются в 404, публичный каталог запросов пуст для незалогиненных из-за неприменённой миграции, и realtime-чат отдаёт контакты в обход PII-маскирования. Отдельный системный риск — рассинхрон миграций репозитория и живой БД: слепой `db push` сейчас сломает прод.

- **Всего проблем: 35.** P0 launch blockers — 3 · P1 fix before beta — 10 · P2 fix before public launch — 13 · P3 polish/later — 9.
- **Рекомендация по запуску: НЕ запускать** до закрытия трёх P0 и PRD-004/005 (миграционный рассинхрон + тестовые гиды в живом каталоге). После этого — beta по короткому списку P1.
- **Платёжная система полностью исключена из аудита** по заданию; ни одна находка её не касается.

**Топ-10 порядок фиксов:**
1. PRD-001 — кириллические slug'и гидов → 404 (главная витрина мертва для реальных гидов).
2. PRD-002 — применить RLS-миграцию публичного каталога запросов (пустые «Запросы» для гостей).
3. PRD-003 — маскирование PII в realtime-сообщениях (одна строка в обработчике).
4. PRD-004 — сверить и примирить миграции с живой БД до любого `db push` (решение владельца).
5. PRD-005 — убрать/скрыть тестовых гидов с живого каталога.
6. PRD-006 — кнопка «Подробнее» в inbox гида ведёт на несуществующий маршрут.
7. PRD-007 — ссылка на профиль гида из карточки отклика ведёт в 404 (UUID вместо slug).
8. PRD-008 — битое hero-изображение: чёрный первый экран на мобильном.
9. PRD-010 — Sentry на сервере шлёт cookies/сессии третьей стороне (однострочный конфиг).
10. PRD-009 — регистрация без подтверждения email и без rate-limit.

Как использованы инструменты задания: Superpowers — дисциплина верификации (каждая заявленная находка перепроверена в браузере/на живой БД до включения в отчёт; две находки субагентов при перепроверке понижены/сняты). Ponytail — безжалостная приоритизация и краткие fix-directions с указанием минимального диффа. Context7 не понадобился: неопределённостей по библиотечным API в ходе аудита не возникло — все проверки эмпирические, против работающего приложения.

## P0 launch blockers

### PRD-001 — Публичные профили гидов с кириллическими slug открываются в 404
- **Severity:** P0 · **Category:** functional · **Surface:** `/guides/[slug]`
- **Evidence:** скриншоты `screenshots/guides-1280.png` (каталог) и `screenshots/guide-detail-1280.png` (404 после клика). Воспроизведено на локальном prod-билде, dev-сервере и **живом provodnik.app**: `/guides/жюль-верников-69f18040` → видимая «Страница не найдена» (HTTP 200). ASCII-slug `qa-guide-test-904cdd5c` работает (`screenshots/guide-detail-ascii-1280.png`).
- **Repro:** открыть /guides → кликнуть карточку гида с русским именем.
- **Expected:** профиль гида. **Actual:** «Страница не найдена».
- **Причина:** Next отдаёт `params.slug` percent-encoded; `getGuideBySlug` (src/data/supabase/queries.ts:478) ищет `.eq("slug", slug)` без `decodeURIComponent` — в кодовой базе нет ни одного decodeURIComponent. Slug'и генерируются из кириллических имён (`slugifyGuideProfileName`, src/lib/supabase/moderation.ts:601, сохраняет `\p{L}` — кириллицу), т.е. **у каждого реального русскоязычного гида профиль будет мёртв**.
- **Fix direction:** декодировать slug в начале `getGuidePageData`/`getGuideBySlug` (`decodeURIComponent(slug)`), либо транслитерировать slug'и в ASCII при генерации + миграция существующих. Проверить тот же класс бага на других кириллических динамических сегментах.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-002 — Публичный каталог «Запросы» пуст для незалогиненных: anon-RLS-миграция не применена к живой БД
- **Severity:** P0 · **Category:** data/RLS · **Surface:** `/requests`, `/requests/[id]`, sitemap
- **Evidence:** скриншот `screenshots/requests-1280.png` («Найдено 0 запросов»). Прямой probe живой БД анонимным ключом: `traveler_requests` → 0 строк, при этом под qa-traveler виден запрос `status=open, open_to_join=true, starts_on=2026-07-17`, который по политике из `supabase/migrations/20260609000001_public_catalog_anon_access.sql` обязан быть виден анониму. Вывод: миграция в репо есть, на живой БД не применена (класс ERR-092).
- **Expected:** гость видит открытые запросы (request-first витрина — ядро продукта). **Actual:** флагманский пункт навигации «Запросы» всегда пуст для гостей; URL запросов из sitemap отдают «не найден» (SEO-мусор, 200-код).
- **Fix direction:** применить политику к живой БД (через SQL editor + починить ledger, см. PRD-004), затем перепроверить anon-видимость. Не пере-прогонять data-миграции.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-003 — Realtime-сообщения обходят PII-маскирование: контакты уходят собеседнику в открытую
- **Severity:** P0 · **Category:** security/privacy · **Surface:** чат `/messages/[threadId]`
- **Evidence:** маскирование есть на обоих load-путях (page.tsx:72, API route:94), но realtime-хук `src/features/messaging/hooks/use-realtime-messages.ts:34-36` кладёт `payload.new` с сырым `body` в кэш, и `chat-window.tsx:58-64` рендерит его без `maskPii`.
- **Repro:** два участника треда онлайн; один отправляет сообщение с телефоном/email.
- **Expected:** телефон/email замаскированы до разблокировки контакта (антидезинтермедиация — бизнес-правило платформы, PII-012). **Actual:** до ручного refetch собеседник видит контакты в открытую.
- **Fix direction:** обернуть входящий body в `maskPii` в `handleNewMessage` — одна строка, закрывает единственный немаскированный путь.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

## P1 fix before beta

### PRD-004 — Системный рассинхрон миграций: репозиторий ≠ живая БД; слепой db push сломает прод
- **Severity:** P1 · **Category:** data/RLS · **Surface:** вся БД
- **Evidence:** (1) `20260528154254_drop_guide_display_name.sql` не применена — живой probe возвращает `guide_profiles.display_name = "Жюль Верников"`; при этом публичные имена гидов сейчас **держатся** на этой колонке (anon не читает `profiles` по RLS; fallback в queries/core.ts:263,537 и listings/[id]/page.tsx:72,97). Применить дроп сейчас = обнулить имена гидов и уронить listing-detail. (2) PRD-002 — вторая неприменённая миграция. (3) Прецеденты в SOT: ERR-092.
- **Expected:** миграционный ledger соответствует живой схеме. **Actual:** неизвестное множество неприменённых миграций; порядок применения теперь небезопасен.
- **Fix direction:** инвентаризация живой схемы против файлов миграций (information_schema/pg_proc/pg_policies), `supabase migration repair` для ledger; дроп display_name — только после перевода имён на `v_guide_public_profile.full_name`.
- **Owner decision needed:** yes (порядок и окно работ). **Payment relation:** not payment-related.

### PRD-005 — На живом публичном каталоге только тестовые гиды (QA Guide Test и «Жюль Верников» с фото Жюля Верна)
- **Severity:** P1 · **Category:** content/copy · **Surface:** `/guides`, live provodnik.app
- **Evidence:** `screenshots/guides-1280.png`; живой prod отдаёт те же два slug. Публичный био QA-гида — англоязычная заглушка “QA profile for live role walkthroughs.” (`screenshots/guide-detail-ascii-1280.png`).
- **Expected:** каталог без тестовых сущностей. **Actual:** для любого посетителя витрина = два фейка.
- **Fix direction:** снять с публикации (is_available=false) или пометить окружение; договориться о политике тестовых данных на проде.
- **Owner decision needed:** yes (нужны ли реальные гиды до запуска / скрыть каталог). **Payment relation:** not payment-related.

### PRD-006 — Inbox гида: кнопка «Подробнее» ведёт на несуществующий маршрут
- **Severity:** P1 · **Category:** functional · **Surface:** `/guide/inbox`
- **Evidence:** `guide-requests-inbox-screen.tsx:407` → `href={/guide/inbox/${item.id}}`; маршрута `/guide/inbox/[id]` нет ни в src/app, ни в билд-выводе.
- **Expected:** гид открывает детали запроса из инбокса. **Actual:** 404 на каждой карточке — ядровой поток гида обрублен.
- **Fix direction:** вести на существующую поверхность деталей запроса (или создать маршрут); свериться, куда сейчас ведёт рабочий путь отклика.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-007 — Карточка отклика: ссылка на профиль гида передаёт UUID в slug-маршрут → 404
- **Severity:** P1 · **Category:** functional · **Surface:** `/requests/[requestId]` (вид владельца запроса)
- **Evidence:** `request-detail-screen.tsx:614` → `/guides/${guideInfo.guide_id}` где guide_id = user_id (UUID); маршрут ищет только по `slug`.
- **Expected:** путешественник смотрит профиль откликнувшегося гида перед выбором. **Actual:** 404 — ключевой шаг доверия сломан.
- **Fix direction:** пробрасывать slug гида в view-model отклика и ссылаться на него.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-008 — Hero-изображение главной битое: на мобильном первый экран — чёрная пустота
- **Severity:** P1 · **Category:** visual · **Surface:** `/` @375px (и upstream-400 в логах на десктопе)
- **Evidence:** `screenshots/mobile-home-375.png` (чёрный фон + иконка битой картинки); server log: `upstream image response failed for …/listing-media/site/hero-provodnik.png 400`.
- **Expected:** фирменный hero. **Actual:** на 375px фон отсутствует; десктоп прикрыт вторым источником.
- **Fix direction:** перезалить `site/hero-provodnik.png` в bucket `listing-media` (или поправить путь), добавить фолбэк-фон.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-009 — Регистрация создаёт подтверждённые аккаунты на чужой email, без rate-limit
- **Severity:** P1 · **Category:** security/privacy · **Surface:** `/auth` (signUpAction)
- **Evidence:** `signUpAction.ts:90-99` — `admin.createUser({ email_confirm: true })`; в экшене нет ни одного вызова `rateLimit()` (в forgot-password — есть); zod-валидации входа нет (fullName неограничен).
- **Expected:** подтверждение владения email; троттлинг анонимного создания аккаунтов. **Actual:** сквоттинг чужих email (владелец потом получает «already_registered») и незатруднённый спам-реестр.
- **Fix direction:** стандартный signup с подтверждением (или email_confirm:false + verify), rate-limit по IP+email как в forgot-password, zod на вход.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-010 — Sentry (server+edge) шлёт cookies/headers/IP: sendDefaultPii=true
- **Severity:** P1 · **Category:** security/privacy · **Surface:** серверные ошибки всего приложения
- **Evidence:** `sentry.server.config.ts:24`, `sentry.edge.config.ts:25` (активные конфиги через src/instrumentation.ts); клиентский конфиг корректно false. Любая серверная ошибка может унести живой auth-cookie сессии в Sentry.
- **Fix direction:** `sendDefaultPii:false` в обоих корневых конфигах (или beforeSend со стрипом cookies); удалить мёртвый дубль `src/sentry.edge.config.ts`.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-011 — Свободный текст запроса путешественника рендерится без PII-маскирования
- **Severity:** P1 · **Category:** security/privacy · **Surface:** `/requests` каталог и `/requests/[id]` (гости и гиды)
- **Evidence:** `(site)/requests/page.tsx:40,43` и `request-detail-screen.tsx:281,484,669` рендерят `description/notes` сырыми; все соседние поверхности (listings, reviews, offers, QA, чат) маскируются.
- **Expected:** телефон/Telegram в тексте запроса замаскированы для всех, кроме владельца. **Actual:** контакты в описании запроса видны гидам (и гостям после фикса PRD-002) — обход бизнес-модели.
- **Fix direction:** `maskPii()` в публичных view-model builders (не для владельца).
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-012 — E2E-суита сгнила: 5 из 6 активных спеков падают, 6 спеков tripster-v1 навечно skipped
- **Severity:** P1 · **Category:** QA/infrastructure · **Surface:** tests/e2e
- **Evidence:** прогон `E2E_BASE_URL=http://localhost:3000 bun run playwright`: **5 failed / 6 skipped / 1 passed**. Падения — на селекторах удалённых секций (`section[aria-label="Открытые запросы путешественников"]`, heading «готовые экскурсии», кнопка «отправить запрос» — теперь «Найти гида»). tripster-v1 скипается: `QA_SEED_PASSWORD not set` (Playwright не читает .env.local). Skipped-сьюты — это не зелёный прогон, а отсутствие e2e-ворот.
- **Fix direction:** обновить спеки под текущий UI, прокинуть env в playwright.config (dotenv), вернуть tripster-v1 в строй по одному спеку.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-013 — Незакоммиченный фикс модерации + непримененная в git миграция publish_approved_guides — единый атомарный комплект
- **Severity:** P1 · **Category:** QA/infrastructure · **Surface:** ветка handover/excel-fixes
- **Evidence:** рабочая копия: `src/lib/supabase/moderation.ts` (approve теперь ставит is_available+slug), `queries.ts` (флип `p_has_listings:false`), untracked `supabase/migrations/20260702000001_publish_approved_guides.sql` (бэкфилл уже виден в живой БД). Код не закоммичен; миграция не в git.
- **Expected:** код и миграция шипятся атомарно. **Actual:** свежая среда без миграции сделает всех прежних approved-гидов невидимыми; при этом diff на 99% — CRLF-шум, реальной логики ~50 строк.
- **Fix direction:** закоммитить комплект (миграция + moderation.ts + queries.ts + revalidatePath-правки) одним PR; отдельно нормализовать line endings, чтобы диффы читались.
- **Owner decision needed:** yes (кто и когда коммитит handover-ветку). **Payment relation:** not payment-related.

## P2 fix before public launch

### PRD-014 — Просроченные запросы отображаются как активные «Ждёт гида»
- **Severity:** P2 · **Category:** functional · **Surface:** `/trips`
- **Evidence:** скриншот `screenshots/traveler--trips-1280.png`: запрос «Элиста, 4 июля» показан «Ждёт гида» 5 июля. Код: `getActiveRequests` включает `.in('status', ['open','expired'])` (traveler-requests.ts:97), а маппер карточки (traveler-requests-screen.tsx:88) не имеет ветки expired.
- **Expected:** просроченный запрос помечен и предлагает продлить/пересоздать. **Actual:** путешественник бесконечно «ждёт гида» по мёртвому запросу.
- **Fix direction:** добавить состояние expired в карточку (бейдж + CTA пересоздания) или не включать expired в активные.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-015 — Админ не может открыть модерируемое объявление: ссылка ведёт на published-only страницу
- **Severity:** P2 · **Category:** functional · **Surface:** `/admin/moderation`
- **Evidence:** `ModerationQueueItem.tsx:163` → `/listings/${listing.id}`, а публичная страница берёт только `status="published"` ((site)/listings/[id]/page.tsx:22,46). Очередь содержит только `pending_review` → гарантированный 404.
- **Fix direction:** админ-превью (admin-клиент по id) или страница с допуском admin к не-published.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-016 — Несогласованная обработка анонима на кабинетных маршрутах: пустые страницы вместо редиректа
- **Severity:** P2 · **Category:** auth/roles · **Surface:** `/messages`, `/notifications`, `/account`, `/trips`
- **Evidence:** HTTP-обход анонимом: `/trips` → 307 /auth; `/account` → 200 с inline-«Войдите»; `/messages`, `/notifications` → 200 с **пустым телом** (только шапка).
- **Expected:** единый паттерн (редирект на /auth?next=…). **Actual:** три разных поведения; пустые страницы выглядят как поломка. Утечки данных нет.
- **Fix direction:** привести все кабинетные маршруты к redirect-паттерну /trips.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-017 — Терминологический канон: 9 user-visible нарушений (турист/исполнители/Биржа/готовые туры)
- **Severity:** P2 · **Category:** content/copy · **Surface:** admin/bookings, offer-actions (тексты ошибок гиду), disputes-queue, guide-excursions empty-state, become-a-guide, help, destination-detail (×2)
- **Evidence:** admin/bookings/page.tsx:145 «Турист:»; offer-actions.ts:52,60 «Турист просит…»; disputes-queue.tsx:69 fallback «Турист»; guide-excursions-screen.tsx:307 «заявки туристов»; become-a-guide/page.tsx:45 «случайными исполнителями»; help/page.tsx:60 «на Бирже»; destination-detail-screen.tsx:108,192 «готовых туров»/«Готовые туры». Ноль вхождений: клиент, поставщик.
- **Fix direction:** путешественник / гиды / «в Запросах» / готовые экскурсии — точечные правки строк.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-018 — «Открытые группы» на главной: термин официально откачен канонном 2026-06-03
- **Severity:** P2 · **Category:** content/copy · **Surface:** `/` scroll-cue
- **Evidence:** `screenshots/home-1280.png` (низ экрана); канон KODEX: пара «Сборная группа»/«Своя группа», эксперимент «Открытая группа» отменён решением владельца.
- **Fix direction:** переименовать метку scroll-cue.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-019 — Нет ни одного OG/Twitter-изображения — шеринг без превью
- **Severity:** P2 · **Category:** SEO · **Surface:** все страницы
- **Evidence:** grep по src/app: только layout.tsx (siteName без images); файлов opengraph-image*/twitter-image* нет. Ссылка в Telegram/WhatsApp — без картинки.
- **Fix direction:** статический opengraph-image для корня + генерируемые для профилей гидов.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-020 — Sitemap: приватные запросы, орфанный /ai с приоритетом 0.9, нет маркетинговых страниц, замороженные даты
- **Severity:** P2 · **Category:** SEO · **Surface:** sitemap.ts
- **Evidence:** sitemap.ts:50-53 включает все open-запросы без фильтра доступности (для краулера → «не найден» с HTTP 200); :30 — /ai (нет ни одной входящей ссылки в приложении); /how-it-works, /help, /become-a-guide, /for-business, /policies/* отсутствуют; :7 — module-scope `new Date()`.
- **Fix direction:** фильтр по anon-видимым запросам, добавить живые статические страницы, решить судьбу /ai, lastModified per-request.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-021 — Пустые публичные каталоги доступны по прямым URL: /listings и /destinations
- **Severity:** P2 · **Category:** UX · **Surface:** `/listings`, `/destinations`
- **Evidence:** «Найдено 0 экскурсий», «Пока нет доступных направлений» (после скрытия секций каталога 2026-06-30 маршруты остались достижимы: /tours и /search редиректят на /listings, sitemap не ссылается).
- **Expected:** либо каталоги наполнены, либо маршруты закрыты/редиректят. **Actual:** пустые витрины по прямым ссылкам.
- **Fix direction:** решение владельца: seed данных vs redirect на / до наполнения.
- **Owner decision needed:** yes. **Payment relation:** not payment-related.

### PRD-022 — Страница входа: нет title/h1, ошибки не анонсируются скринридеру
- **Severity:** P2 · **Category:** accessibility · **Surface:** `/auth`
- **Evidence:** title = дефолтный «Provodnik — Найди своего гида» (вводит в заблуждение); в auth-entry-screen.tsx нет ни одного h1-h6; error-блок :417-421 без role="alert"/aria-live; aria-invalid — 0 вхождений в файле.
- **Fix direction:** metadata title «Вход», h1, role="alert" на error-блок, aria-invalid на поля.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-023 — Форма отклика гида: два числовых поля без label
- **Severity:** P2 · **Category:** accessibility · **Surface:** bid-form-panel
- **Evidence:** bid-form-panel.tsx:528 (сколько человек) и :562 (цена на человека — только исчезающий placeholder); 1 htmlFor на 8 инпутов.
- **Fix direction:** label/htmlFor или aria-label на оба поля.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-024 — Rate-limiting «fail open»: без Redis-переменных лимитов нет вообще; LLM-endpoint без бюджета
- **Severity:** P2 · **Category:** security/privacy · **Surface:** `/api/requests/parse`, forgot-password
- **Evidence:** src/lib/rate-limit.ts:69-130 — при отсутствии/ошибке `STORAGE_KV_REST_API_URL/TOKEN` все лимиты возвращают success. В локальном .env.local этих переменных нет; наличие на прод-Vercel не проверялось (нет доступа из аудита).
- **Expected:** аноним не может жечь OpenRouter-кредиты безлимитно. **Actual:** зависит от прод-env; при потере переменных деградация тихая.
- **Fix direction:** проверить прод-env; для LLM-бюджета — fail-closed или in-memory фолбэк.
- **Owner decision needed:** yes (проверка прод-переменных). **Payment relation:** not payment-related.

### PRD-025 — «Переключиться на гида» в меню путешественника — тупик
- **Severity:** P2 · **Category:** UX · **Surface:** user-account-drawer (все страницы кабинета traveler)
- **Evidence:** navigation.ts:134 — roleSwitch traveler → /guide; proxy для чистого traveler отбрасывает назад в /trips (строгий roleHasAccess). Пункт меню виден каждому путешественнику и ничего не делает.
- **Fix direction:** вести на /become-a-guide (или auth?role=guide), либо скрыть пункт.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

### PRD-026 — Legacy-редирект /guide/[id] недостижим для своей аудитории (гостей)
- **Severity:** P2 · **Category:** functional/SEO · **Surface:** `(site)/guide/[id]`
- **Evidence:** страница — permanentRedirect на /guides/[slug], но role-routing требует роль guide на всём дереве /guide → аноним уходит на /auth, traveler — в /trips. Старые внешние ссылки мертвы; вместе с PRD-007 UUID-путь к профилю отсутствует полностью. robots.ts:8 к тому же закрывает /guide/ от краулеров (см. PRD-031).
- **Fix direction:** исключить `(site)/guide/[id]` из role-guard (точечные разрешения) или перенести редирект в proxy до auth-check.
- **Owner decision needed:** no. **Payment relation:** not payment-related.

## P3 polish / later

### PRD-027 — Сырые сообщения Supabase/Error.message уходят пользователю
- P3 · UX · offer-actions.ts:249,361; guide/bookings/[bookingId]/actions.ts:37,127; moderateListing.ts:36,49; moderateReply.ts:36,49; join-request-action.ts:60; admin/guides/[id]/actions.ts:38,65,92. Паттерн friendlyError уже есть в disputes — распространить.

### PRD-028 — Ошибки полей booking-формы не связаны с инпутами
- P3 · accessibility · BookingFormTabs.tsx:229-262,308 — нет aria-invalid/aria-describedby/role=alert на полевых ошибках (топ-Alert анонсируется).

### PRD-029 — Нет skip-to-content ссылки
- P3 · accessibility · глобально; дешёвый фикс в (site)/layout.tsx.

### PRD-030 — /destinations/[slug] без canonical
- P3 · SEO · destinations/[slug]/page.tsx:52-55 — единственный detail-тип без alternates.canonical.

### PRD-031 — robots.ts disallow /guide/ блокирует переобход legacy-редиректов
- P3 · SEO · robots.ts:8 — точечные disallow на разделы кабинета вместо всего префикса.

### PRD-032 — Копеечная математика /100 вне money.ts
- P3 · QA · booking-detail-screen.tsx:891, guide-requests-inbox-screen.tsx:392, dispute-case-detail.tsx:35 — display-only, но дрейф против ADR-013; заменить на kopecksToRub/formatRubFromMinor.

### PRD-033 — Публично читаемые listing_inclusions и referral_program_config (using true)
- P3 · data/RLS · 20260623120000_redesign_foundation_additive.sql:31,47 — inclusions черновых листингов доступны anon; низкая чувствительность; ограничить published-родителями.

### PRD-034 — Строковая интерполяция в PostgREST .or() фильтре
- P3 · QA · queries.ts:158 getListingsByDestination — имя с запятой/скобкой ломает фильтр; перейти на отдельные .ilike().

### PRD-035 — Мёртвый код и мелкие несоответствия (пакет-уборка)
- P3 · QA/UX · ROUTES.search и ROUTES.myBookings указывают на несуществующие маршруты (navigation.ts:25,34); BirjhaScreen не импортируется нигде; module-scope notFound() в account/notifications/page.tsx:16 (при выключенном флаге бросает на импорте); непоследовательная пунктуация ошибок формы главной («Укажите дату начала.» с точкой vs «Выберите хотя бы одну категорию» без); двойной robots-meta (noindex + index,follow) на not-found страницах — самый строгий выигрывает, но лучше чистить.

## Cross-cutting product risks

1. **Миграционный дрейф как класс** (PRD-002, PRD-004, прецеденты ERR-092): ledger живой БД недостоверен; любые проверки «зелёные тесты» не ловят неприменённые миграции. До запуска нужна процедурная гарантия: каждая миграция подтверждается introspection'ом живой схемы.
2. **Кириллица в динамических сегментах** (PRD-001): любые будущие slug'и из русских строк — та же мина. Нужен единый хелпер slug→URL и decode-на-входе.
3. **Пустой маркетплейс на старте** (PRD-002, PRD-005, PRD-021): даже после фиксов гость видит 2 тестовых гида, 0 экскурсий, 0 направлений и считанные запросы. Cold-start контент — продуктовая задача уровня запуска, не только техническая.
4. **PII-маскирование как «ручная дисциплина»** (PRD-003, PRD-011): каждая новая поверхность обязана сама вспомнить про maskPii (PII-012). Пока это соглашение, а не механизм — будут рецидивы; стоит централизовать маскирование в view-model слое.
5. **Двойные источники правды по именам гидов** (display_name vs profiles.full_name vs v_guide_public_profile) — PRD-004; консолидация на view снимет и RLS-развилку.
6. **404-за-200** (класс ERR-056): «не найденные» detail-страницы отдают HTTP 200; noindex-мета присутствует, но для краулеров с полным HTML это остаётся мусорной выдачей (усиливается PRD-020).

## Route and flow coverage

Полная матрица — в `COVERAGE.md` (этой же папки). Кратко: 59 страниц + 7 API-маршрутов инвентаризованы; публичные поверхности пройдены на 1280/375 с чистой консолью; все три QA-роли (traveler/guide/admin) залогинены и прокликаны по своим кабинетам; role-redirect матрица проверена. Blocked: карточка проверки гида в админке (пустая очередь), listing-detail/booking (нет опубликованных листингов). Skipped: реальные мутации в живую БД (локальная среда подключена к продовой Supabase) и вся платёжка (по заданию).

## Checks run and results

| Проверка | Результат |
|---|---|
| bun run typecheck | ✅ 0 ошибок |
| bun run lint | ✅ 0 ошибок |
| bun run test:run | ✅ 1082/1082 |
| bun run build | ✅ (1 upstream-400 hero-изображения в логах — PRD-008) |
| bun run playwright | ❌ 5 failed / 6 skipped / 1 passed (PRD-012) |
| Anon HTTP-обход всех маршрутов | ✅ выполнен (аномалии → PRD-016) |
| Live-DB RLS probe (anon + qa-traveler) | ✅ выполнен (→ PRD-002, PRD-004) |
| Live prod spot-check provodnik.app | ✅ PRD-001 и PRD-005 воспроизведены на проде |

## Blockers / not fully tested

1. **Admin guide review detail** (`/admin/guides/[id]`) — очередь пуста, карточку не открыть. Известная ERR-097 («generic error page для всех гидов») не подтверждена и не снята. Разблокировка: тестовая анкета в статусе submitted.
2. **Listing detail и весь booking-поток** — в живой БД нет опубликованных листингов.
3. **Реальные сабмиты** (создание запроса, отклик, регистрация, аплоад) — пропущены сознательно: локальный билд пишет в живую продовую БД. Разблокировка: изолированная staging-БД или явное разрешение на тестовые записи с последующей уборкой.
4. **Прод-переменные Vercel** (rate-limit Redis, FEATURE_TR_*) — нет доступа из аудита; поведение флагов проверено в состоянии «все выключены».
5. **Платёжная система** — исключена заданием.

## Recommended execution plan

1. **День 1 — разблокировать витрину (P0):** PRD-001 (decode slug — маленький дифф + проверка на живом), PRD-003 (одна строка maskPii), PRD-002 (применить RLS-миграцию руками через SQL editor с introspection-проверкой).
2. **День 1-2 — гигиена прода:** PRD-005 (снять тестовых гидов), PRD-010 (sendDefaultPii=false), PRD-008 (перезалить hero).
3. **День 2-3 — ядровые потоки:** PRD-006, PRD-007 (обе — битые ссылки в главном цикле запрос↔гид), PRD-013 (закоммитить handover-комплект атомарно).
4. **До beta:** PRD-004 (сверка миграций — с окном и бэкапом), PRD-009 (регистрация), PRD-011 (маскирование запросов), PRD-012 (реанимация e2e как ворот регрессии).
5. **До публичного запуска:** P2 пакетом — терминология (PRD-017/018) одним PR, SEO (PRD-019/020), UX-хвосты (PRD-014/015/016/021/025/026), a11y (PRD-022/023), PRD-024.
6. **Фоново:** P3-пакет уборки одним спринтом.

Платёжная система намеренно не затронута ни в одном пункте.
