# Provodnik open issues 33/35/41–47 — planning goal

Date: 2026-07-08
Base: current `origin/main` / VPS after visual self-heal deploy (`2fbeae2c`).
Mode: read-only analysis and planning. Do not edit product code, do not push, do not deploy, do not mutate DB.

## Operator request

Analyze the issues below, dispatch Opus to plan, brainstorm, check code, check live site, and make sure the plan is well-structured before implementation.

## Issues

### 05.07.26

**33. Public guide profile centering**
Text description became normal, but the guide avatar, verified status, and region/city shifted left; they should be centered.

URL:
https://vps.provodnik.app/guides/%D0%B6%D1%8E%D0%BB%D1%8C-%D0%B2%D0%B5%D1%80%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2-69f18040

**35. Suspended user restrictions incomplete**
A blocked/suspended user is restricted only on "Мой профиль" and "Мои поездки". Elsewhere the user remains active and can create/send excursion requests. This must not be allowed.

Example URL:
https://vps.provodnik.app/requests/fd29dc81-b39f-49fe-a62f-94414839c3b3?created=1&mode=private

### 07.07.26

**41. Joined open group request detail lacks excursion details**
A traveler joined another traveler's open group request and sees a page missing the request's described excursion details.

URL:
https://vps.provodnik.app/requests/e008d8b7-ab51-4c6f-ab8f-0f0adf226768

**42. Joined open group request needs forum-style shared discussion**
A traveler who joined an open group with flexible date should see the request author's correspondence with guides about additional terms/coordination, and should be able to send a message visible to all group participants. Treat this as one forum-like thread under the open group request.

URL:
https://vps.provodnik.app/requests/e008d8b7-ab51-4c6f-ab8f-0f0adf226768

**43. Admin Listings purpose unclear**
In admin, what should the "Листинги" section contain / what is it for?

Operator pasted URL:
https://vps.provodnik.app/admin/bookings

**44. Admin Bookings incomplete status coverage**
Admin "Бронирования" currently shows only excursions confirmed by both sides. Other statuses like waiting/pending/cancelled etc. are not shown.

URL:
https://vps.provodnik.app/admin/bookings

### 08.07.26

**45. Duplicate guide listing buttons**
In guide account → my excursions, "Добавить экскурсию" and "Создать экскурсию" perform the same function. Remove "Создать экскурсию" and make "Добавить экскурсию" blue.

URL:
https://vps.provodnik.app/guide/listings

**46. Guide listing save button hidden below viewport**
Guide cannot save a ready excursion because the save button is below the screen/outside viewport. Old issue, expected fixed already.

URL:
https://vps.provodnik.app/guide/listings

**47. Admin Moderation purpose unclear**
In admin, what should the "Модерация" section contain / what is it for?

Operator pasted URL:
https://vps.provodnik.app/admin/bookings

## Required plan output

Create `docs/qa/open-issues-20260708/OPUS_PLAN.md` with:
- Executive verdict and priority order.
- Brainstorming: at least 2 approaches for issue groups, with recommendation.
- Live-site observations where accessible without secrets; note auth-gated blockers clearly.
- Codebase findings: files inspected, root-cause hypothesis, risks.
- Per-issue plan: exact files likely to change, tests to add/update, browser/live verification needed, owner decisions.
- Data/RLS/security notes, especially for suspended users and group messaging visibility.
- Implementation phases with safe commit boundaries.
- A ready executor handoff prompt marked DO NOT RUN until owner approval.

Do not implement code in this planning run.
