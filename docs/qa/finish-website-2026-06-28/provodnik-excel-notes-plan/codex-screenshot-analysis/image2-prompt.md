You are Codex acting as an independent senior product/design/code reviewer for Provodnik.

Repository: /Users/idev/provodnik
Task: analyze ONE screenshot extracted from the user's Excel review notes. Use the screenshot plus the known Excel/source context below to produce a concrete source-aware evaluation and redesign/fix strategy.

Rules:
- READ-ONLY. Do not edit files, do not commit, do not push.
- You may inspect the repo source to locate exact components/files and understand implementation.
- Treat the screenshot as user-reported evidence, not as decoration.
- Be strict and product-minded: what is wrong, why it confuses users, and how to fix it cleanly.
- Preserve Provodnik's current brand/design system. Do not invent a totally new visual identity.
- Use Tailwind/shadcn project rules if proposing implementation.
- No secrets or internal credentials in the report.

Known Excel notes already extracted:
- Avatar menu: “Мои поездки”, “Приглашения”, “Избранное”, “Уведомления”; unclear purpose; notifications duplicated with bell.
- /auth: “Бесплатно для путешественников” confusing; “Честную цену?” confusing; what support means unclear; page visually crooked; same phone can be reused for another account.
- /account: duplicate/tautological labels: “Кабинет путешественника”, “Профиль”, “Профиль путешественника”; possible second blinking cursor outside input.
- /become-a-guide: remove “Зарабатывайте на авторских экскурсиях”; remove unrealistic block; add “Проводник работает только с аккредитированными гидами”.
- /guide/profile: save button overlaps text; “О себе” save errors with `new row for relation "guide_profiles" violates check constraint "guide_specializations_valid"`.
- request detail: breadcrumb “Поездки > Россия > Москва” is wrong, not clickable, and confusing.
- /admin/guides: admin tried to verify whether a guide application arrived; guides section shows an error/failure state.

For this single screenshot, return Markdown with these sections:
1. Screenshot identity — page/route, visible UI, screenshot-specific user complaint.
2. UX/product diagnosis — exact problems visible, including copy, hierarchy, affordance, spacing, trust, state clarity.
3. Source/code investigation — likely exact files/components/actions/schema/tests to inspect or change.
4. Redesign/fix strategy — concrete before→after copy/layout/behavior. Include Russian copy suggestions where relevant.
5. Implementation checklist — ordered tasks, tests, browser checks, acceptance criteria.
6. Risk notes — data/schema/RLS/auth/role issues, regression risk, what NOT to change.

Be detailed enough that an executor can implement without guessing.

## This screenshot
- Image: /Users/idev/provodnik/docs/qa/finish-website-2026-06-28/provodnik-excel-notes-plan/extracted-media/image2.png
- Workbook location: Login A33
- Route/area: /auth form
- Known complaint: Auth form/layout visual issue: page looks crooked/awkward plus phone uniqueness note belongs to this area.

Analyze this image specifically.
