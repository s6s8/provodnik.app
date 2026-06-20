# 25 form-refactor (V-9 + R-6) — cursorSDK
SCOPE: canon refactor of the manual /form + schema reconciliation. (Builds on task 15.)
FILES (≤5): src/app/(home)/form/page.tsx, src/features/homepage-classic/components/homepage-shell2-classic.tsx + homepage-request-form-classic.tsx (+ use-request-form.ts).
WHAT: focused FORM page (like /auth) — PageHeader + one elevated form card, NOT a photo hero. One primary CTA "Подобрать гида"; Lucide icons (no glyphs); fields scope-first (Куда·Когда+flex toggle exact/few_days·Время·Формат assembly/private toggle w/ icons·Сколько·Бюджет·Интересы from canonical INTEREST_CHIPS·Язык·Комментарий). Submit via createRequestAction with the IDENTICAL field set the conversational / form emits. States: inline zod errors, pending, success→/requests/{id}?created=1. Subordinate link back to /.
VERIFY: bun run test:run (update homepage-request-form*.test.tsx); live — clean form, one CTA, toggle works, submit creates a request; interests+flex match /.
COMMIT: `feat(form): canon refactor + schema reconciliation`

