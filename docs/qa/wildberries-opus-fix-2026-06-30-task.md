# Wildberries/Provodnik Opus Fix Task — 2026-06-30

## User directive

Dispatch all tasks through the Opus workflow. Analyze, research, critique, refactor, improve. Fix all confirmed issues. Use DB access where needed, fix bad QA/users if user state is the cause, then Hermes will manually verify with computer use/Playwright logins, screenshot proofs, deploy, and report.

## Source of truth

Primary audit report: `/Users/idev/wildberries-audit/report-2026-06-30.md`.

Confirmed blocker chain:

1. Guide signup with phone fails with generic `Что-то пошло не так. Попробуйте ещё раз.`
2. Guide signup without phone incorrectly succeeds.
3. New guide lands in `/guide/inbox` instead of verification/profile onboarding.
4. First guide profile block cannot save; UI shows `Не удалось сохранить профиль. Обновите страницу и попробуйте снова.`
5. Verification submit is blocked because profile cannot be completed.
6. Admin sees affected guide in drafts with missing data.
7. Guide auth page `/auth?role=guide` shows traveler-facing blue panel copy.
8. Homepage date picker does not apply selected date.
9. `vps6.provodnik.app` does not resolve from this machine/public DNS.
10. Guide type choice is missing: individual guide / agency representative / guide team.
11. Legal offer needs Tripster-style organiser safety language — treat as content/legal requirement; implement only a safe placeholder/acceptance route if already in product, otherwise document as external legal blocker.

## Constraints

- Work in `/Users/idev/provodnik`.
- Read `CLAUDE.md`, `.claude/CLAUDE.md`, `AGENTS.md`, and relevant source before editing.
- Analyze/research/critique/refactor/improve before patching.
- Be creative like Steve Jobs: simple, sharp, memorable, not hype.
- No unrelated refactors.
- Do not expose secrets.
- Do not push or deploy; Hermes will inspect, verify, commit, push, and deploy.
- If DNS for `vps6.provodnik.app` requires external DNS provider access unavailable in repo/VPS, produce a clear blocker note in the report instead of faking a fix.

## Areas likely relevant

- `src/features/auth/actions/signUpAction.ts`
- `src/features/auth/components/auth-entry-screen.tsx`
- `src/lib/auth/role-routing.ts`
- `src/lib/auth/safe-redirect.ts`
- `src/app/(protected)/guide/page.tsx`
- `src/app/(protected)/guide/profile/page.tsx`
- `src/features/guide/components/profile/guide-about-form*`
- `src/features/guide/verification-actions*`
- `src/features/homepage-classic/components/homepage-request-form-classic.tsx`
- Supabase migrations/types if schema needs guide type or phone/trigger fix.

## Acceptance criteria

### Guide signup

- For `role=guide`, phone is required client-side and server-side.
- With a valid new phone, guide registration succeeds.
- With blank phone, guide registration blocks with a specific Russian error, not generic failure.
- Phone uniqueness remains enforced with friendly error when taken.
- New guide redirects to `/guide/profile` or `/guide/profile#start`, not `/guide/inbox`.
- Guide signup captures guide type:
  - `individual_guide` / label `Индивидуальный гид`
  - `agency_representative` / label `Представитель агентства`
  - `guide_team` / label `Команда гидов`
- Store guide type in an existing safe place if available; if schema is needed, add migration and types.

### Guide profile / verification

- Fresh guide profile first block saves successfully.
- Saved `bio`, `base_city`, `years_experience`, languages, and specializations persist after reload.
- Verification page path is reachable after signup.
- Submit for verification is not blocked by broken profile save. If document upload is required and hard to automate, make the profile-save portion verifiably fixed and report any remaining doc requirement honestly.
- Admin draft/submitted queue correctly reflects guide status.

### Guide auth copy

- `/auth?role=guide` no longer uses traveler-facing copy (`Найдите проверенного гида для поездки`, `Создайте профиль, отправьте запрос...`).
- Replace with concise guide-onboarding copy focused on becoming a verified guide.

### Homepage date picker

- Clicking a visible future date on homepage request form updates the visible field from `Когда` to the selected date.
- Works logged out and logged in as traveler.

### vps6

- If repo/VPS can fix it, fix public availability.
- If the root cause is missing DNS outside available access, create `docs/qa/wildberries-opus-fix-2026-06-30-vps6-dns-blocker.md` with exact DNS record needed and evidence. Do not pretend fixed.

### Legal offer

- If product already has an organiser/guide offer page/terms acceptance flow, add a concise TODO-safe Tripster-style section only if legally non-committal and marked for legal approval.
- Otherwise document as legal blocker in the final implementation report; do not invent binding legal text.

## Required verification commands

Run at least:

```bash
bun run typecheck
bun run lint
bun run build
```

Run focused tests if existing or add/update tests for:

- signup action guide phone requirement / phone success path
- redirect target for guide signup
- homepage date field selection
- guide profile save if component/action tests exist

## Required output

Write final implementation report to:

`docs/qa/wildberries-opus-fix-2026-06-30-report.md`

Report must include:

- files changed
- issues fixed
- any issue not fixable due to external dependency (DNS/legal)
- commands run and exact pass/fail status
- manual verification steps Hermes should run with screenshots
