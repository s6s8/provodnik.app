## 1. Screenshot Identity — `/admin/guides`

Visible UI: protected admin shell with left sidebar, active item `Гиды` showing count `1`, and a centered red error card:

- `Ошибка админки`
- `Действие не выполнено`
- `Не удалось выполнить действие в админке. Попробуйте ещё раз или напишите в поддержку.`
- buttons: `Повторить`, `К панели`, `Войти снова`

Screenshot-specific complaint: admin opened `/admin/guides` to check whether a guide verification application arrived, but the queue renders only a generic failure state. The sidebar count suggests one guide item exists, yet the main content gives no confirmation, no queue context, and no next diagnostic path.

## 2. UX/Product Diagnosis

The main issue is state clarity. This is not presented as “guide queue failed to load”; it says “action failed,” which implies the admin clicked an approve/reject action. In this screenshot the likely failure is page/data loading, so the copy sends the admin in the wrong mental direction.

The sidebar badge `1` is the only evidence that a guide application may exist. The error card does not reconcile that signal. A human admin sees “Гиды 1” plus a fatal page error and cannot tell whether:

- the guide application arrived,
- the queue query failed,
- their admin session is invalid,
- Supabase/admin environment is misconfigured,
- the guide exists but is in draft rather than submitted state.

Hierarchy is too generic. The card title `Действие не выполнено` is louder than the actual task. For an operational admin page, the primary message should be queue-specific: `Не удалось загрузить заявки гидов`.

Affordances are weak. `Повторить` is fine for transient errors, but `К панели` and `Войти снова` are not enough. The admin needs routes that answer the actual question: submitted queue, drafts, audit/moderation cases, dashboard.

Trust is damaged because the failure appears at the moment of verification. Admin tools must make backend uncertainty explicit: “заявка могла прийти, но список сейчас недоступен” is better than implying no result.

Spacing/visuals are acceptable within the current brand shell, but the red card is oversized for an operational panel and leaves the rest of the workspace empty. Keep Provodnik tokens/shadcn, but make this an inline queue error state under the page header, not a generic app-level failure whenever possible.

## 3. Source/Code Investigation

Likely source locations:

- `/admin/guides` page: [src/app/(protected)/admin/guides/page.tsx](/Users/idev/provodnik/src/app/(protected)/admin/guides/page.tsx:105)
  - The page calls `const guides = await getGuideReviewQueue({ view });` directly at line 112.
  - Any thrown error escapes to the admin error boundary.
  - Normal queue UI, filters, empty state, and guide rows are below that call, so they never render on failure.

- Admin error boundary: [src/app/(protected)/admin/error.tsx](/Users/idev/provodnik/src/app/(protected)/admin/error.tsx:15)
  - `resolveAdminErrorMessage` only distinguishes admin access and missing Supabase admin env.
  - Default copy at line 29 is generic action failure.
  - Title at line 46 is hard-coded `Действие не выполнено`.

- Moderation service: [src/lib/supabase/moderation.ts](/Users/idev/provodnik/src/lib/supabase/moderation.ts:697)
  - `getGuideReviewQueue` requires admin session, reads `guide_profiles`, then loads related `profiles`, `moderation_cases`, and latest actions.
  - Errors thrown at profile query, profile lookup, moderation cases, or action lookup all collapse the full page.
  - Contrast: `getGuideReviewDetail` uses `Promise.allSettled` and logs partial failures for documents/cases/licenses at [src/lib/supabase/moderation.ts](/Users/idev/provodnik/src/lib/supabase/moderation.ts:770). The queue page lacks that resilience.

- Tests: [src/app/(protected)/admin/guides/page.test.tsx](/Users/idev/provodnik/src/app/(protected)/admin/guides/page.test.tsx:86)
  - Current tests cover happy path, drafts, invalid view, and empty states.
  - Missing test: queue fetch rejects and page renders a queue-specific recoverable error instead of throwing to `admin/error.tsx`.

- Sidebar/count source:
  - [src/app/(protected)/admin/layout.tsx](/Users/idev/provodnik/src/app/(protected)/admin/layout.tsx:57) calls `getAdminNavCounts`.
  - [src/app/(protected)/admin/admin-sidebar-nav.tsx](/Users/idev/provodnik/src/app/(protected)/admin/admin-sidebar-nav.tsx:1) renders the `Гиды` count.
  - In the screenshot, this path succeeds enough to show `1`, while the guide queue page fails.

Schema/RLS context:

- `guide_profiles.verification_status` enum includes `draft`, `submitted`, `approved`, `rejected`.
- Admin RLS policies allow admin access to `guide_profiles`, `moderation_cases`, and `moderation_actions`.
- If this fails in production, likely causes are admin role/session mismatch, missing Supabase admin env, schema drift, RLS/helper function issue, or a related query failure rather than the guide application being absent.

## 4. Redesign/Fix Strategy

Before:

- Page-level failure shows generic admin boundary.
- Copy: `Действие не выполнено`.
- Recovery: retry, dashboard, login.
- Admin cannot answer: “did the application arrive?”

After:

Keep the admin shell and page header visible. Catch queue load failures inside `/admin/guides` and render a route-specific inline error panel.

Suggested copy:

Title:
`Заявки гидов не загрузились`

Body:
`Не удалось получить очередь анкет со статусом «На проверке». Заявка могла прийти, но список сейчас недоступен. Обновите страницу или проверьте черновики и журнал аудита.`

Small diagnostic line:
`Если число рядом с «Гиды» в меню больше нуля, в системе есть заявки, но таблица очереди сейчас не открылась.`

Buttons:

- Primary: `Повторить загрузку` -> link to current `/admin/guides` URL.
- Secondary: `Открыть черновики` -> `/admin/guides?view=drafts`.
- Secondary: `К аудиту` -> `/admin/audit`.
- Optional secondary: `К панели` -> `/admin/dashboard`.

Normal page improvements:

- Keep filters `На проверке` and `Черновики`, but if counts are available, render `На проверке 1`, `Черновики 0`.
- Empty state should be more explicit:
  - `Нет заявок на проверке. Если гид только начал анкету, проверьте вкладку «Черновики».`
- Row metadata should include moderation status if present:
  - `Кейс: открыт · причина: Документы гида на проверке`
  - If no case: `Кейс модерации ещё не создан`
- Avoid direct approve/reject from the queue dropdown if the detail page is the safer review surface. If retained, failures should return inline action errors, not the global admin boundary.

Implementation direction:

- In `AdminGuidesPage`, wrap only `getGuideReviewQueue({ view })` in `try/catch`.
- On catch, log server-side with existing `logError` pattern if available, then render a `GuideQueueLoadError` component.
- Do not expose raw Supabase error messages to the UI.
- Leave `src/components/ui` untouched.
- Use Tailwind/shadcn tokens only: `bg-destructive/10`, `border-destructive/30`, `rounded-card` or existing local radius pattern.

## 5. Implementation Checklist

1. Add a queue-specific error branch in [src/app/(protected)/admin/guides/page.tsx](/Users/idev/provodnik/src/app/(protected)/admin/guides/page.tsx:105).
2. Preserve the page header and filter tabs even when queue data fails.
3. Add `GuideQueueLoadError` local component with Russian copy above.
4. Add links for retry/current view, drafts, audit, dashboard.
5. Consider making `getGuideReviewQueue` more resilient:
   - `guide_profiles` failure remains fatal.
   - related `profiles`, `moderation_cases`, `moderation_actions` failures can degrade to missing account/case metadata with logged errors, similar to `getGuideReviewDetail`.
6. Add tests in `src/app/(protected)/admin/guides/page.test.tsx`:
   - `getGuideReviewQueue` rejects -> renders `Заявки гидов не загрузились`.
   - filter links still visible.
   - no raw backend error is rendered.
7. Add or update moderation service tests if partial-failure behavior is changed.
8. Browser checks:
   - `/admin/guides` with submitted guide.
   - `/admin/guides?view=drafts`.
   - forced/mock queue failure.
   - mobile admin tabs do not overlap the error panel.
9. Verification:
   - `bun run typecheck`
   - `bun run lint`
   - Screenshot compare for `/admin/guides` error and normal queue states.

Acceptance criteria:

- Admin can tell whether they are seeing a queue load failure, not an action failure.
- The UI explains that a sidebar count may still indicate existing applications.
- The admin has a clear path to submitted queue, drafts, audit, and dashboard.
- A related metadata failure does not unnecessarily hide the entire guide queue.

## 6. Risk Notes

Do not change RLS as a first response. The screenshot is evidence of a surfaced failure, not proof that RLS is wrong.

Do not collapse `draft` and `submitted`. The product needs both states: “started application” vs “ready for admin review.”

Do not expose Supabase error strings, SQL details, service-role configuration, or internal credentials in the UI.

Be careful with `requireAdminSession`: both the page and moderation helpers rely on it. Avoid adding duplicate role logic in components.

If changing `getGuideReviewQueue` to partial failure mode, keep the primary `guide_profiles` query strict. Showing an empty queue when the primary query failed would be worse than the current red card because it could falsely imply no applications arrived.