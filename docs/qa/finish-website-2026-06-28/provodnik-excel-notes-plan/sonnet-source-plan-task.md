# Sonnet Planning Task — Provodnik Excel Notes → Source-Aware Fix Plan

## Role
You are Claude Code Sonnet in `/Users/idev/provodnik`. This is a READ-ONLY planning task. Do not edit code, do not commit, do not push.

## Required inputs
Read the Excel notes extracted by Hermes:
- `/Users/idev/provodnik/docs/qa/finish-website-2026-06-28/provodnik-excel-notes-plan/extracted-notes.md`
- original Excel if needed: `/Users/idev/.hermes/cache/documents/doc_f97d06b66f6d_Provodnik.xlsx`

Also inspect relevant source, route files, components, data/actions, tests, and project rules:
- `AGENTS.md`
- `CLAUDE.md`
- `.claude/CLAUDE.md`
- relevant source under `src/app`, `src/features`, `src/components`, `src/data`, `src/lib`

## User request
The user wants a full detailed plan only: what we should fix/change and how. No implementation yet.

## Excel notes to interpret
The extracted notes mention:

1. Avatar menu:
   - `Мои поездки` → `https://provodnik.app/bookings` — “Зачем эта страница?”
   - `Приглашения` → `/referrals` — “Зачем эта страница?”
   - `Избранное` → `/favorites` — “Зачем эта страница?”
   - `Уведомления` → `/notifications` — duplicates bell icon near avatar.

2. Login/auth page `/auth`:
   - “Бесплатно для путешественников” is confusing.
   - “Честную цену?” confusing: compared with what price?
   - “Какого рода поддержка?” unclear.
   - “криво” (visually crooked/broken).
   - Same phone already registered to one account can be used when registering another account.

3. Account page `/account`:
   - When filling profile name, a second text cursor blinks outside the input.
   - Tautology in headings/text:
     - `Кабинет путешественника`
     - `Профиль`
     - `Профиль путешественника`

4. Become a guide `/become-a-guide`:
   - Remove “Зарабатывайте на авторских экскурсиях” — all excursions are authorial, does not make sense.
   - Remove whole block that does not match reality (need identify the block in source/page).
   - Add: “Проводник работает только с аккредитированными гидами”.

5. Guide profile `/guide/profile`:
   - `Сохранить` button overlaps text.
   - `О себе` block saving throws error:
     - `new row for relation "guide_profiles" violates check constraint "guide_specializations_valid"`

6. Request detail page:
   - URL example `/requests/0c50e2ee-caba-4f68-b715-b7c326640a6f?created=1&mode=assembly`
   - Breadcrumb above city: `Поездки > Россия > Москва`
   - It is not clickable, and conceptually wrong: “WHAT TRIPS? WHERE DID THEY COME FROM?”

7. Admin guides `/admin/guides`:
   - User was logged into admin account `admin@provodnik.app` and tried checking whether guide verification request arrived, but guides section shows something wrong.
   - Notes include unrelated-looking banking strings/numbers in cells M/N; treat as likely screenshot/text leak or wrong pasted content, do not expose as product copy.
   - Need inspect admin guides route/source and likely failure mode.

8. Sheet6 only says Russian/English headings — inspect if any language/i18n issue is implied, but do not over-invent.

## What to produce
Write the final plan to:
`docs/qa/finish-website-2026-06-28/provodnik-excel-notes-plan/sonnet-source-plan.md`

The plan must be source-aware and detailed. Include:

# Provodnik Excel Notes — Source-Aware Fix Plan

## Executive summary
- What the notes are really pointing to: UX/navigation cleanup, copy cleanup, profile form bug, guide onboarding/admin verification, request detail terminology.

## Findings by area
For each area:
- User note / symptom
- Current source files/components/routes involved
- Root-cause hypothesis from source inspection
- Recommended change
- Exact implementation steps
- Tests to add/update
- Verification steps (manual/browser and automated)
- Risk / dependencies / questions

## Prioritized implementation order
Break into phases:
1. Safe copy/navigation cleanup
2. Auth/account UX fixes
3. Guide profile form/save bug
4. Admin guides verification visibility
5. Request detail breadcrumb/domain language
6. Regression verification pass

## Concrete file map
List expected files likely to change per phase.

## Acceptance criteria
Specific visible outcomes.

## Open questions
Only true blockers or product decisions. Do not ask questions that can be answered from source.

## Important constraints
- No code edits in this planning run.
- Do not include secrets or raw sensitive-looking notes from Excel except summarized safely.
- Respect project stack: Next.js 16, React 19, Tailwind v4, shadcn/ui, Supabase/RLS, bun.
- Do not recommend pushing; implementation later will commit only.

Use sequential thinking if available. Use Playwright/screenshots if useful, but keep this read-only.

/goal Do not stop until the plan file is written with a detailed, source-backed implementation plan and clear acceptance criteria.
