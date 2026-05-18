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

## Live queue — 2026-05-17 (orchestrator harvest)

Harvested from the open Telegram topics + the 2026-05-17 bible-discussion
(think topic 1622). Product memory captured this session into `KODEX.md`:
MVP model-1, «Биржа»→«запросы», the `[verification]` rule.

- **[owner-verified] E-16 «Готовые экскурсии» (epic, EXECUTING).** 5-node tree; node 1
  (поиск гидов: индексация + разбор ввода по запятой) shipped. Nodes 2–5
  planned, not fired: #2 каталог — H1 «Готовые экскурсии» + переименование
  навигации; #3 главная — надстрочник блока запросов «Что ищут путешественники
  прямо сейчас»; #4 карточка экскурсии — бейдж типа, подписи секций, формат
  цены; #5 браузер-проверка изменённых поверхностей под гостем и путешественником
  на 1280px и 375px. Action: `/fire 2` → 3 → 4 → 5, или `/epic-policy autoFire on`
  в топике E-16.
- **[bot-derived] Три модели Проводника — пробел.** Модель 1 (кастомизированные запросы на
  сборные группы) зафиксирована в `KODEX.md` 2026-05-17. Модели 2 и 3 не названы —
  Alex назвать, закрепить через `/kodex`. Без этого продуктовый слой памяти неполон.
- **[owner-verified] E-5 kodex-update (epic).** Правило `[verification]` из обсуждения теперь в
  `KODEX.md`. Эпик можно закрывать.
- **[owner-verified] T-3 «аккаунты» (session, был ESCALATED).** Оказался операционным вопросом
  («сколько аккаунтов на сайте сейчас»), не тикетом — сессия прекращена. Если
  число аккаунтов всё ещё нужно — это запрос к БД, не задача для пайплайна.
- **[owner-verified] E-9 t-8-add-structure (epic).** Тупиковое обсуждение — бот не открывает
  ссылки Telegram, нужен вставленный текст. Прекращён. Если надо разобрать,
  почему T-8 застрял на проверке — переоткрыть с полным текстом отказа в теле.

> Open product questions moved to `.claude/sot/ROADMAP.md` (2026-05-18).
