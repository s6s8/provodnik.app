# Task: rewrite `/become-a-guide` copy

## User ask

Optimize the text on `https://vps.provodnik.app/become-a-guide`: information duplicates itself. Make top-notch copy, creative like Steve Jobs, but credible for Provodnik.

## Current critique

The current page repeats the same idea in three places:

- hero says only accredited guides, after verification can answer requests;
- steps repeat documents/manual review/requests;
- benefit cards and final trust block repeat verification, documents, written conditions.

It reads like a compliance checklist, not an invitation. It tells the guide what bureaucracy awaits, but not why a strong guide should want to join.

## Copy strategy

One clear message per block:

1. **Hero:** prestigious invitation — not “register”, but “join as a trusted local expert”.
2. **Promise:** fewer random chats, more clear traveller requests with dates, budget and expectations.
3. **Process:** 3 concise steps only: apply → pass review → receive requests.
4. **Standards:** strict selection protects guides and travellers; documents mentioned once.
5. **Final CTA:** confident close, no duplicate checklist.

Tone: clean, premium, human, concise Russian. Jobs-like = simple, sharp, memorable; not hype, not corporate fluff.

## Required implementation

Edit only this page unless a tiny shared component adjustment is truly necessary:

- `src/app/(site)/become-a-guide/page.tsx`

Use existing components/tokens; no custom CSS, no inline style.

Recommended copy direction:

- Hero eyebrow: `Для профессиональных гидов`
- Hero title: `Показывайте город тем, кто уже ищет проводника`
- Hero subtitle: `Проводник соединяет путешественников с проверенными гидами. Вы получаете не холодные заявки, а понятный запрос: город, дата, группа, интересы и бюджет.`
- Primary CTA: `Подать заявку`
- Optional secondary microcopy under CTA: `Рассмотрим анкету вручную и ответим в течение 1–2 рабочих дней.`

Section ideas:

### `Что меняется для гида`

Three cards, no repeated verification wording:

- `Запрос с контекстом` — travellers describe dates, group, interests, budget before you reply.
- `Условия на берегу` — route, format, price and date are fixed in chat before the trip.
- `Репутация без шума` — selection keeps the marketplace clean: travellers see that guides are checked.

### `Как попасть в Проводник`

Three steps:

1. `Расскажите о себе` — experience, languages, cities/routes, links/documents.
2. `Пройдите ручную проверку` — we check profile and qualifications before opening access.
3. `Отвечайте на подходящие запросы` — choose where you can be genuinely useful.

### Final close

Heading: `Мы строим сервис для гидов, которые работают всерьёз.`
Text: `Если вы цените точные договорённости, уважаете время путешественника и умеете делать город живым — нам по пути.`
CTA: `Подать заявку`

## Acceptance criteria

- Page no longer repeats “documents/check/manual verification/access to requests” in multiple blocks.
- Copy is shorter, more aspirational, still legally careful.
- No new pages/routes.
- Preserve `/auth?role=guide` CTA.
- Run `bun run typecheck`, `bun run lint`, relevant test/build if needed.
- Return changed files and verification results.
