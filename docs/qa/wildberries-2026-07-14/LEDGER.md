# Wildberries feedback — verification ledger (items 1–18)

**Audit date:** 2026-07-14 (UTC+3)
**Branch:** `work/wildberries-full-execution-20260713`
**Baseline:** `origin/main` @ `cbcffe67` · prior executor's 19 commits through `88df693e` · this run's repairs `299be64a…a0a19338`
**Environment for every browser proof:** the app built with `next build` and served with `next start`, against a **local Supabase** (127.0.0.1) seeded with `scripts/seed-test-users.mjs` + `scripts/seed-qa-content.mjs`. **No production system was read, written, or deployed.**
**Viewports:** 1440×900 (desktop) and 375×812 (mobile), every UI item, both.

Every account, name, listing, review and phone number below is a **synthetic local fixture** (fictional people, `@provodnik.app` / `@example.com` addresses). No real user data exists in this environment. Screenshots additionally mask address-shaped strings.

---

## How to read a verdict

| Verdict | Meaning |
|---|---|
| `VERIFIED` | Behaviour was driven in a real browser and observed to be correct. No code change needed. |
| `FIXED_AND_VERIFIED` | It was broken (or missing). Repaired at the root cause this run, then driven in a real browser. |
| `RELEASE_GATE` | Code is complete and proven locally. Something outside the repo (env var, prod data, deploy) is still required. |
| `BLOCKED` | Cannot be verified from here at all. |

**A commit is never a pass.** Two items in this run had a green commit, a green unit test, and were still broken in the browser (10, 13). One looked broken and was correct (16).

---

## 1. Admin: sort/filter guides by region and base city
> «В админке нужна сортировка по региону/базовому городу.» (msg 541 #1)

- **Implemented by:** `43a77761` — `src/lib/supabase/admin-users.ts`, `src/app/(protected)/admin/users/page.tsx`, `_components/users-console.tsx`, `src/data/admin-users/schema.ts`
- **Source check:** `listAdminUsers` applies `region` and `baseCity` as **server-side** filters against `guide_profiles` (restrict-by-ids), not a client-side hide. Region options are derived from the guides' own free-text `regions` — there is no invented canonical region list.
- **Browser:** `/admin/users?role=guide&baseCity=Астрахань` and `?region=Калмыкия`, authenticated as **admin**, 1440 + 375.
- **Observed:** base-city «Астрахань» → only Наян Задваев (1 of 5 guides). Region «Калмыкия» → Баир + Гиляна, Наян gone. The other guides are absent from the DOM, not merely hidden.
- **Screenshots:** `01-admin-base-city-filter-{desktop,mobile}.png`, `01-admin-region-filter-{desktop,mobile}.png`
- **Verdict: `VERIFIED`**

## 2. Admin: detailed analytics
> «Нужна вкладка с более детальной статистикой, кто куда ездит, что пользуется спросом, сезонность…» (msg 541 #2)

- **Implemented by:** `1d6fdd43` — `src/app/(protected)/admin/analytics/page.tsx`, `src/lib/supabase/admin-analytics.ts`, `src/lib/navigation.ts`
- **Source check:** six fixed questions, each answered from real tables. Where the schema cannot answer one, the page renders «нет данных» rather than a proxy metric (D-07).
- **Browser:** `/admin/analytics` as **admin**, 1440 + 375. All six headings present; seeded Elista demand and Kalmykia supply appear as real rows.
- **Screenshots:** `02-admin-analytics-{desktop,mobile}.png`
- **Note:** the funnel and seasonality panels are honest about thin data — with a 6-listing fixture they show small numbers, not fabricated ones.
- **Verdict: `VERIFIED`**

## 3. Admin: status-change button feedback and latency
> «При смене статуса с гида на администратора кнопка сохраняем снова бесконечно "сохраняет". Надо все кнопки проверить.» (msg 541 #3)

- **Implemented by:** `d1be9c23` (nav counts 8 queries → 2; parallel role guards), `b342722f` + `bf6b5d33` (role-flip path)
- **Browser:** the **real flip** — Сунил Мунилов, гид → администратор → гид, as **admin**, 1440. (The save button is disabled while the selection still equals the current role, which is correct; a "click save" test proves nothing.)
- **Observed:** the save reaches a terminal state in **64–303 ms** across runs (logged by the spec). No infinite «сохраняет». At 375 the same controls are present and the no-op save is correctly refused.
- **Round trip is identity-safe:** after гид → админ → гид the guide keeps `display_name`, `slug`, `verification_status=approved`, `is_available=true`, and `/guides/sunil-sochi` renders «Сунил» — the msg-590 regression does not reproduce.
- **Screenshots:** `03-admin-role-save-feedback-desktop.png`, `03-admin-role-controls-mobile.png`
- **Finding (not a blocker):** the **first** anonymous request to `/guides/[slug]` immediately after a role change can still be served the pre-change render — `export const revalidate = 3600` makes it an ISR page, and the invalidated entry is served stale once while it regenerates. The database is already correct at that instant, and the next request is right. This is the mechanism behind «Ctrl+F5 — ничего не происходит» (msgs 581–584): the staleness is on the **server**, so clearing the browser cache cannot touch it. Left unfixed deliberately — see RELEASE_GATES.md → follow-ups.
- **Verdict: `VERIFIED`**

## 4. Homepage: budget-per-person hint
> «На главной странице при запросе нужна всплывающая подсказка в ячейке бюджет – "бюджет на человека"» (msg 541 #4)

- **Implemented by:** already present at baseline; **truncation fixed** this run by `a0a19338`
- **Source check:** the field's own `<label>` reads «Бюджет, ₽ на человека».
- **PM default applied:** the request says «всплывающая подсказка» (a hover tooltip). A permanent visible label is **better**, not worse: a hover tooltip does not exist on a phone, which is where half this audience is. The intent — the traveller knows the budget is per person — is met at both viewports.
- **Browser:** homepage, anonymous, 1440 + 375. Label visible, field accepts input.
- **Caught here:** at 375px the label was being **truncated to «Бюджет, ₽ на че…»** by the same flex squeeze as item 10's zero-width field. Fixed in `a0a19338`; it now reads in full on a phone.
- **Screenshots:** `04-home-budget-per-person-{desktop,mobile}.png`
- **Verdict: `FIXED_AND_VERIFIED`**

## 5. Homepage: information blocks under «Как это работает»
> «Под блоком "Как это работает" нужно отразить готовые экскурсии, популярные направления, гиды, отзывы, QA. Наша главная страница малоинформативна.» (msg 541 #5)

- **Implemented by:** `f0f1ad5e` — `homepage-inventory-classic.tsx`, `src/lib/supabase/homepage.ts`; **repaired** this run by `299be64a`
- **Source check:** all five blocks render from real data, each with a minimum-count gate (`HOMEPAGE_MIN`) so an empty marketplace looks intentional rather than broken.
- **Browser:** homepage, **anonymous**, 1440 + 375. All five blocks present, and positioned **after** «Как это работает» (asserted by DOM order, not by eye).
- **Defect found and fixed:** the Отзывы block attributed **every** review to «Путешественник». All three public review readers joined `profiles:traveler_id(full_name)`, and `profiles_select` RLS is `auth.uid() = id OR is_admin()` — so for the logged-out visitor the join silently resolved to NULL. No error, anywhere. Fixed once at the data boundary with an anon-safe view (`v_public_reviews`, migration `20260716000000`) that emits first-name + initial («Ирина П.») and never the legal name. Authors now render on the homepage, the guide page and the listing page.
- **Screenshots:** `05-home-inventory-blocks-{desktop,mobile}.png`, `05-home-reviews-named-authors-{desktop,mobile}.png`
- **Verdict: `FIXED_AND_VERIFIED`**

## 6. Homepage: live destination search
> «В форме "Куда едете" надо сделать живой поиск, чтобы всплывали города, регионы, направления» (msg 541 #6)

- **Implemented by:** `e942e5d1` — `homepage-request-form-classic.tsx` (cmdk combobox replaces the native `<datalist>`)
- **Source check:** a real combobox (role, `aria-activedescendant`, arrow traversal, Enter to commit). Deliberately **assistive, not restrictive**: the destination list is derived from guide free-text and is always incomplete, so free typing still submits as typed.
- **Browser:** homepage, anonymous, 1440 + 375. Typing «Эли» filters to exactly «Элиста»; «Астрахань» and «Сочи» drop out of the option set. ArrowDown + Enter commits the value.
- **Screenshots:** `06-home-destination-typeahead-{desktop,mobile}.png`, `06-home-destination-selected-{desktop,mobile}.png`
- **Verdict: `VERIFIED`**

## 7. «Готовые экскурсии» entry and catalog
> «Сверху, возле пункта "запросы" нужно разместить "готовые экскурсии".» (msg 541 #7)

- **Implemented by:** `0d267f54` + `2c626fc1` (the flag was registered but only filtered the account menu, not the primary nav — caught by the prior run on the built app)
- **Source check:** the entry is gated by `FEATURE_PUBLIC_CATALOG`. With the flag **off**, the nav entry is hidden and `/listings` redirects to `/guides`.
- **Browser:** flag **on**, anonymous, 1440 + 375 (mobile via the hamburger). Header shows «Готовые экскурсии» next to «Запросы»; it opens `/listings`, which lists the real published excursions.
- **Screenshots:** `07-nav-catalog-entry-{desktop,mobile}.png`, `07-catalog-listings-{desktop,mobile}.png`
- **Verdict: `RELEASE_GATE`** — code complete and proven with the flag on. `FEATURE_PUBLIC_CATALOG=1` must be set on **every** environment (prod + preview + Mac mini) or the catalog silently differs between them. See RELEASE_GATES.md.

## 8. Email notifications
> «Настроить уведомления на почту» (msg 541 #8)

- **Implemented by:** `700cdcc7` (coverage matrix) + **`b2dadaff` this run** (the missing email)
- **Not a UI item — no screenshot applies.** The observable proof is the trigger/caller matrix plus tests; an email cannot be photographed in a browser.
- **Independently re-traced (the prior audit was not trusted):** of seven notification triggers, only **two** could ever reach an inbox in production — new offer → traveller, and booking created → guide. Three have **zero callers** anywhere (`notifyBookingConfirmed`, `notifyBookingCancelled`, `notifyReviewRequested`). `FEATURE_TR_NOTIFICATIONS` does **not** gate email at all; it gates the settings page and the bell.
- **Gap closed this run:** a traveller posted a request and matching guides got an in-app bell **and nothing else** — a guide not in the app at that moment learned nothing, and the request sat unanswered. Marketplace liquidity depends on that one email. Wired onto the existing rails (`sendNotificationEmail` + templates + guide email prefs), with the recipient folded into the idempotency key (`${requestId}:${guideId}`) — `notification_email_log` is `PRIMARY KEY (kind, entity_id)`, so a bare request id would let the first guide's row take the key and every other guide's mail would be dropped as "already sent", silently. Three tests pin this.
- **Still not proven to deliver:** nothing sends until `RESEND_API_KEY` exists in the environment. Local has no key and no mail server, by design.
- **Verdict: `RELEASE_GATE`** — code complete; delivery requires the key + a staging send test. See RELEASE_GATES.md.

## 9. Footer: project / support / rules / social links
> «Не активны кнопки о проекте, поддержка, правила, мы в сети.» (msg 541 #9)

- **Implemented by:** no code change needed — the report is not reproducible against this codebase.
- **Browser:** homepage footer, anonymous, 1440 + 375. All nine internal links are present and each returns **200**; the Telegram link and the `mailto:` are real destinations, not `#`. Clicking «Доверие и безопасность» navigates and renders.
- **Screenshots:** `09-footer-links-{desktop,mobile}.png`, `09-footer-link-opens-trust-{desktop,mobile}.png`
- **Verdict: `VERIFIED`** — with the honest caveat that this is a **local** verification. If the links are dead on production, the cause is environment drift (a feature flag hiding a route: `/help` sits behind `FEATURE_TR_HELP`), not code. See RELEASE_GATES.md.

## 10. Anonymous traveller: request recap and continuity through registration
> «При попытке отправить запрос незарегистрированный путешественник видит форму "Зарегистрироваться". У трипстера появляется форма запроса с деталями поездки… Надо сделать что-то похожее.» (msg 541 #10)

- **Implemented by:** `c855cbc6`; **two defects repaired** this run by `6bb24dc7` and `a0a19338`
- **Browser:** homepage → fill the real form (typed destination, calendar date, theme, guests, budget) → «Найти гида», anonymous, 1440 + 375.
- **Observed:** the auth dialog is **not** a bare registration wall — it shows «Ваша заявка» with Направление / Когда / Гостей / Бюджет echoed back, above the login form.
- **Defect 1 (data integrity) — fixed:** the draft was restored with `form.reset()` inside an effect. That updates react-hook-form's **state** but never writes back into the registered uncontrolled inputs. So on return the visitor saw «2 гостей / 5 000 ₽» — the defaults — while the request that would actually be submitted carried **4 and 7 000**. Shown one trip, sent another, with no error anywhere. Only the controlled destination field came back, which is exactly why this read as "the draft works". Reproduced on a **production build**, not just in dev. Fixed with RHF's `values` prop (its documented channel for data arriving after mount — Context7).
- **Defect 2 (mobile) — fixed:** see item 4/`a0a19338`. At 375px, picking a date collapsed the «Гостей» input to **zero width**. On a phone the traveller could not see or type the guest count at all, mid-conversion.
- **Screenshots:** `10-anon-request-recap-{desktop,mobile}.png`, `10-anon-draft-restored-{desktop,mobile}.png`, `10-mobile-form-fields-usable-mobile.png`
- **Verdict: `FIXED_AND_VERIFIED`**

## 11. Admin: a specific guide's excursions and status counts
> «В админке должна быть информация об экскурсиях конкретного гида, количестве готовых экскурсий, на модерации. При регистрации Гиляна создала экскурсию. Но о ней нет информации.» (msg 544 #11)

- **Implemented by:** `c5b6f414` — `admin/guides/[id]/guide-listings-panel.tsx`, `src/lib/supabase/admin-listings.ts`
- **Browser:** `/admin/users?role=guide&q=Гиляна` → её карточка → «Открыть полную анкету», as **admin**, 1440 + 375.
- **Observed:** all three of the fixture guide's listings appear with their statuses — **published** («Гастротур»), **on moderation** («Закат на Маныче») and **draft** («Буддийские места Калмыкии»). The complaint's exact scenario (a guide created an excursion and the admin could not see it) does not reproduce: the draft is visible.
- **Screenshots:** `11-admin-guide-listings-{desktop,mobile}.png`
- **Verdict: `VERIFIED`**

## 12. Moderated ready excursions on the homepage
> «Готовые экскурсии, прошедшие модерацию должны отображаться на главной под блоком "как это работает"» (msg 544 #12)

- **Implemented by:** `f0f1ad5e` (block) + `3bbf2dc3` (one approved status: `published`); reviews half repaired by `299be64a`
- **Browser:** homepage, anonymous, 1440 + 375.
- **Observed:** the «Готовые экскурсии» block shows the three published excursions. The **draft** and the **pending-review** fixtures are absent from the page — moderation state is genuinely respected, not just decorated.
- **Screenshots:** `12-home-moderated-excursions-only-{desktop,mobile}.png`
- **Verdict: `VERIFIED`** (block); the underlying `active` → `published` **data migration** for existing prod rows is a release gate — see RELEASE_GATES.md.

## 13. Public guide-name standard + private/admin full name
> «У Гиляны высвечивается почта… Обязательным и видимым для путешественника сделать только имя, а в админке должно быть полное ФИО и должна быть возможность его редактировать.» (msg 545 #13, msg 553)

- **Implemented by:** `5087e62c`, `b342722f`; **repaired** this run by `fb467235`
- **Browser:** `/guides` and `/guides/gilyana-elista` anonymous; `/admin/users/<id>` as **admin**; 1440 + 375.
- **Defect found and fixed — the standard was built and then not honoured.** `/guides/[slug]` titled its page **«Гиляна Манджиева»** — the private FIO — where the standard says «Гиляна». Two causes, both fixed at the boundary:
  1. `mapGuideRow` resolved `profiles.full_name ?? guide_profiles.display_name` — **backwards**. The grid only looked right by accident: anon RLS hides `profiles`, so `full_name` came back NULL and the fallback did the work. **An admin browsing the same public grid saw the FIOs.**
  2. The two anon-facing projections (`v_guide_public_profile`, `get_public_guide_by_slug`) emit `p.full_name` and are both SECURITY DEFINER — they hand the private FIO to callers RLS would never let near `profiles`. **Four more traveller-facing readers** were quietly publishing it: the request page's guide cards, the traveller's chat header, the conversations list, and the booking screen. Migration `20260717000000` makes both projections resolve `COALESCE(NULLIF(BTRIM(display_name),''), full_name)`. A guide's legal name can no longer leave the database on a public read.
- **Observed after the fix:** the FIO appears **zero** times on `/guides` and `/guides/gilyana-elista`. No card is titled with an email local-part.
- **Admin half:** «ФИО полностью» is present and editable — the test actually edits it, proves it persists, proves the **public** display name does **not** change, then restores the fixture and confirms the rollback.
- **Screenshots:** `13-public-guides-names-{desktop,mobile}.png`, `13-admin-full-name-editable-{desktop,mobile}.png`, `13-admin-full-name-saved-{desktop,mobile}.png`
- **Verdict: `FIXED_AND_VERIFIED`** — the prod rows already clobbered to an email local-part still need the data repair. See RELEASE_GATES.md.

## 14. Moderation terminology + unified approved status
> «В админке, в разделе "модерация" есть пункт "объявления". Непонятно, что это. У гидов должны быть экскурсии и туры на модерации и ответы на отзывы» (msg 547 #14)

- **Implemented by:** `3bbf2dc3` — tab renamed; the approved status unified on `published`
- **Browser:** `/admin/moderation` as **admin**, 1440 + 375.
- **Observed:** tabs are «Экскурсии» and «Ответы на отзывы». «Объявления» is gone from the DOM. The pending fixture («Закат на Маныче») is in the queue.
- **Source check (the important half):** approving from the queue now writes `published`, the single status every public reader looks for. The prior run also found and fixed two writers the plan missed — the guide calendar read `status = 'active'` (migrating rows without that fix would have **emptied every guide's calendar**) and `bulkSetStatus` wrote `active`.
- **Screenshots:** `14-admin-moderation-tabs-{desktop,mobile}.png`
- **Note:** the group asked for «экскурсии **и туры**». Tours are a `category` of the same `listings` table and appear in the same queue; there is no separate tab. Flagged as a naming question for the operator, not a defect.
- **Verdict: `VERIFIED`** (code); the `active` → `published` **row migration** on prod is a release gate.

## 15. Admin action latency / the «аудит» button
> «Кнопки в админке откликаются с задержкой… Кнопка "аудит" реагирует хуже всех и иногда не срабатывает» (msg 548 #15)

- **Implemented by:** `d1be9c23` — the admin layout ran **8** count queries per navigation and discarded 6 of them; now 2. Role guards run in parallel.
- **Browser:** `/admin/dashboard` → click «Аудит», as **admin**, 1440 + 375.
- **Observed:** the audit page becomes interactive in **233–297 ms**; the click lands every time across all runs. The reported «иногда не срабатывает» does not reproduce.
- **Honest limit:** these are numbers from a **local** server with a **local** database and a 6-row fixture. They are not a production latency measurement and are not presented as one. The causal fix — 8 queries → 2 — is pinned by a test whose mock client *throws* if the nav counts touch `bookings`/`disputes`.
- **Screenshots:** `15-admin-audit-opens-{desktop,mobile}.png`
- **Verdict: `VERIFIED`** (locally); production latency confirmation is an operator gate.

## 16. Request page: the top area is too wide/tall
> «Очень широкое верхнее поле на странице запроса.» (msg 549 #16, screenshots 550/551)

- **Implemented by:** `451480cd` — a `compact` variant of `ImmersiveHero`
- **Browser:** `/requests/<id>`, anonymous, 1440 + 375. Hero height **measured**, not eyeballed.
- **Observed:** **335 px** at 1440 (the default variant is `min-h-[520px] sm:min-h-[632px]` — that is the band the report is about). At 375 the hero is 564 px, and **that is not empty space**: on a phone the same hero carries the trip-details panel («ДЕТАЛИ ПОЕЗДКИ», dates, per-person budget) inline. The test asserts the panel is inside the measured box, so height cannot be padding masquerading as content.
- **Screenshots:** `16-request-compact-hero-{desktop,mobile}.png`
- **Verdict: `VERIFIED`**

## 17. Grammatical cases
> «Падеж не соответствует» (msg 552 #17)

- **Implemented by:** `9bb37df7` — every Russian count-word routed through the shared `pluralize` util; two genuinely broken sites fixed («22 человек», «1 человек использовали»)
- **Browser:** homepage «Популярные направления» and `/guides` cards, anonymous, 1440 + 375.
- **Observed:** «2 гида» and «1 гид» (never «2 гидов» / «1 гида»); «1 отзыв» (never «1 отзывов» / «1 отзыва»). The request page reads «В группе сейчас 3 человека».
- **Held this run:** the new notification email (item 8) declines its guest count through the **same shared util** — a hand-rolled declension in the template would have re-opened exactly this bug.
- **Screenshots:** `17-declension-destinations-{desktop,mobile}.png`, `17-declension-guide-cards-{desktop,mobile}.png`
- **Verdict: `VERIFIED`**

## 18. Guide phone integrity + the role-change bypass
> «Гиды все еще могут регистрироваться не указывая телефон — эта проблема была пофиксена, она снова вернулась. Гиляна зарегистрировалась без мобильного.» (msg 567 #18)

- **Implemented by:** `b342722f` (the live bypass: promoting to guide without a phone is rejected), `396f623f` (phoneless guides are prompted; admins see a flag)
- **Browser:** `/admin/users?role=guide` and a real promotion attempt, as **admin**, 1440 + 375.
- **Observed:**
  - the phoneless fixture guide carries a red **«нет телефона»** badge in the admin list;
  - promoting a phoneless account to **гид** is **refused**, with the reason naming the phone. The bypass is closed at the action, not only in the signup form.
- **Screenshots:** `18-admin-no-phone-badge-{desktop,mobile}.png`, `18-admin-phone-required-on-role-change-{desktop,mobile}.png`
- **Verdict: `VERIFIED`** — existing phoneless guides on prod are a **data** question (backfill/prompt), not a code one. See RELEASE_GATES.md.

---

## Summary

| Verdict | Items |
|---|---|
| `VERIFIED` | 1, 2, 3, 6, 9, 11, 12, 14, 15, 16, 17, 18 — **12** |
| `FIXED_AND_VERIFIED` | 4, 5, 10, 13 — **4** |
| `RELEASE_GATE` | 7, 8 — **2** |
| `BLOCKED` | none |

**Repairs made this run**

| Commit | Item(s) | What was actually wrong |
|---|---|---|
| `299be64a` | 5, 12 | Every public review was attributed to «Путешественник» — an RLS-blocked join, silent |
| `6bb24dc7` | 10 | The anon draft restored into form *state* but not into the *fields*: shown one trip, submitted another |
| `b2dadaff` | 8 | Matching guides were never emailed about a new request (in-app bell only) |
| `fb467235` | 13 | Public guide surfaces served the private legal FIO; five readers, two SECURITY DEFINER projections |
| `a0a19338` | 4, 10 | At 375px the «Гостей» field collapsed to zero width once a date was picked |
