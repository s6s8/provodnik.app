# Provodnik forensic audit — 2026-05-26
Generated: 2026-05-26T19:40:04
Source coverage: 13 epics (DONE+ABORTED), 72 tree nodes, plus 4 chat-pinned items.

## Summary

| Status | Count |
|--------|-------|
| DELIVERED | 50 |
| ABORTED-EPIC | 9 |
| SUBSUMED | 8 |
| KILLED | 2 |
| DELIVERED-WRONG | 2 |
| PARTIAL | 2 |
| PROMISED-LOST | 2 |
| DIAGNOSTIC-ONLY | 1 |
| **TOTAL** | **76** |

## E-76 caveats (my own form-epic, just shipped)

Per `OVERRIDES` map — these are items I marked shipped but verification finds defects:

### E-76/1 — CommissionBadge component + COMMISSION_PCT constant

- **Status**: DELIVERED-WRONG
- **SHA**: aae6cec
- **Evidence**: grep CommissionBadge src/ → 1 hit (definition only, no imports)
- **Why missed**: Author oversight — created CommissionBadge component but never imported it anywhere. The component file exists at src/components/shared/CommissionBadge.tsx, but `grep CommissionBadge src/` returns only the definition. AC required mounting under budget field; not mounted at all.
- **Follow-up**: One-line fix: import + render <CommissionBadge /> below budget input in homepage-request-form.tsx.

### E-76/2 — Trust-strip под CTA формы запроса (3 строки)

- **Status**: DELIVERED-WRONG
- **SHA**: 2a55728
- **Evidence**: grep TrustStrip src/ → 3 hits: definition + import + render in hero-form.tsx
- **Why missed**: AC specified mounting in homepage-request-form.tsx under CTA; actually mounted in homepage-hero-form.tsx after the form component. Visually appears below the form CTA (correct effect), but file location does not match AC.
- **Follow-up**: Move <TrustStrip /> from hero-form.tsx into request-form.tsx after the submit button block (or accept the visual outcome and update AC).

### E-76/9 — Скрыть имя путешественника до подтверждённой брони

- **Status**: PARTIAL
- **SHA**: 71f24ef
- **Evidence**: grep revealTravelerName src/ → 1 hit (definition only, no callsites)
- **Why missed**: Helper revealTravelerName was added to queries.ts:325 but no call-site updates were made. The original AC required actual conditional reveal on guide booking-detail pages. Behavior in production: traveler name still anonymous always (more conservative than spec, but spec not met).
- **Follow-up**: Locate guide BookingDetail page; pass real name from booking row into mapRequestRow and call revealTravelerName with booking status.

### E-76/14 — Verify баг allow_guide_suggestions закрыт после #4

- **Status**: PARTIAL
- **SHA**: 00027e0
- **Evidence**: grep allow_guide_suggestions in insert payload → 2 hits (one in commented-out line, one in supabase requests.ts schema)
- **Why missed**: Preventive fix: removed allow_guide_suggestions from insert payload (form, action, supabase/requests.ts). Symptom is gone. Original prod cause (schema cache missing the column OR column dropped on prod) not investigated. Column exists in canonical migration 20260401000001_schema.sql:151 and 20260522151500_add_traveler_request_flex_flags.sql notes it as old field. Real root cause unverified.
- **Follow-up**: Run NOTIFY pgrst, RELOAD SCHEMA on prod OR verify migration state. Then decide whether to restore the field or drop the column in cleanup-epic C6.

### E-76/15 — Диагностика ошибки загрузки документов верификации

- **Status**: DIAGNOSTIC-ONLY
- **SHA**: c05de4c
- **Evidence**: docs/audits/upload-error-2026-05-26.md exists, 59 lines
- **Why missed**: By design — ticket was scoped as diagnostic per the chat agreement. docs/audits/upload-error-2026-05-26.md shipped with 3 root-cause candidates. Bug itself was NOT fixed.
- **Follow-up**: Open follow-up ticket to apply one of the 3 candidate fixes after triage (RSC async-prop / Storage bucket / inline-prop pattern).

## Full audit (chronological)

| ID | Title | Source | Date | Status | SHA | WHY (if missed) |
|----|-------|--------|------|--------|-----|----------------|
| command-a0z1/1 | Register /epic <intent> command and create epic topic with pinned header | epic command-a0z1 (ABORTED) | 2026-05-12 | **ABORTED-EPIC** | - | Parent epic 'test phase-10a command center plan' was aborted before this ticket could ship. |
| command-a0z1/2 | Add in-memory epic registry mapping epicId to {topicId,status,submitter,createdA | epic command-a0z1 (ABORTED) | 2026-05-12 | **ABORTED-EPIC** | - | Parent epic 'test phase-10a command center plan' was aborted before this ticket could ship. |
| command-a0z1/3 | Wire multi-user message handler inside epic topics (mirrors /think pattern, no d | epic command-a0z1 (ABORTED) | 2026-05-12 | **ABORTED-EPIC** | - | Parent epic 'test phase-10a command center plan' was aborted before this ticket could ship. |
| command-a0z1/4 | Implement /decompose: call engine on topic transcript and post tree reply | epic command-a0z1 (ABORTED) | 2026-05-12 | **ABORTED-EPIC** | - | Parent epic 'test phase-10a command center plan' was aborted before this ticket could ship. |
| command-a0z1/5 | Parse engine decompose response into structured {title,size,deps} ticket objects | epic command-a0z1 (ABORTED) | 2026-05-12 | **ABORTED-EPIC** | - | Parent epic 'test phase-10a command center plan' was aborted before this ticket could ship. |
| command-a0z1/6 | Implement /epic-abort <reason>: mark aborted, post final message, unpin header | epic command-a0z1 (ABORTED) | 2026-05-12 | **ABORTED-EPIC** | - | Parent epic 'test phase-10a command center plan' was aborted before this ticket could ship. |
| command-a0z1/7 | End-to-end real-Telegram smoke: /epic → 3 messages → /decompose → /epic-abort | epic command-a0z1 (ABORTED) | 2026-05-12 | **ABORTED-EPIC** | - | Parent epic 'test phase-10a command center plan' was aborted before this ticket could ship. |
| nk-ow5g-zt1w/1 | ППФС — сквозной аудит сайта под 4 ролями (незалогиненный/путешественник/гид/адми | epic nk-ow5g-zt1w (DONE) | 2026-05-12 | **DELIVERED** | d14c647 |  |
| nk-ow5g-zt1w/2 | Этап 2 ППФС — совместный разбор реестров и финальная очередь починок | epic nk-ow5g-zt1w (DONE) | 2026-05-12 | **DELIVERED** | a2444ca |  |
| nk-ow5g-zt1w/3 | Починки P0/P1 из ППФС | epic nk-ow5g-zt1w (DONE) | 2026-05-12 | **DELIVERED** | 4ddd228 |  |
| nk-ow5g-zt1w/4 | Анти-дезинтермедиация — маскирование контактов в переписке, пункт оферты, экран  | epic nk-ow5g-zt1w (DONE) | 2026-05-12 | **DELIVERED** | 40f4e53 |  |
| nk-ow5g-zt1w/5 | Имитация транзакций mock-flow — «Я оплатил» + демо-плашка + полный цикл booking | epic nk-ow5g-zt1w (DONE) | 2026-05-12 | **DELIVERED** | 08df19d |  |
| nk-ow5g-zt1w/6 | Монетизация на бумаге — тарифная модель, комиссии, точки списания | epic nk-ow5g-zt1w (DONE) | 2026-05-12 | **KILLED** | 3a87f3c | killed without recorded reason |
| nk-ow5g-zt1w/7 | К5 — центрирование заголовка формы запроса на главной (desktop + mobile) | epic nk-ow5g-zt1w (DONE) | 2026-05-12 | **DELIVERED** | d3b0e7a |  |
| E-4/1 | Audit theme vocabularies and guide specialization storage across 3 surfaces | epic E-4 (ABORTED) | 2026-05-14 | **DELIVERED** | e3bc42b |  |
| E-4/2 | Create single canonical themes module (8 slugs + labels + icons) | epic E-4 (ABORTED) | 2026-05-14 | **DELIVERED** | aab21f4 |  |
| E-4/3 | Add structured themes[] field to guide profile + rename free-text to 'About as g | epic E-4 (ABORTED) | 2026-05-15 | **SUBSUMED** | - | Subsumed by E-10 #4 — guide profile specializations through canonical themes |
| E-4/4 | Guides page: chip filter on themes[] + text search across name and about | epic E-4 (ABORTED) | 2026-05-15 | **SUBSUMED** | - | Subsumed by E-10 #5 — /guides chip filter from canonical themes |
| E-4/5 | Excursions page: replace 5 unnamed buttons with 8 canonical chips + text search | epic E-4 (ABORTED) | 2026-05-15 | **SUBSUMED** | - | Subsumed by E-10 #3 — listings page canonical chips |
| E-4/6 | Request form: rename 'Интересы' to 'Темы' and remove 4 duplicate label dictionar | epic E-4 (ABORTED) | 2026-05-15 | **SUBSUMED** | - | Subsumed by E-10 #2 — homepage form Интересы→Темы |
| E-10/1 | Единый хелпер тем: удалить дубли INTEREST_LABELS/INTEREST_OPTIONS, выпилить reli | epic E-10 (DONE) | 2026-05-15 | **DELIVERED** | 8186b00 |  |
| E-10/2 | Форма запроса на главной: переименовать Интересы→Темы, рендер из канона | epic E-10 (DONE) | 2026-05-15 | **DELIVERED** | 0afc92d |  |
| E-10/3 | Готовые экскурсии: канонический PublicListingTheme + чипы тем из хелпера | epic E-10 (DONE) | 2026-05-16 | **DELIVERED** | 2919ce0 |  |
| E-10/4 | Профиль гида: онбординг и «о себе» пишут только specializations через канон | epic E-10 (DONE) | 2026-05-16 | **DELIVERED** | 7836d82 |  |
| E-10/5 | /guides: чипы из канона + новая строка поиска по имени и «о себе» (SSR, q) | epic E-10 (DONE) | 2026-05-16 | **DELIVERED** | b61baaf |  |
| E-16/1 | Расширить поиск гидов: индексация и разбор ввода по запятой | epic E-16 (ABORTED) | 2026-05-16 | **DELIVERED** | 6749940 |  |
| E-16/2 | Каталог готовых экскурсий: H1 «Готовые экскурсии» и переименование пункта навига | epic E-16 (ABORTED) | 2026-05-18 | **SUBSUMED** | - | Subsumed by E-19 (cmdcenter) #1 |
| E-16/3 | Главная: переименовать надстрочник блока открытых запросов | epic E-16 (ABORTED) | 2026-05-18 | **SUBSUMED** | - | Subsumed by E-19 (cmdcenter) #2 |
| E-16/4 | Карточка экскурсии: бейдж типа, подписи секций и формат цены | epic E-16 (ABORTED) | 2026-05-18 | **SUBSUMED** | - | Subsumed by E-19 (cmdcenter) #3 |
| E-16/5 | Браузер-проверка изменённых поверхностей под гостем и путешественником | epic E-16 (ABORTED) | 2026-05-18 | **SUBSUMED** | - | Subsumed by E-19 (cmdcenter) #4 |
| E-19/1 | Каталог готовых экскурсий: H1 «Готовые экскурсии» и переименование пункта навига | epic E-19 (DONE) | 2026-05-19 | **DELIVERED** | 39b1d36 |  |
| E-19/2 | Главная: надстрочник блока открытых запросов на «Что ищут путешественники прямо  | epic E-19 (DONE) | 2026-05-19 | **DELIVERED** | f2a2d6e |  |
| E-19/3 | Карточка экскурсии: бейдж типа, подписи секций, формат цены | epic E-19 (DONE) | 2026-05-19 | **DELIVERED** | 7757c76 |  |
| E-19/4 | Браузер-проверка изменённых поверхностей под гостем и путешественником | epic E-19 (DONE) | 2026-05-19 | **DELIVERED** | - |  |
| E-19/5 | Страница запроса: «Сборная группа» слева и форма по умолчанию при загрузке | epic E-19 (DONE) | 2026-05-19 | **DELIVERED** | 76165d7 |  |
| E-19/1 | Add guide registration entry point and lift traveler-only signup guard | epic E-19 (DONE) | 2026-05-19 | **DELIVERED** | 9550e44 |  |
| E-19/2 | Make registration failures report the real cause and avoid orphaned accounts | epic E-19 (DONE) | 2026-05-19 | **DELIVERED** | d5d6cee |  |
| E-19/3 | Show excursion time on homepage request cards | epic E-19 (DONE) | 2026-05-19 | **DELIVERED** | f126830 |  |
| E-19/4 | Remove commission claims from the public interface | epic E-19 (DONE) | 2026-05-19 | **DELIVERED** | da086b3 |  |
| E-19/5 | Rewrite Станьте Гидом subheading and fix registration CTA | epic E-19 (DONE) | 2026-05-19 | **DELIVERED** | c3d1bef |  |
| E-30/1 | Убрать редирект из submitOfferAction и показать зелёную «Отправлено» в панели | epic E-30 (DONE) | 2026-05-20 | **DELIVERED** | a516508 |  |
| E-32/1 | Schema + types: per-parameter flexibility flags on requests | epic E-32 (DONE) | 2026-05-23 | **DELIVERED** | 3ee1a6a |  |
| E-32/2 | Traveler request form: per-parameter 🔒/↔️ flags | epic E-32 (DONE) | 2026-05-22 | **DELIVERED** | dc889a3 |  |
| E-32/3 | «Мой запрос»: три линии бейджей вместо серой строки | epic E-32 (DONE) | 2026-05-23 | **DELIVERED** | 9282e83 |  |
| E-32/4 | Боковая форма отклика гида: редизайн с чтением флагов | epic E-32 (DONE) | 2026-05-23 | **DELIVERED** | a6c5b6b |  |
| E-32/5 | Карточка отклика: полоса бейджей + коллаж маршрута с лайтбоксом | epic E-32 (DONE) | 2026-05-23 | **DELIVERED** | af9631a |  |
| E-32/6 | Режим «Своя группа»: отличия от сборной | epic E-32 (DONE) | 2026-05-23 | **DELIVERED** | ae14bd5 |  |
| E-33/1 | Переименовать UI-подписи «Оператор» → «Администратор» | epic E-33 (DONE) | 2026-05-20 | **DELIVERED** | 27b9b05 |  |
| E-33/2 | Раздел «Лицензии» в админ-вью гида (показ-only) | epic E-33 (DONE) | 2026-05-21 | **DELIVERED** | d8cd673 |  |
| E-33/3 | Редактирование «Базового города» в кабинете гида | epic E-33 (DONE) | 2026-05-21 | **DELIVERED** | 6874c4e |  |
| E-33/4 | Серверное действие загрузки аватара (без модерации) | epic E-33 (DONE) | 2026-05-21 | **DELIVERED** | 86bb8a9 |  |
| E-33/5 | UI загрузки и отображения аватара (гид + путешественник) | epic E-33 (DONE) | 2026-05-21 | **DELIVERED** | 8940a7d |  |
| E-33/6 | Z-index панели «Сделать предложение» выше шапки | epic E-33 (DONE) | 2026-05-20 | **DELIVERED** | d389b46 |  |
| E-63/1 | Откатить переключатели гибкости из формы кабинета и слоя данных | epic E-63 (DONE) | 2026-05-25 | **DELIVERED** | d67307d |  |
| E-63/2 | Главная-форма: убрать чекбокс, поле «Цена за группу», правила «Максимум» и «Цена | epic E-63 (DONE) | 2026-05-25 | **DELIVERED** | - |  |
| E-63/3 | Свести форму к одному месту на главной; кабинет редиректит | epic E-63 (DONE) | 2026-05-25 | **DELIVERED** | - |  |
| E-76/1 | CommissionBadge component + COMMISSION_PCT constant | epic E-76 (DONE) | 2026-05-26 | **DELIVERED-WRONG** | aae6cec | Author oversight — created CommissionBadge component but never imported it anywhere. The component file exists at src/components/shared/CommissionBadge.tsx, but `grep CommissionBadge src/` returns onl |
| E-76/2 | Trust-strip под CTA формы запроса (3 строки) | epic E-76 (DONE) | 2026-05-26 | **DELIVERED-WRONG** | 2a55728 | AC specified mounting in homepage-request-form.tsx under CTA; actually mounted in homepage-hero-form.tsx after the form component. Visually appears below the form CTA (correct effect), but file locati |
| E-76/3 | Универсальная hero copy + env-дефолт поля «Куда» | epic E-76 (DONE) | 2026-05-26 | **DELIVERED** | 0273924 |  |
| E-76/4 | Удалить блок «Формат поездки», дефолт private в action | epic E-76 (DONE) | 2026-05-26 | **DELIVERED** | 7a23a0a |  |
| E-76/5 | Объединить счётчики «Сейчас/Максимум» + чекбокс попутчиков | epic E-76 (DONE) | 2026-05-26 | **DELIVERED** | 0907758 |  |
| E-76/6 | Expandable «+ Добавить детали» для поля Пожелания | epic E-76 (DONE) | 2026-05-26 | **DELIVERED** | 3d1705d |  |
| E-76/7 | Блок отклика для неверифицированного гида | epic E-76 (DONE) | 2026-05-26 | **DELIVERED** | e23aaa4 |  |
| E-76/8 | Фильтр входящих гида по базовому городу | epic E-76 (DONE) | 2026-05-26 | **DELIVERED** | 42e7722 |  |
| E-76/9 | Скрыть имя путешественника до подтверждённой брони | epic E-76 (DONE) | 2026-05-26 | **PARTIAL** | 71f24ef | Helper revealTravelerName was added to queries.ts:325 but no call-site updates were made. The original AC required actual conditional reveal on guide booking-detail pages. Behavior in production: trav |
| E-76/10 | Rename «лицензия» → «Аттестат» в UI поверхностях гида и админа | epic E-76 (DONE) | 2026-05-26 | **DELIVERED** | be49280 |  |
| E-76/11 | Убрать «Поездка» fallback + переименовать sort-опцию | epic E-76 (DONE) | 2026-05-26 | **DELIVERED** | 9e6da58 |  |
| E-76/12 | Темы запроса в правый верх карточки входящих гида | epic E-76 (DONE) | 2026-05-26 | **DELIVERED** | 7c91453 |  |
| E-76/13 | Аудит админ-карточки гида: добавить недостающие поля | epic E-76 (DONE) | 2026-05-26 | **DELIVERED** | c6af0c5 |  |
| E-76/14 | Verify баг allow_guide_suggestions закрыт после #4 | epic E-76 (DONE) | 2026-05-26 | **PARTIAL** | 00027e0 | Preventive fix: removed allow_guide_suggestions from insert payload (form, action, supabase/requests.ts). Symptom is gone. Original prod cause (schema cache missing the column OR column dropped on pro |
| E-76/15 | Диагностика ошибки загрузки документов верификации | epic E-76 (DONE) | 2026-05-26 | **DIAGNOSTIC-ONLY** | c05de4c | By design — ticket was scoped as diagnostic per the chat agreement. docs/audits/upload-error-2026-05-26.md shipped with 3 root-cause candidates. Bug itself was NOT fixed. |
| E-124/1 | Поправить строку «Когда» в форме запроса на главной | epic E-124 (ABORTED) | 2026-05-26 | **ABORTED-EPIC** | - | Parent epic 'говно на палочке' was aborted before this ticket could ship. |
| chat/E-124-когда | «Когда» row label symmetry + placeholder consistency | E-124 (aborted) + topic 3663 msgs 3686-3 | 2026-05-26 | **ABORTED-EPIC** | - | E-124 (govno na palochke) aborted before single-ticket landed. |
| chat/конец-placeholder | «Конец» time hint → placeholder | topic 3663 msgs 3711-3714 + form-epic di | 2026-05-26 | **PROMISED-LOST** | - | Discussed and agreed in form-epic chat, but never scoped into a tree node. I added placeholder pattern for groupMax in #5 but missed applying same pattern to endTime. |
| chat/cleanup-C6 | Cleanup C6 — drop unused columns (allow_guide_suggestions, date_flexibility, *_l | STRATEGY_DECISIONS 2026-05-26 §6 | 2026-05-26 | **PROMISED-LOST** | - | Scheduled +7d after form-epic prod-stable but no separate epic was opened. Form-epic is DONE locally but not yet deployed to prod. |
| chat/monetization-doc | «Монетизация на бумаге» — тарифная модель, комиссии, точки списания | ow5g #6 killed | 2026-05-12 | **KILLED** | - | Explicitly killed in ow5g tree. Reason not recorded. |

## WHY-missed taxonomy distribution

| Cause | Count |
|------|-------|
| Author oversight (mine) | 1 |
| Pipeline saturation / claude transient | 0 |
| Operator aborted epic | 9 |
| Subsumed by later epic | 8 |
| Scoped diagnostic-only | 1 |
| Killed without recovery | 2 |
| Promised-lost (chat-discussed, never tracked) | 2 |
