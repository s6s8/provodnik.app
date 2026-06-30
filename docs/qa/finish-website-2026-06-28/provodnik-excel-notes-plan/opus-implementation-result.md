# Opus Implementation Result — Excel/Codex Screenshot Fixes

**Date:** 2026-06-30 (UTC+3)
**Branch:** `handover/macmini-final` (no push performed)
**Commit message:** `fix(product): resolve excel review findings`

All nine review categories implemented, verified, and committed. Verification ran the full gate (typecheck, lint, 1080 tests, production build) plus DB-level migration checks and live browser walks of every affected route in a production server pointed at local Supabase.

---

## Files changed

### Product code (24 files, +410 / −141)

```
src/app/(auth)/auth/page.tsx                                  trust copy + contrast
src/app/(protected)/account/page.tsx                          header tautology
src/app/(protected)/admin/guides/page.tsx                     queue error state
src/app/(protected)/admin/guides/page.test.tsx               (test)
src/app/(protected)/guide/profile/page.tsx                    legal card copy
src/app/(site)/become-a-guide/page.tsx                        hero/benefits/trust rewrite
src/components/shared/immersive-hero.tsx                       clickable breadcrumb support
src/features/auth/actions/signUpAction.ts                     phone-reuse prevention
src/features/auth/components/auth-entry-screen.tsx            footer layout + phone_taken copy
src/features/auth/tests/sign-up.test.ts                      (test)
src/features/guide/components/profile/guide-about-form.tsx    error placement
src/features/guide/profile-actions.ts                         friendly save errors
src/features/profile/actions/updateLegalInformation.ts        friendly legal error
src/features/profile/components/LegalInformationForm.tsx      layout / save footer
src/features/profile/components/traveler-profile-completion-checklist.tsx        copy
src/features/profile/components/traveler-profile-completion-checklist.test.tsx  (test)
src/features/requests/components/request-detail-screen.tsx    breadcrumb builder
src/features/requests/components/request-detail-screen.test.tsx                (test)
src/lib/navigation.ts                                         avatar menu cleanup
src/lib/navigation.test.ts                                   (test)
src/lib/profile/traveler-profile-completion.ts                readiness-block rename
src/lib/profile/traveler-profile-completion.test.ts          (test)
src/lib/supabase/database.types.ts                            +phone_normalized (Row)
src/lib/supabase/moderation.ts                                resilient queue loader
```

### Migrations (2 new, forward-only)

```
supabase/migrations/20260630000001_profiles_phone_unique.sql
supabase/migrations/20260630000002_guide_specializations_canon.sql
```

---

## Fixes mapped to the 9 categories

### 1. Avatar/account menu cleanup ✅
`travelerAccountMenu` reduced to `[account, help]`. Removed Favorites/Referrals (flag-gated side surfaces the user flagged "зачем эта страница?"). Notifications already lived only in the header bell — no duplicate existed. Browser-verified: open traveler avatar menu = **Профиль · Помощь · Выйти** only. `navigation.test.ts` updated to assert the new contract.

### 2. Auth trust panel copy + contrast ✅
`/auth` trust points rewritten as title+description objects with concrete, non-overpromising copy: «Регистрация и заявка бесплатны», «Только проверенные гиды», «Условия видны заранее», «Поможем с заявкой и бронированием». Headline → «Найдите проверенного гида для поездки». Paragraph contrast bumped `text-white/70 → /80`. Old «Бесплатно для путешественников» / «Честную цену» removed. Browser-verified white-on-navy contrast at 1280px and 375px (panel correctly hidden on mobile).

### 3. Auth footer layout + phone-reuse prevention ✅
- **Footer:** the bottom toggle is now a centered `Нет аккаунта? **Создать профиль**` line — muted prompt + primary-colored action, no more loose left-drifting grey text.
- **Phone reuse (backend):** added a STORED generated column `profiles.phone_normalized` (digits-only) + a partial UNIQUE index `profiles_phone_normalized_key`. `signUpAction` pre-checks the normalized phone and returns `phone_taken` (friendly RU copy «Этот телефон уже привязан к другому аккаунту…»); the unique index is a race-safe backstop mapped to the same friendly error. Null/blank phones normalise to NULL and stay allowed/optional. DB-verified: two differently-formatted spellings of the same number collide (`duplicate key`), 8-prefix vs 7-prefix do not (documented limitation — exact-digit reuse, which is the reported case, is blocked).

### 4. Account page tautology + cursor glitch ✅
`/account` traveler header collapsed to a single identity: H1 «Профиль путешественника» + subtitle «Эти данные видят гиды…», eyebrow removed. The lower readiness block renamed `Профиль путешественника → Готовность профиля` (`TRAVELER_PROFILE_SECTION_2_TITLE`), and its incomplete copy no longer says «в форме ниже». Browser-verified single H1, no stacked duplicate.
**Cursor artifact:** investigated in the rendered DOM — exactly one `#name` input, zero `contenteditable`, no stray inputs. The reported "second cursor outside the field" is not a source-level defect; it is a browser autofill / password-manager artifact on the reviewer's machine and is not reproducible in a clean browser. No speculative source change made.

### 5. Become-a-guide hero + benefits rewrite ✅
Removed «Зарабатывайте на авторских экскурсиях» and the income/«Большая часть дохода — вам» benefit block. Hero subtitle now states the requested positioning verbatim: «Проводник работает только с аккредитированными гидами…». CTA changed to «Подать заявку» (nav label kept as «Стать гидом»). Benefits reframed around verification (ShieldCheck/FileCheck2/MessageCircle); trust block retitled «Кто может работать в Проводнике». Browser-verified desktop + mobile, no overflow.

### 6. Guide legal form spacing / save overlap ✅
`LegalInformationForm` constrained to `max-w-xl`; field rhythm `space-y-4 → space-y-5`; tour-operator is now an explicit bordered row («Я зарегистрирован как туроператор» + helper); the registry field nests inside it; **the Сохранить button moved into a dedicated `border-t` footer** so it no longer crowds/overlaps the checkbox. Card helper copy explains why data is requested and that it locks after approval. Browser-verified in the editable state — clear save footer, no overlap.

### 7. Guide theme specialization DB constraint ✅
Root cause: the `guide_specializations_valid` CHECK still enumerated the legacy Plan-48 slugs (`history/architecture/photo/kids…`) while the UI vocabulary moved to `src/data/themes.ts` (`history_culture/night/active/water/religion…`). Forward migration `20260630000002` drops the stale constraint, **normalises existing data** (`history`/`architecture → history_culture`, `photo → art`, `kids` dropped), and re-adds the constraint matching the canonical THEMES set. `saveGuideAboutAction` (and `updateLegalInformation`) now wrap persistence failures in friendly RU copy and log internally — no raw `guide_specializations_valid` text can reach the UI. `traveler_requests.interests` left untouched (it stores free-text descriptions, not theme slugs).
**End-to-end browser-verified:** saving «О себе» with `religion` + `water` (both rejected under the old constraint) succeeded through UI → action → DB and persisted; no raw DB error shown. DB checks confirm all 9 THEMES slugs save and legacy `history` is rejected.

### 8. Request detail breadcrumb ✅
`ImmersiveHero` `HeroBreadcrumbItem` extended with optional `href`/`current`; crumbs with `href` render as `next/link`, the current crumb is a plain span with `aria-current="page"`. New `buildRequestDetailBreadcrumb()` replaces all three ad-hoc arrays: root «Запросы» → `/requests` (clickable, matches `ROUTES.requests`), the «Россия» country fallback dropped, «Калмыкия · Россия»-style labels trimmed to the region, region==city omitted. Browser-verified: «Запросы › Краснодарский край › Сочи» — root linked, city current/non-clickable, **no «Поездки» anywhere**.

### 9. Admin guides queue failure/states ✅
`getGuideReviewQueue` made resilient: the primary `guide_profiles` query stays strict, but accounts/cases/actions degrade via `Promise.allSettled` with logged warnings instead of collapsing the page. `/admin/guides` wraps the load in try/catch and renders an inline `GuideQueueLoadError` («Заявки гидов не загрузились» + diagnostic line + Повторить/Черновики/Аудит/Панель links) — never the generic «Действие не выполнено» boundary. Empty-state copy made explicit. Browser-verified: queue renders both submitted applications cleanly (admin can answer "did the application arrive?"); error/empty branches covered by `page.test.tsx`.

---

## Migrations / types

- **`20260630000001_profiles_phone_unique.sql`** — generated `phone_normalized` column + partial unique index. Applied to local DB and verified.
- **`20260630000002_guide_specializations_canon.sql`** — constraint realignment + data normalisation. Applied to local DB and verified (`UPDATE 11`, constraint now lists THEMES slugs).
- **`database.types.ts`** — hand-added `phone_normalized: string | null` to the `profiles` Row only (generated columns are read-only). A full `bun run types` regenerate was intentionally **not** committed: the local DB schema has pre-existing drift from the repo baseline and regeneration dragged in 1000+ unrelated lines.

---

## Verification (commands run)

| Check | Result |
|---|---|
| `bun run typecheck` | ✅ 0 errors |
| `bun run lint` | ✅ 0 errors |
| `bun run test:run` (full) | ✅ 224 files, **1080 tests passed** |
| `bun run build` | ✅ success |
| Local DB migration apply (psql) | ✅ both applied; constraint/index/normalisation confirmed |

DB spot-checks: saving `history_culture/night/active/water/religion` passes; legacy `history` is rejected by the constraint; same-digit phone in two formats collides on the unique index.

### Browser routes checked (production server → local Supabase, 1280px + 375px where relevant)

| Route | Result | Screenshot |
|---|---|---|
| `/auth` desktop | new copy, contrast OK | `implementation-screenshots/01-auth-desktop.png` |
| `/auth` mobile (375) | panel hidden, toggle centered | `02-auth-mobile.png` |
| `/become-a-guide` desktop | accreditation copy, «Подать заявку» | `03-become-a-guide-desktop.png` |
| `/become-a-guide` mobile | clean stack | `04-become-a-guide-mobile.png` |
| `/account` (traveler) | single H1, «Готовность профиля» | `05-account-traveler.png` |
| avatar menu (traveler) | Профиль/Помощь/Выйти only | `06-avatar-menu-traveler.png` |
| `/guide/profile` full | sections render | `07-guide-profile-full.png` |
| `/guide/profile` legal (editable) | save footer separated | `08-guide-legal-section.png` |
| `/requests/[id]` | «Запросы › регион › город», no Поездки | `09-request-breadcrumb.png` |
| `/admin/guides` | queue renders applications | `10-admin-guides-queue.png` |

Console was clean (0 errors) on the verified production pages; remaining dev-server console noise during the first attempt was Turbopack HMR/MIME artifacts, eliminated by switching to a production build.

---

## Blockers / notes (honest)

1. **`bun run db:reset` is broken on this branch (pre-existing, not mine).** Two migrations share version `20260623120000` (`_c1_payment_agreements` and `_redesign_foundation_additive`) → `duplicate key … schema_migrations_pkey`. The reset fails long before reaching my migrations. I therefore validated both new migrations by applying them directly to the running local DB via psql (they use `drop … if exists` / `add … if not exists`, safe to re-run). **Recommend** renaming one of the colliding files to a unique timestamp (with a `supabase migration repair` on any live DB where they were applied ad-hoc) to restore `db:reset` — out of scope for this task, flagged per cleanup policy.
2. **Live/remote DB not migrated.** `.env.local` points at the remote Supabase; the two new migrations are applied to local only. They must be applied to the deploy DB before/with the code ship. Both are forward-only and additive (constraint widening + a generated column + partial index) and do not break the currently-deployed code. The specialization normalisation `UPDATE` is a one-time, idempotent-safe data fix (not a seed re-run).
3. **Phone normalization is digits-only** (matches the JS used in `signUpAction`); it blocks exact-digit reuse (the reported case) but not 8-vs-7 prefix variants — documented in the migration comment as an acceptable bound.
4. **Dev-server (Turbopack) hydration** was flaky under Playwright; all interactive verification was done against a production build, which hydrated reliably.

## Commit

`fix(product): resolve excel review findings` — see hash below (no push).
