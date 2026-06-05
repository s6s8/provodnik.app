# KODEX — Operating discipline (Кодекс «Протуберанец»)

Свод профессионального поведения **и продуктовый канон** проекта —
единый канонический файл памяти. **Не свод UI/CSS правил** — те
живут в `.claude/sot/PATTERNS.md`. Captured live via the `/kodex`
slash command or the `+kodex` message-suffix from any topic. Sonnet
reformats raw captures into the canonical 1-line shape before append.
Структурные секции («Product canon», нумерованные правила) правятся
владельцем напрямую; дневник captured-правил — только через `/kodex`.

---

## Six axes (stable — не редактируй без сильного основания)

1. **Process** — read context before touching code. PROJECT_MAP +
   HOT + ADR before any concrete proposal. Если не прочитал —
   не рекомендуй.
2. **Communication** — no jargon, no tool names, no file paths in
   user-facing Russian replies. Инженерная точность каждого слова.
3. **Decomposition** — one symbol + one verb + one acceptance check
   per task. Если задаче нужны два предложения — раздели на две.
4. **Reporting** — DONE требует commit SHA. Зелёный typecheck ≠
   "фича работает". State what shipped, not what compiled.
5. **Directness** — answers carry options + tradeoffs + a
   recommendation. Don't make the client extract information
   sentence by sentence.
6. **Verification — both directions** — confirm understanding
   before writing a plan ("Понял так: X. Если иначе — поправь."),
   confirm output against spec in a browser before marking
   complete.

---

## Four discipline traps (stable)

- **Trap 1 — Rule without sweep**: adding a new UI rule without
  auditing existing surfaces for violations of that rule. Правило
  без зачистки = новая поверхность для рассинхрона.
- **Trap 2 — Complaint becomes comment**: defending against the
  client's complaint with a justifying comment instead of measuring
  and writing a fix task. Жалоба → задача с числовой целью,
  не комментарий.
- **Trap 3 — Memory without queued plan**: recording a defect in
  memory without creating an executable artifact. Документирование
  ≠ фикс.
- **Trap 4 — DONE without browser-check**: marking complete on
  green typecheck alone, without opening the surface in a browser
  at the correct viewport under the correct role. Code-level
  audit ≠ UI verification.

---

## Workflow primitives (стабильно — справочно)

- **Большая работа (feature, эпик)** открывается через `/epic <intent>` из
  General. Командный центр (эпик-топик) живёт пока работа не закрыта;
  Bek хранит дерево тикетов и репортит закрытия дочерних. Закрываем эпик
  через `/epic-done`. Прервать — `/epic-abort <reason>`.
- **Один тикет** (фикс, маленькое изменение) — `/new <description>` из General.
- **Обсуждение без работы** (брейншторм) — `/think <slug>` (эквивалент
  `/epic` с однотикетной декомпозицией в переходный период).
- **Захват правила вживую** — `/kodex <rule>` или `+kodex` суффикс к
  любому сообщению.

---

## Product canon (что строим)

Продуктовый канон Проводника. Поглощено из `PRODUCT.md` 2026-05-17
(файл удалён, KODEX — единственный канонический дом). Полные документы:
`docs/product/MVP.md`, `docs/product/PRD.md`, `docs/product/MARKET_RESEARCH.md`,
`docs/superpowers/specs/2026-04-13-provodnik-mission-vision.md`,
`docs/product/research/tripster/`.

### Модель: demand-first

Проводник — **demand-first**: путешественник публикует запрос, гиды
откликаются предложениями, другие путешественники присоединяются к тому
же запросу. Это инверсия listing-first модели конкурента (Tripster)
(`mission-vision.md` §What makes us different from Tripster).

| | Tripster (listing-first) | Проводник (request-first) |
|---|---|---|
| Кто инициирует | Гид публикует → путешественник находит | Путешественник запрашивает → гид откликается |
| Цена | Фиксирована гидом заранее | Согласуется через отклики |
| Сборка группы | Гид создаёт слоты | Путешественники присоединяются к чужим запросам |
| Комиссия | 22% + платное продвижение | 15% на запросах (модели 1 и 2), 25% на готовых (модель 3) |

Готовые экскурсии — это **модель 3** (см. «Три модели продукта»):
полноценный продукт бронирования, но третий по важности. Главный
двигатель воронки — модель 1 (запрос → отклик → присоединение):
request-first остаётся дифференциатором против listing-first Трипстера.
Принцип MVP: «request-first, but not request-only» (`MVP.md` §5).

### Три модели продукта

Проводник работает по трём моделям. Все три запускаются одновременно с
запуском продукта; порядок важности 1 → 2 → 3. Источник: Alex,
обсуждение 2026-05-18 — это решение отменяет прежние записи о «0%
комиссии в v1» и «готовые экскурсии — не продукт бронирования».

**Модель 1 — «Сборная группа»** (MVP, ядро продукта, ноу-хау).
Путешественник делает кастомизированный запрос: свои дата, время,
параметры; бюджет задаёт сам заказчик. К запросу добираются другие
путешественники — собирается группа, цена делится на всех. Решает и
стоимость (одиночная экскурсия дорогая), и график (не попал на
фиксированное время готовых экскурсий, путешествуешь с семьёй или один,
отстал от группы — причин много). Комиссия платформы — 15%.
Канонический термин — «Сборная группа» (решение владельца 2026-06-03).
Прежний эксперимент с термином «Открытая группа» откатан: голое
прилагательное «Открытая» без существительного читалось гидом как сигнал
«открыта для отклика», а не как состав группы — двусмысленность. Пара
бейджей симметрична и про состав группы: «Сборная группа» / «Своя группа».

**Модель 2 — «Своя группа»** (вторая по важности). То же, что модель 1,
но группа закрытая: путешественник приходит со своей уже собранной
компанией, посторонних в группу не добавляют. Дату, время и бюджет
задаёт заказчик; гиды решают, берутся или нет. Комиссия платформы — 15%.

**Модель 3 — «Готовые экскурсии»** (третья по важности, традиционный
слой). Классические готовые экскурсии — модель Трипстера и Спутника:
гид публикует фиксированную экскурсию, путешественник покупает её как
есть. Цену за человека задаёт гид (в моделях 1 и 2 цену задаёт турист).
Комиссия платформы — 25%: гид по договору с Трипстером не вправе ставить
цену ниже на другой платформе, иначе теряет аккаунт, поэтому готовые
экскурсии в Проводнике держат трипстеровскую цену.

### MVP-граница

MVP обязан отгрузить **полную безденежную транзакционную петлю**:
discovery → захват запроса → сборка группы → отклик гида → подтверждение
брони → отзывы → модерация → возвраты/поддержка. Пропуск любой части
возвращает продукт к проблемам, которые он решает (`MVP.md` §18).

V1 scope locks (`mission-vision.md` §V1 scope decisions, locked 2026-04-11):
- Без платёжной интеграции — деньги движутся вне платформы между
  путешественником и гидом.
- Без депозитов; контакт гида + точная точка встречи открываются при
  принятии отклика.
- Bid-first для всех типов брони; instant-book в v1 нет.
- Без UI отмены (admin-only dispute path в БД есть).
#### Комиссионная лестница (решение владельца 2026-05-26 / 2026-05-18)

| Фаза | Модель 1 «Сборная группа» | Модель 2 «Своя группа» | Модель 3 «Готовые экскурсии» | Revisit trigger |
|---|---|---|---|---|
| **Phase A** (Элиста + scale-pilot regions) | **10%** | **10%** | **10%** | ≥5 активных листингов **И** ≥3 реальных брони → старт Phase B |
| **Phase B+** | **15%** | **15%** | **25%** | После доказательства Phase A unit-economics и запуска платёжного шлюза |

Источник правды для product code: `COMMISSION_PCT` в `src/config/commission.ts`.
Маркетинговый wedge Phase A: 10% vs Sputnik8 24%+ и Tripster effective-prepayment.
Отменяет прежнее «0% в v1». Пока нет платёжного шлюза, комиссия и вся
оплата идут вне платформы; платёжный шлюз — задел на будущее.

#### V1 MUST-HAVE

| Функция | Что именно входит |
|---|---|
| Discovery | Каталог экскурсий и гидов: фильтр по городу, категории, формату, дате; SEO-страницы листинга и профиля |
| Request capture | Путешественник создаёт структурированный запрос: даты, бюджет, размер группы, интересы, город назначения |
| Group assembly | Другие путешественники присоединяются к открытому запросу; отображение текущего числа участников и расчёта цены |
| Offer + bid | Гид шлёт структурированное предложение (цена, включения, тайминг, ёмкость, срок действия); путешественник сравнивает и принимает одно |
| Money-less booking confirmation | Объект брони создаётся; платёжные инструкции показаны до подтверждения; расчёт происходит вне платформы |
| Reviews | Только по завершённой брони; обе стороны оставляют оценку; флаггинг → очередь модерации |
| Moderation | Верификация гида (документы, аттестат), проверка листинга, модерация флаггированного контента и отзывов |
| Admin disputes | Кейс-менеджмент: возврат, отмена, мошенничество, no-show; аудит-запись на каждое административное действие |

#### V1 EXCLUDED

| Исключение | Revisit trigger |
|---|---|
| Платёжная интеграция | Phase B: ≥5 активных листингов И ≥3 завершённых реальных брони в Элисте |
| Депозиты | После запуска платёжного шлюза (Phase B+) |
| Instant-book | После накопления достаточного предложения гидов в городе; отдельное решение владельца |
| UI отмены для путешественника | После замера cancel rate в Phase A; admin-only DB-path уже реализован |
| Мульти-город | После доказательства unit-economics в Элисте → старт Phase B (Карелия) |

### Профиль гида — структурированные поля

Канонические поля профиля гида, отображаемые на гид-странице и админ-карточке (UI labels — Russian):

- **Базовый город** — `base_city` (TEXT). Город, где гид физически базируется. Используется для фильтра входящих запросов: гид видит только запросы, у которых `destination_city ≈ base_city` (case-insensitive). Также для публичного фильтра «Гиды по городу». Добавлена миграцией `20260426000001_plan10_guide_notifications.sql`.

- **Юридические данные** — блок полей, опциональный для физлица-гида, обязательный для зарегистрированного гида-предпринимателя / ИП / самозанятого:
  - `legal_status` (TEXT) — Правовой статус (физлицо / самозанятый / ИП / ООО).
  - `inn` (TEXT) — ИНН.
  - `document_country` (TEXT) — Страна документа (для иностранных гидов в РФ-сценарии Phase B+).
  - `is_tour_operator` (BOOLEAN) — Признак туроператора.
  - `tour_operator_registry_number` (TEXT) — Номер в реестре туроператоров (для is_tour_operator=true).

- **Verification notes** — `verification_notes` (TEXT). Внутренние комментарии модератора по итогам верификации. Видны только админам, не гиду и не путешественнику.

- **Specializations** — `specializations` (TEXT[]). Массив специализаций. UI label — «Специализации». Чтение через ключ `specializations` (множественное), не `specialization` (баг — см. cleanup-эпик #C4 / form-эпик #13).

Намеренно **out of scope** (`MVP.md` §15): авиабилеты и отели, CRM для
операторов, движок динамического ценообразования, не-русские языки,
нативные мобильные приложения, крупная программа лояльности,
страховки/визы.

### Основной поток (`mission-vision.md` §How Provodnik works; `MVP.md` §8.2–8.3)

1. Путешественник публикует запрос — направление, даты, размер группы,
   интересы, бюджет.
2. Подходящие гиды получают его и шлют структурированные предложения
   (цена, что включено, тайминг, вместимость, срок действия).
3. Путешественник сравнивает предложения, задаёт вопросы в чате,
   принимает одно.
4. Создаётся объект брони; бронь подтверждается с явными
   (внеплатформенными) платёжными инструкциями; открываются контакт гида
   + точка встречи.
5. Параллельно другие путешественники присоединяются к открытому запросу
   → сборная группа → цена на человека падает.
6. Тур завершается; обе стороны оставляют отзывы.

Статусы брони (`MVP.md` §10.1): `pending`, `awaiting guide confirmation`,
`confirmed`, `cancelled`, `completed`, `disputed`.

### Владелец продукта

Alex — нетехнический продакт-овнер, рабочий язык русский. Решает ЧТО
строить, для КОГО и какой результат верен — не КАК. Вопросы уровня
реализации (код, БД, конфигурация) Alex НЕ задавать — проверить в
репозитории и принести факт.

### Позиционирование: история hero copy

Элиста-специфичный hero («Частный гид по Элисте...») заменён на
универсальный + `NEXT_PUBLIC_PHASE_A_CITY` env-default 2026-05-26
(form-epic #3). Полная история и обоснование: `docs/product/positioning-history.md`.

---

## Project rules (numbered, edit deliberately)

These predate the 2026-05-12 structural rewrite — preserved verbatim
from the original Кодекс distillation.

### Rule 1 — Терминология: товарный реестр

Использовать ТОЛЬКО зафиксированные термины. При вводе нового —
писать «новое:» и ждать подтверждения.

| Правильно | Запрещено |
|-----------|-----------|
| готовые экскурсии | ~~Готовые туры~~ |
| путешественник | ~~клиент~~, ~~турист~~ |
| гид | ~~поставщик~~, ~~исполнитель~~ |
| сборная группа | ~~открытая группа~~ |
| запросы | ~~Биржа~~, ~~marketplace~~, ~~exchange~~ |

**Источник:** Alex напрямую. "Туры — это совсем другое" (2026-04-27).
**Обновлено 2026-05-17:** «Биржа» удалена из словаря полностью (навигация,
страницы, тексты, код, обсуждения) — заменять на «запросы». Модель
персональная, не биржевая. См. captured rule 2026-05-17 [scope].

### Rule 2 — Статистика: только из кода

Никогда не придумывать проценты, доли, «большинство пользователей».
Если данных нет — писать «по умолчанию», «логически», «скорее всего».
Выдуманные цифры разрушают доверие.

### Rule 3 — Описание UI: визуальные ориентиры

Никогда не писать: «шапка», «сайдбар», «хедер», «футер». Писать:
«полоска сверху с логотипом», «левая колонка», «панель снизу на
телефоне», «правый блок с кнопками». При сомнении — просить
скриншот.

### Rule 4 — Один вход в одну функцию

Перед добавлением любой новой ссылки / кнопки / навигационного пути —
проверить, не создаёт ли это дублирование. Alex's #1 боль: один и
тот же раздел доступен тремя путями под тремя названиями.

### Rule 5 — Навигация в незалогиненом виде: никогда не пустая

Центр полоски навигации для незалогиненного пользователя должен
показывать контентные ссылки. Пустой центр неприемлем.
Текущие ссылки: **Экскурсии | Гиды | Как это работает**

### Rule 6 — Публичный контент = открытый доступ

Фотографии портфолио гида, аватары, обложки экскурсий — публичный
контент. Использовать открытую политику хранилища, НЕ подписанные
URL. Подписанные URL — только для приватного контента (верификационные
документы, паспортные данные).

### Rule 7 — Auth в серверных страницах: только через readAuthContextFromServer

`createSupabaseServerClient() + auth.getUser()` вне try/catch — краш
страницы. Всегда использовать `readAuthContextFromServer()` в server
components. Внутри try{} блоков данных — Supabase client допустим.

### Rule 8 — Развёрнутость ответов

- Простые подтверждения → 1-2 предложения
- Архитектурные решения, дизайн-вопросы → развёрнуто, с вариантами
  и trade-off
- Никогда не вытягивать информацию у Alex по одной фразе — если
  вопрос заслуживает 10 предложений, писать 10 предложений

### Rule 9 — Иерархия пунктов

Нумерация должна быть чёткой: 1, 1a, 1б, 2, 2a — если у Алекса
несколько под-вопросов в одном пункте. Он отвечает по пунктам и
должен чётко понимать, на что отвечает.

### Rule 10 — Commitments из прошлых планов

Перед объявлением плана «закрытым» — проверить незакрытые
обязательства из предыдущих планов. Алекс помнит то, о чём
договорились, но не отправили.

### Rule 11 — Когда укорачиваешь список

Если обрезаешь перечень существующих вещей в описании — всегда
заканчивать «и так далее». Никогда не обрезать молча.

---

## Captured rules (append-only)

<!--
  New entries land here via `/kodex <rule>` or the `+kodex` suffix.
  Format (Sonnet enforces):
    - YYYY-MM-DD [tag] — rule body (≤40 words, imperative).
  Tags from the fixed 8-tag taxonomy:
    tone | communication | process | decomposition | reporting |
    verification | safety | scope
  + [other] escape hatch for anything that doesn't fit.

  Manual edits acceptable — preserve the format. If you break the
  "## Captured rules" heading, the orchestrator's append-handler
  falls back to EOF append; better to keep the heading intact.

  Compaction policy:
  - Dedup on capture: a new rule whose body is a near-duplicate of an
    existing captured rule is rejected at capture time. To refine a
    rule, edit the existing entry manually rather than re-capturing.
  - This section is a STAGING AREA, not an archive. When a captured
    rule has proven stable, or a theme accretes ~3+ related entries,
    consolidate them into the numbered "Project rules" section above
    and delete the captured entries.
  - Soft cap ~40 entries; exceeding it is the signal to compact.
-->

- 2026-04-29 [tone] — Никогда не додумывать команды Alex. Если не сказал прямо «делай X» — предлагать варианты a/b/в с трейдоффами, спрашивать выбор. Догадки за продакт-овнера приводят к лишней работе или ложному согласию.
- 2026-04-29 [tone] — Запрет на «хороший вопрос» / «отличная идея» / любые ласкающие слова перед сверкой кода. Сначала молча проверь, потом отчитайся по фактам.
- 2026-04-29 [communication] — Запрет на жаргон и небрежные формулировки в Telegram. Серьёзный проект, инженерная точность каждого слова. Сарказм допустим в смысле, не в стиле речи.
- 2026-04-29 [process] — Сообщения в Telegram — максимум 1-2 вопроса/решения за раз. Километровые простыни тяжело читать.
- 2026-05-01 [reporting] — Документирование ≠ фикс. Если претензия повторяется — значит записал в память вместо создания задачи. Перед закрытием жалобы: задача или заметка?
- 2026-05-02 [verification] — Перед написанием плана по нетривиальной задаче — одно подтверждающее переформулирование: «Понял так: X. Если иначе — поправь.» Один раз, в начале.
- 2026-05-12 [communication] — Capture trigger: `/kodex <rule>` slash или `+kodex` суффикс. Sonnet reformats; write to disk first, reply «Записал в Кодекс.» second.
- 2026-05-11 [reporting] — Always include the commit SHA when reporting DONE; a green typecheck alone is not sufficient confirmation of completion.
- 2026-05-12 [verification] — При закрытии ERR или AP требуется позитивный production reproduce; зелёные юнит-тесты и e2e на пути диспетчера не являются доказательством работоспособности фикса
- 2026-05-13 [reporting] — В конце рабочего дня собирать сводку «Вопросы к Анзору» одним блоком: сквозная нумерация В1, В2, В3; пустая строка между пунктами; контекст 1–2 строки на пункт; закрытые помечать, не дублировать.
- 2026-05-14 [verification] — Before answering, always verify: check the source, read the files, inspect the commits. Never respond without confirming facts first.
- 2026-05-14 [verification] — Перед нетривиальным утверждением о коде, архитектуре, состоянии ветки или поведении функции — сверься с исходником, файлами и историей коммитов; на справочных вопросах ответ по памяти допустим, но с явной пометкой «по памяти, могу ошибаться»
- 2026-05-14 [decomposition] — При декомпозиции задачи с записью в БД перечислять все четыре слоя маршрута данных: форма, серверное действие, схема валидации, миграция БД, чтение. Отсутствующий слой указывать явно с обоснованием.
- 2026-05-14 [communication] — При обсуждении тикетов эпика использовать короткие русские ярлыки («Профиль гида», «Страница "Гиды"»); полное имя из реестра — только при команде системе или прямой ссылке на тикет; локальные номера «Т1–Т7» не использовать после фиксации дерева.
- 2026-05-14 [verification] — При закрытии тикета сверять результат с решением владельца посимвольно. «По смыслу совпадает» не считается. При расхождении — тикет переоткрывается.
- 2026-05-14 [verification] — Перед любым утверждением о состоянии файла, реестра или системы — сначала прочитать источник напрямую; при отсутствии доступа говорить «не знаю, нужна сверка»; формулировки «возможно», «должно быть», «скорее всего» при наличии доступа — запрещены
- 2026-05-16 [process] — При обсуждении эпика финализируй только текущий пункт; полное дерево тикетов собирай только по явной команде «подтверждаю» от продакт-овнера — не повторяй его в каждом ответе.
- 2026-05-16 [verification] — Перед созданием тикета с функциональным требованием убедиться по коду, что платформа технически способна его выполнить; догадки о возможностях — не в тикет.
- 2026-05-16 [communication] — Не задавай продакт-овнеру технических вопросов о коде, БД или конфигурации — проверь проект сам и приходи с фактом. Продакт-овнеру — только продуктовые вопросы: что делаем, для кого, какой результат верен.
- 2026-05-16 [scope] — Не предлагать пользователю присылать скриншот ни в какой формулировке; если данные с внешнего источника недоступны — запросить текстовое описание или работать без референса.
- 2026-05-16 [scope] — Бот не запускает слэш-команды самостоятельно: /epic, /new, /kodex и любые другие инициирует только пользователь; имитировать их выполнение текстом — галлюцинация.
- 2026-05-16 [process] — При техническом уточнении от исполнителя в эпик-топике бот немедленно готовит и публикует ответ; продакт-овнер лишь вставляет его. При продуктовом вопросе бот формулирует выбор и спрашивает продакт-овнера, не решая за него.
- 2026-05-16 [communication] — При публикации текста уточнения для копипасты оборачивать открывающую и закрывающую кавычки в жирный (**"**текст**"**) — визуальный маркер границ блока. Применять ко всем форматам: спецификации, блокеры, технические ответы исполнителю.
- 2026-05-16 [communication] — При обсуждении тикетов в эпик-топике ссылаться на них по имени или порядковому номеру внутри эпика (1–5); сквозную нумерацию системы («тикет 17») использовать только при операциях через систему — бот её не видит.
- 2026-05-16 [process] — В техспецификации тикета явно описывать дефолтное поведение на пустом/нулевом входе отдельным пунктом и перечислять UI-элементы, рендерящиеся всегда независимо от данных. Подразумевание «как сейчас» — лазейка для регрессии.
- 2026-05-17 [scope] — В MVP Проводника (модель 1) точка входа — кастомизированный запрос путешественника на сборную группу; готовые экскурсии — фоновый инвентарь гида, не двигатель воронки.
- 2026-05-17 [scope] — Термин «Биржа» полностью удалён из словаря проекта (навигация, страницы, тексты, код, обсуждения); заменять на «запросы» — модель персональная, не биржевая.
- 2026-05-18 [tone] — Не открывай ответ преамбулой: «Понял», «Принимаю», «Принимаю удар», «честно», «без оправданий», нарратив о своей честности или процессе — запрещены. Первое предложение — сразу суть. Исправление — это исправленный факт, не твои чувства об ошибке.
- 2026-05-19 [scope] — «Классическая экскурсия» — каноническая метка типа `excursion`; нестандартные типы (waterwalk, masterclass и др.) не переименовывать.
[process] Do not fire new work items; only verify completed commits and epic tasks.
[process] After epic review, rebase the epic branch onto main, fast-forward merge it, and delete the branch as standard git hygiene.
[process] The task type is verification, not decomposition; do not run /fire.
[scope] Use «Классическая экскурсия» as the canonical approved term for the excursion type label on tour cards; register it in the product glossary.
[scope] The excursion type term flag is closed and does not block the epic.
[verification] When production data is null for badge and price format, unit-test coverage is sufficient; treat null production data as a data limitation, not a defect.
[process] Sync ticket statuses 1–5 to shipped and close the epic via /epic-done.
[process] A verification report does not require decomposition.
- 2026-05-19 [process] — При вопросе об устройстве системы или интерфейса — сначала открыть и прочитать код, затем отвечать двумя блоками: **«Пользователь видит:»** (поля, кнопки, экраны) и **«В коде:»** (*внутренняя механика*); слои не смешивать, утверждений без чтения файла не делать
- 2026-05-19 [process] — Формулировать уточнение по тикету только после того, как продакт-овнер прислал запрос из тикета; без запроса не писать. Каждое утверждение — только после чтения кода, не по памяти.
- 2026-05-19 [process] — Уточнение по тикету писать только в том же ответе, где прочитан относящийся код; код не прочитан — явно указать «код не читал»; запрос на уточнение должен поступать от продакт-овнера заранее
[scope] The share feature applies only to the excursion page — no other pages.
[scope] The Share button must copy the link via navigator.clipboard and show a 'Ссылка скопирована' toast on click.
[scope] Open Graph meta tags (og:title, og:image, og:description) must be added in the route's metadata — not inline in the component.
[scope] og:title must equal the excursion name, og:image the main photo, og:description the short description.
[decomposition] Decompose into exactly two independent tickets: Ticket 1 — Share button; Ticket 2 — Open Graph meta tags.
[scope] The Share button must be placed in the excursion page header (шапка экскурсии).
[scope] Rename every UI copy of «Оператор» to «Администратор» across badge, account dropdown, breadcrumbs, section heading, and panel title.
[scope] Do not rename technical identifiers (types, internal vars); the Оператор→Администратор rename is UI-copy-only.
[scope] Keep requireAdminSession unchanged; the term desync is resolved by label rename only.
[verification] A user with profile.role=admin clicking «Одобрить» must return 200, set guide status to approved, create an audit record, and notify the guide.
[scope] Add a «Лицензии» block to the admin guide view sourced from guide_licenses; show type, number, issuer, validity, region, and linked tour listings from listing_licenses.
[scope] Do not implement per-license moderation in this iteration.
[verification] Expired licenses (valid_until < now()) must display a red badge in the admin license block.
[verification] Admin guide view must show N license cards for a guide with N licenses.
[verification] Admin guide license block must display an empty state when the guide has no licenses.
[scope] Make base_city editable in the guide's «О себе» profile block; use it for the «Гиды по городу» public filter.
[scope] Keep tour listings unchanged (listings.city remains per-tour); do not restructure city at the listing level.
- 2026-05-25 [communication] — В ответах: сразу суть, без пересказа договорённого, без статус-блока в конце, без «жду Finalize». Варианты раскрывать только если выбор нетривиален — иначе одна рекомендация прозой. Таблицы — для сравнения 3+ опций.
[communication] Replies must be short and direct — no fluff paragraphs; enforce via KODEX command.
[scope] Remove 'Формат поездки' field from the form; set mode=private as the backend default.
[scope] Merge groupSizeCurrent and groupMax into a single input labelled 'Сколько вас'.
[scope] Add travelers-sharing checkbox '−10%'; when checked, mode=assembly in backend and show optional second input 'до скольких готов добрать'.
[scope] Show a blue pill badge under the budget field: '10% наша комиссия · 90% идёт гиду'.
[scope] Collapse 'Контекст/Пожелания' into expandable '+ Добавить детали', collapsed by default.
[scope] Trust-strip text under CTA: '✓ Гиды проверены · ✓ Без предоплаты на этапе MVP · ✓ Отмена за 24ч'.
[scope] Leave all old/unused fields untouched in the form epic; drop them via a separate cleanup ticket after 1 week of prod stability.
[scope] Do not delete group_capacity; the new form writes maxGroupSize into it when the travelers checkbox is enabled.
[scope] Store commission rate as a product-config constant in config/commission.ts — not environment-specific.
[scope] Use env NEXT_PUBLIC_PHASE_A_CITY=Москва for city default; enables Phase A→B city switch without redeploy.
[decomposition] Alex's cleanup items (1, 4, 5, 8) and bug 7 go into a separate cleanup epic, not the form epic.
[scope] CommissionBadge text built from constant: '${100-COMMISSION_PCT}% идёт гиду · ${COMMISSION_PCT}% наша комиссия'.
[scope] When travelers checkbox is unchecked: set group_capacity=null and format_preference=private.
[scope] Read NEXT_PUBLIC_PHASE_A_CITY via a clientside helper; fallback to 'Москва' if the variable is not set.
[process] Ticket #3 has a soft dependency on #1 (imports COMMISSION_PCT); merge #1 first or ship both in the same PR.
[verification] Browser-check for all tickets = existing Playwright plus manual smoke on preview deploy; do not add new test frameworks.
[decomposition] Ticket #5 stays size M and must not be split — merge, toggle, and conditional input are one conceptual feature.
[decomposition] Critical path: #1 → #3 → #4 → #5; #7 runs in parallel; #2, #6, #8, #9 may lag one week without blocking July launch.
[scope] In the cleanup epic, rename UI label 'лицензия' to 'аттестат'.
[scope] In the cleanup epic, remove the word 'поездка' from the UI.
[scope] In the cleanup epic, replace the label 'соответствует темам' with 'темы'.
[scope] Drop unused columns (allow_guide_suggestions, date_flexibility, *_locked, date_window) in a separate ticket, scheduled +7 days after form-epic prod-ship.
[scope] Rename sort option 'По дате поездки' to 'По дате запроса'; add as a trivial addition to ticket C2.
[scope] Guide cards with no themes must show empty — no badge at all; do not display 'Без темы'.
[scope] Admin audit C4: add missing fields to existing card structure only; card restructuring is out of scope for this cleanup.
[scope] Bug C5 (allow_guide_suggestions) waits for form-epic #4 to auto-close it; if form-epic slides >2 weeks, apply a 1-line hotfix.
- 2026-05-27 [scope] — Комиссия: 15% для запросов (модели 1–2), 25% для готовых экскурсий (модель 3); фазового дисконта нет; ставка 10% удалена из UI, конфига и канона; в публичный UI ставка не выводится — внутренняя информация.
[scope] Append exactly one dated line to README.md containing today's date and the words 'handoff test'.
[verification] The build must stay green: typecheck, lint, test, and build must all pass after the README change.
[scope] Do not change src, routes, tests, deps, or any application behaviour.
[scope] This task is a pipeline proof-of-concept, not a feature delivery.
[scope] Pipeline smoke only — do NOT touch the product; add exactly one comment line <!-- handoff-smoke 2026-05-30 --> as the first line of README.md and nothing else.
[verification] The acceptance bar is: the comment must be line 1 of README.md; the rest of the file must be unchanged.
- 2026-06-03 [verification] — Любое утверждение о том, как продукт работает для пользователя, — только после чтения кода. «По смыслу», «наверное», «должно» о поведении сайта запрещены: это догадка, выданная за факт, = враньё на ровном месте.
- 2026-06-03 [verification] — Не проверил — пиши прямым текстом «не проверял», вместо правдоподобной выдумки. Признанное незнание лучше уверенной ошибки.
- 2026-06-03 [communication] — Одно предложение = один проверенный факт. Если фразу нельзя подтвердить — она не идёт в сообщение. Предложения-наполнители, звучащие как объяснение, — это спекуляция, выбрасывать.
- 2026-06-03 [reporting] — Сначала проверенный факт, потом вывод — не наоборот. Не выдавать вывод, лепя проверку задним числом. Сигнал «?» от Alex = нарушено одно из правил выше: переписать просто и сверить код, не оправдываться.
- 2026-06-05 [process] — Всегда ждать явную команду «Go» от Alex перед любым исполнением: кодом, диспетчеризацией, пушем. Анализ и предложения — без ограничений; действие — только после «Go».
