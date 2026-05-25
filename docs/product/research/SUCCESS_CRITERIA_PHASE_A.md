# Success criteria — Provodnik Phase A (Элиста)

> **Дата**: 2026-05-26
> **Окно измерения**: 3 месяца после launch (целевой launch — лотосовый фестиваль июль-август 2026 → measurement window до конца октября 2026).
> **Метод**: количественные таргеты + качественные сигналы; цифры — defensive estimates, не promises.

---

## Что значит «Phase A succeeds»

Phase A считается **успешной**, если выполнено всё из 4 секций ниже. Если выполнено 3 из 4 — нужен post-mortem перед Phase B. Если 2 из 4 или меньше — kill criterion срабатывает, см. §5.

---

## 1. Supply (предложение) — целевые показатели

| Метрика | Цель к концу 3 месяца | Минимум для «succeeds» | Обоснование |
|---------|------------------------|------------------------|-------------|
| **Активные onboarded гиды** | 15-20 | ≥10 | Из ~20 supply candidates (см. SUPPLY_ONBOARDING_ELISTA.md), реалистично онбоардить 50-70% за 3 мес |
| **Доля гидов, разместивших ≥1 листинг** | ≥80% активных | ≥60% | Гид считается «активным», если есть хотя бы один публичный листинг или ответ на запрос |
| **Доля гидов, ответивших на ≥1 запрос** | ≥70% | ≥50% | Listing без response = dead supply |
| **Среднее число тематик на гида** | ≥2 | ≥1.5 | Указывает на серьёзность работы с платформой |

## 2. Demand (спрос) — целевые показатели

| Метрика | Цель к концу 3 месяца | Минимум для «succeeds» | Обоснование |
|---------|------------------------|------------------------|-------------|
| **Total requests submitted** | 80-150 | ≥50 | Лотосовый фестиваль = 2 месяца концентрированного спроса + 1 месяц осеннего хвоста |
| **Unique travellers** | 60-100 | ≥40 | Repeat rate в первые 3 мес = низкий, считаем ~70-80% unique |
| **Confirmed bookings** | 30-60 | ≥20 | Целевой conversion request→booking = 35-40% |
| **Доля семей/компаний 3+** в общих запросах | ≥50% | ≥35% | Подтверждение, что primary segments соответствуют гипотезе |

## 3. Liquidity + quality (ликвидность и качество)

| Метрика | Цель к концу 3 месяца | Минимум для «succeeds» | Обоснование |
|---------|------------------------|------------------------|-------------|
| **Median guide response time** | ≤4 часа | ≤8 часов | В рабочие часы; 19% same-day bookings (Яндекс) требуют быстроту |
| **Доля запросов с ≥1 offer в первые 24ч** | ≥80% | ≥60% | Если меньше — supply density недостаточна |
| **Средний рейтинг по completed bookings** | ≥4.5 / 5 | ≥4.2 / 5 | Ниже = trust ломается в Phase B |
| **Review submission rate** (после booking) | ≥50% | ≥35% | RU-стандарт; ниже = либо trust ломается, либо UX review-flow слабая |
| **Dispute rate** | ≤5% bookings | ≤10% | Выше = серьёзные supply/UX проблемы |
| **Cancellation rate (платформа+гид)** | ≤15% | ≤25% | Включая «не нашли подходящего гида» |

## 4. Economics — целевые показатели

| Метрика | Цель к концу 3 месяца | Минимум для «succeeds» | Обоснование |
|---------|------------------------|------------------------|-------------|
| **GMV (общая стоимость confirmed bookings)** | 250-500 тыс ₽ | ≥150 тыс ₽ | 30 bookings × 5-8 тыс ₽ ср. чек (Tripster Elista диапазон 1350-59000 ₽) |
| **Комиссия собрана** | 25-50 тыс ₽ | ≥15 тыс ₽ | 10% от GMV |
| **CAC (customer acquisition cost)** на traveller | ≤500 ₽ | ≤1000 ₽ | Phase A — органик + word-of-mouth + festival traffic |
| **Cost of supply onboarding** | ≤30 тыс ₽ total | ≤50 тыс ₽ | Локальные встречи, кафе, минимум маркетинга |

---

## 5. Качественные сигналы (binary — есть или нет)

Эти сигналы важнее голых цифр. Цифры могут промахнуться по причинам, не связанным с продуктом (погода, кризис). Качество — нет.

| Сигнал | Да/Нет | Объяснение |
|--------|--------|------------|
| **Хотя бы 3 гида с repeat bookings** через платформу | Да = есть | Доказывает, что platform value real |
| **Хотя бы 2 traveller'а с repeat use** через 30+ дней | Да = есть | Доказывает retention |
| **Хотя бы один organic referral** (traveller привёл traveller'а) | Да = есть | Word-of-mouth flywheel works |
| **Хотя бы один guide referral** (гид привёл гида) | Да = есть | Supply flywheel works |
| **Нет catastrophic dispute** (мошенничество, безопасность, claim >50 тыс ₽) | Да = безопасно | Любой такой случай требует немедленного pause + post-mortem |

---

## 6. Kill criteria — когда Phase A провалена

Phase A считается **провалом** (требует stop + переоценку всего подхода) при любом из условий:

1. **Меньше 5 активных гидов** к концу 3 месяца (supply totally failed)
2. **Меньше 10 confirmed bookings** к концу 3 месяца (demand totally failed)
3. **Catastrophic dispute** с financial или reputation урон >50 тыс ₽
4. **Средний рейтинг <4.0** (trust quality невосстановим без переделки)
5. **Dispute rate >15%** (систематическая проблема с supply/process)

Если kill criterion срабатывает — **не идём в Phase B**. Делаем post-mortem (1 неделя), решаем: pivot, переждать, или закрыть.

---

## 7. Что НЕ метрика Phase A

Эти вещи **не считаются** в Phase A — они для Phase B или позже:

- ❌ **GMV growth rate** (3 месяца слишком мало для тренда)
- ❌ **Profit margin** (CAC и operations в Phase A намеренно subsidized)
- ❌ **Network effects** (требуют scale; в Phase A нет)
- ❌ **Brand awareness** (Phase A — sub-radar тест)
- ❌ **Доля рынка vs Tripster** (несравнимы по scale)

---

## 8. Что отчётность измеряет — конкретно

Раз в неделю (понедельник), сводный dashboard:

| Раздел | Метрики |
|--------|---------|
| Supply | Active guides count, listings count, response time median, % responding |
| Demand | Requests this week, requests total, unique travellers, segment breakdown (пара/семья/компания) |
| Liquidity | Conversion request→booking, % with offer in 24h, time-to-first-offer median |
| Quality | New reviews, average rating last 30 days, disputes opened/closed |
| Economics | Bookings count, GMV, commission, refunds |

Ежемесячный синтез (последний рабочий день месяца): comparison vs targets + qualitative signals + decisions for next month.

---

## 9. Связанные документы

- `MARKET_RESEARCH.md` — стратегический wedge
- `TARGET_AUDIENCE.md` §11 — Phase A overrides для сегментов
- `STRATEGY_DECISIONS_2026-05-26.md` — утверждённые решения
- `SUPPLY_ONBOARDING_ELISTA.md` — supply pipeline
- `MVP.md` / `PRD.md` — продуктовая основа

---

## Status

- **Версия**: v1 (2026-05-26)
- **Утверждение**: ожидает Алекса (целево 2026-05-30)
- **Срок действия**: до конца октября 2026 (3 месяца после лотосового launch)
- **Ревизия**: каждый месяц в синтезе; полная переоценка после Phase A close
