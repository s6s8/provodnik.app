# Первичные находки перед Opus-планированием

## Live evidence
- `docs/qa/open-issues-20260708/live/results.json` — Playwright JSON по VPS.
- Скриншоты: `docs/qa/open-issues-20260708/live/*.png`.
- Публичные страницы без логина проверены напрямую; admin/guide routes редиректят на `/auth?next=...`, поэтому для них нужен кодовый аудит и/или авторизованный QA.

## 33 — guide profile centering
Live screenshot: `live/guide-33-mobile.png`.
- Подтверждено: блок с аватаром + `Проверен` сейчас визуально выровнен влево.
- Кодовая точка: `src/features/guide/components/public/guide-profile-screen.tsx` lines ~104–125:
  - wrapper: `items-start text-left`
  - image/status/stats/tags/buttons use left-aligned classes.
- Вероятный фикс: центрировать только profile identity block (avatar, verified, stats, maybe city/region if moved into this block), не ломая читаемость bio/buttons.

## 35 — blocked user still active
- Middleware `src/proxy.ts` checks `profiles.account_status` only when route has `requiredRole`.
- User says blocked user is restricted only on `/profile` and `/trips`, but can create/send excursion requests.
- Need identify all creation/join/offer actions and route guards, likely server actions lack central `requireActiveAccount` gate.
- Must plan broad enforcement: request create, join group, send offer/bid, send QA/messages, booking/acceptance, guide listing create/edit if relevant.

## 41 — joined traveler request detail missing request description/details
Live screenshot: `live/request-41-42-mobile.png`.
- Shows date/time/price/group count and hero text `Илендиль!`.
- It does not show richer structured request details beyond compact facts.
- Code: `src/app/(site)/requests/[requestId]/page.tsx` public branch builds `viewModel` and `RequestDetailScreen` public branch likely renders compact public assembly view.
- Need separate member view or public/member enrichment with request facts/notes/interests/constraints.

## 42 — joined traveler should see and write group conversation
- Current owner branch has per-offer QA threads (`conversation_threads` subject_type `offer`) and `OfferCard` embedded QA.
- Public/member branch has no group forum/chat UI visible in screenshot.
- Need design data model: request-level group thread (`subject_type='request'` or equivalent), messages visible to owner + joined members + guides? User asks all group participants see message; also joined PU should see owner-guide discussions about conditions. Need policy decision and migration/RLS plan.

## 43 — admin listings purpose unclear
- Route exists: `src/app/(protected)/admin/listings/page.tsx`.
- It is actually listing moderation queue for ready excursions (`Готовые экскурсии со статусом «На проверке»`).
- Need UX copy/nav rename decision: maybe label as `Экскурсии на проверке`, not generic `Листинги`.

## 44 — admin bookings only confirmed shown
- Code `src/app/(protected)/admin/bookings/page.tsx` queries `bookings` only. It supports status filter for booking statuses, but pending pre-booking flows probably live in `guide_offers`/`traveler_requests`, not `bookings`.
- Need decide whether admin Bookings should include pipeline: requests/offers awaiting confirmations/canceled, or add separate tabs.

## 45 — duplicate create/add excursion buttons
- Code: `guide-excursions-screen.tsx` has header button `Создать экскурсию` and empty state button `Добавить экскурсию`.
- User wants remove `Создать экскурсию`; make `Добавить экскурсию` blue.
- Need ensure non-empty state still has clear add button somewhere; if header button removed, possibly add a blue `Добавить экскурсию` near list only when templates exist.

## 46 — save button hidden in guide listing sheet
- Code: `SheetContent` contains long form and footer at bottom of content; no guaranteed sticky footer / scrollable body split.
- Need fix with `SheetContent` flex column, scrollable form body, sticky bottom action bar always visible on mobile/desktop.

## 47 — admin moderation purpose unclear
- Route exists: `src/app/(protected)/admin/moderation/page.tsx`.
- It contains queue tabs: pending listings and review replies.
- Overlaps admin/listings. Need dedupe/rename plan: one moderation center or admin listings queue only.

## Planning constraints
- Do not code yet in this planning run.
- Produce exact plan with files, migrations/RLS, tests, visual QA, rollout order.
- Flag where product decision is needed vs straightforward bug.
