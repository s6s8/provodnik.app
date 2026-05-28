---
title: Структура кабинета путешественника
status: canon
approved-by: <product owner>
date: 2026-05-28
referenced-by: Epic 2 tickets T2.2, T2.3, T2.4, T2.6
---

## Заголовок страницы

Кабинет путешественника называется «Структура кабинета путешественника» в продуктовой документации и описывает один вертикальный lifecycle-feed вместо разделения по типам записей.

Главный экран кабинета живёт на `/traveler`: этот путь ведёт к `/traveler/requests`, где отображаются поездки и запросы путешественника.

## Пять фаз ленты

Ось ленты — жизненный цикл поездки, не тип записи. Фазы идут сверху вниз в таком порядке:

1. **Сегодня** — trips happening today; meeting point always at top of card.
2. **Скоро** — upcoming confirmed trips.
3. **Ждут вашего решения** — own requests that have offers awaiting a pick.
4. **В ожидании откликов** — own requests with no offers yet.
5. **Завершённые** — completed trips.

## Правила показа и сокращения

- **Сегодня** → 1–2 cards.
- **Скоро** → 5 cards + `«Показать все N»`; link expands the rest inline, no page navigation.
- **Ждут вашего решения** → all cards, no cap.
- **В ожидании откликов** → 3 cards + `«Показать все N»`; link expands the rest inline, no page navigation.
- **Завершённые** → collapsed by default; click header expands.

## Сортировки

Within each phase, cards are sorted chronologically.

- **Сегодня** → chronological within today.
- **Скоро** → soonest first.
- **Ждут вашего решения** → soonest first by requested trip date or nearest actionable date.
- **В ожидании откликов** → soonest first by requested trip date or nearest actionable date.
- **Завершённые** → most-recent first.

## Источники фото по фазам

- **Сегодня**, **Скоро**, **Завершённые** → first photo from accepted offer's route: `guide_offers.route_stops`, JSON, first item.
- **Ждут вашего решения** → mosaic of three thumbs from first three offers; fewer offers fill the remaining slots with greyed placeholders.
- **В ожидании откликов** → city photo from the destinations catalog.

Own request cards in **Ждут вашего решения** and **В ожидании откликов** use the same card structure as joined-assembly cards. Joined-assembly cards in any phase where `mode === 'assembly'` use the same structure too, with only one extra top line: `«Сборная группа · организатор: <Имя>»`.

## Правило точки встречи 48 часов

Meeting point appears on the card 48 hours before the trip.

On `«Сегодня»`, the meeting point is always shown at the top of the card.

## Состав карточки подтверждённой брони

Booking cards in **Сегодня**, **Скоро**, and **Завершённые** show six elements:

1. Three route thumbs.
2. `«Что входит»` line from `guide_offers.inclusions`, `string[]`.
3. Guide avatar + name.
4. `«Написать гиду»` button.
5. Date.
6. Price.

The photo source for these cards is the first photo from the accepted offer's route: `guide_offers.route_stops`, JSON, first item.

## Чужая сборная группа

Own request cards and joined-assembly cards are the same card. The only differentiator for joined-assembly cards is the canonical top line:

`«Сборная группа · организатор: <Имя>»`

Forbidden phrases must never appear in the cabinet UI:

- `«Вы в группе»`
- `«Присоединились к группе»`
- `«присоединённая»`
- `«подсев»`
- `«оценка гида»`

The guide's rating of the traveler is hidden in the cabinet.

## Завершённая поездка

Completed cards show the traveler's own action:

- If no review left: `«Оставить отзыв»`.
- If review left: `«Ваш отзыв · ★ N»`.

Guide's rating of the traveler is not surfaced here.

Completed trips belong to **Завершённые**, are collapsed by default at the section level, and are sorted most-recent first.

## Пустое состояние главного экрана

The empty cabinet is the main screen, not an apology. It sells the next action.

- H1: `«Куда поедем?»`
- Subtitle: `«Опишите поездку — местные гиды пришлют предложения»`
- CTA button, not a link: `«Создать запрос»`
- Three inspiration cards below the CTA; minimum one is `«Элиста»`.
- Each inspiration card is clickable and opens the destination page.

The following legacy phrases must be removed from the cabinet UI entirely:

- `«У вас ещё нет запросов»`
- `«Подтверждённых поездок пока нет»`
- `«Вы пока не присоединились ни к одной группе»`

## Удаление дубля страницы броней

The old listing URL `/traveler/bookings` is removed as a duplicate listing page.

Required behavior:

- `/traveler/bookings` returns a server-side permanent redirect, 301 or 308, to cabinet home `/traveler`, which redirects to `/traveler/requests`.
- Specific-booking pages under `/traveler/bookings/[bookingId]` stay valid deep-links.
- The back-link on a specific booking is renamed:
  - Was: `«← Мои бронирования»`.
  - Now: `«← К моим поездкам»`, pointing at cabinet home.
