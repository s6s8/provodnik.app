# NEXT_PLAN.md — Provodnik: Phase 8 to Launch

> Live state only. The historical STATUS append-log (pre-2026-05-17, ~90 KB,
> entries 2026-04-06 -> 2026-05-03) is archived to
> `.claude/sot/_archive/NEXT_PLAN-history-pre-2026-05-17.md` — local-disk only,
> the SOT `_archive/` subdir is gitignored. Last reviewed: 2026-05-17.
>
> Provenance tags on the live queue: `[owner-verified]` = a real epic/session
> in the store, or a decision Alex confirmed; `[bot-derived]` = an observation
> the orchestrator inferred — treat as open, never as established fact.

## Current status — newest STATUS entry

> STATUS (2026-05-04): **launch-readiness finale — shipped Phase 8–11, PRODUCT_READY_2026-05-04.md written, ~7 commits since cc2007b.** Brain ran the second overnight loop iteration off the Phase 8 audit findings. T071-GATE took the all-pass branch after T071.1 + T071.2 each returned zero P0/P1 findings. Plans 58/59/60/61 all closed: Plan 58 traveler/guide audit fixes, Plan 59 notifications schema + LCP priority + История chip + listing-detail hero, Plan 60 explicit fetchPriority for Next.js 16 priority Image (4 files) + production listings re-seed (10 rows, 6 categories), Plan 61 dead Unsplash URL replacement (2 photo IDs across 4 rows). 5 deferral ADRs landed (ADR-054 priority-on-listing-detail, ADR-055 broken-Unsplash-seed-images, ADR-056 listings-search-id-name, ADR-057 inbox-empty-state-copy, ADR-058 stale-test-credentials). Single open finding: nightlife chip in `interests.ts` — T001 partial regression (adventure removed correctly, nightlife survived a post-T001 edit) — P2 cosmetic, not a launch blocker. Slack patch_42 ts=`1777856565.358759`, Telegram message_id=3536, hours=15 (cumulative loop). Cumulative across both overnight runs (2026-05-02→2026-05-04): ~42 commits, 94 ledger rows ticked, 17 findings files, 11 phase gates closed, 9 ADRs added. Next: launch.

## Live queue — 2026-05-18 (orchestrator refresh)

Эпики и сессии прошлых недель консолидированы в один рабочий эпик
(Telegram-топик 1757, «Provodnik — командный центр»).

- **[owner-verified] E-19 «командный центр» (epic, DECOMPOSED, топик 1757).**
  Единый рабочий эпик; дерево — 5 задач, ни одна не запущена: #1 каталог
  «Готовые экскурсии» (H1 + навигация); #2 главная — надзаголовок блока
  запросов; #3 карточка экскурсии (бейдж типа, секции, цена); #4 браузер-
  проверка изменённых поверхностей; #5 страница запроса — «Сборная группа»
  слева и по умолчанию. Action: /fire 1..5 из топика 1757.
- **[owner-verified] Три модели продукта — зафиксированы.** Модель 1 «Сборная
  группа», модель 2 «Своя группа», модель 3 «Готовые экскурсии» — записаны в
  `KODEX.md` §«Три модели продукта» (2026-05-18). Комиссия 15% / 15% / 25%,
  оплата вне платформы до платёжного шлюза.
- **[owner-verified] Закрыты:** E-5 kodex-update (правило [verification] уже в
  KODEX), E-9 t-8-add-structure, T-3 «аккаунты», E-16 «Готовые экскурсии» —
  консолидированы или прерваны; остаточная работа перенесена в дерево E-19.
- **[owner-verified] Запуск по волнам** — флаги `FEATURE_TR_*` в Vercel, см.
  `docs/product/tripster-v1-rollout.md`. Сейчас конфиг pre-launch; волны 2–3
  гейтятся на 5+ активных листингов и 3+ завершённые брони.
- **[owner-verified] Платёжный шлюз — v2.** Пока оплата и комиссия идут вне
  платформы (`FEATURE_DEPOSITS=0`).

## Pending decisions — ждут команды Go (2026-06-03)

- **PENDING-1: Канонический термин «Сборная группа»** (решение владельца 2026-06-03,
  откат «Открытой группы»). Пара бейджей: «Сборная группа» / «Своя группа».
  Действие: терминология-sweep по UI, лейблам, форме запроса, карточкам — переносим
  по поверхностям (карточка → форма+деталка). `mode: "assembly"` в коде не трогаем
  (техническое значение, не UI-лейбл).

- **PENDING-2: Форма запроса — половинные поля «Сколько вас» + «Сборная группа»**
  — поле groupSize (число) и чекбокс «Сборная группа» объединяются в одну строку
  по half-width каждый, что убирает одну линию в форме.
  Acceptance: корректно работает на 375px и 1280px; лейбл чекбокса умещается.

- **PENDING-3: Форма запроса — «Языки» убирается в «Добавить детали»**
  Поле выбора языков скрыто из основного потока; открывается через «Добавить детали».
  Acceptance: поле недоступно на основном экране; в «Добавить детали» появляется и работает.

- **PENDING-4: Форма запроса — темы: 3 видимых + «Ещё темы»**
  Показываем только 3 самые распространённые темы, остальные скрыты под «Ещё темы».
  Acceptance: на 375px видны ровно 3 темы + кнопка «Ещё темы»; по нажатию раскрываются остальные.

  _Отклонено (2026-06-03): пресеты бюджета — разброс цен слишком широкий; числовой ввод остаётся._
  _Отклонено (2026-06-03): скрытие поля «Конец» — операторам нужна длительность для логистики._
  _Готово (2026-06-03): inline-toggle гибкой даты — «≈ Гибкая дата» под полем даты в форме запроса._
