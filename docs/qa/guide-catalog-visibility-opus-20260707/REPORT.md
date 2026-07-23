# P0 — Public guide catalog visibility — REPORT

**Date:** 2026-07-07 (UTC+3)
**Provodnik Supabase ref:** `yjzpshutgmhxizosbeef` (confirmed, not DataRaven)
**Result:** ✅ Fixed live. `/guides` lists approved guides; guide detail pages open (incl. Cyrillic slug); search works.

---

## 1. Root cause (proven)

The public catalog was empty because **both approved guide profiles had `is_available = false`**.

The deployed public RPC `search_guides` (migration `20260702170000_filter_public_guides_by_account_state`) requires **all four** predicates:

```
verification_status = 'approved'  AND  profiles.role = 'guide'
AND profiles.account_status = 'active'  AND  is_available = true
```

Read-only prod probe (sanitized) before the fix:

| Probe | Count |
|---|---|
| total `guide_profiles` | 2 |
| `verification_status = 'approved'` | 2 |
| approved **AND** `is_available = true` | **0** |
| approved AND available AND `slug` not null | 0 |
| live RPC `search_guides('', p_has_listings=false)` rows | **0** |

Per-row state (sanitized, uid = first 8 chars):

| uid8 | verification_status | role | account_status | slug present | is_available |
|---|---|---|---|---|---|
| 69f18040 | approved | guide | active | yes | **false** |
| 904cdd5c | approved | guide | active | yes | **false** |

So the **only** failing predicate was `is_available`. `role`, `account_status`, and `slug` were all already correct — this was not a slug, account-state, RPC, or code-path problem.

**Why the data was stale:** these two guides were approved by an *older* deployment, before the current approval path (`src/lib/supabase/moderation.ts`, `performModerationAction`) was changed to set `is_available = true` on approve. The idempotent backfill migration that repairs historical approvals — `supabase/migrations/20260702000001_publish_approved_guides.sql` — **exists in `origin/main` but had never been applied to the prod database** (consistent with the standing "never `supabase db push` on prod / ledger is truncated" landmine).

**What was NOT the cause (ruled out with evidence):**
- Code path — `getGuides` already calls `search_guides` with `p_has_listings: false`; `getGuideBySlug` queries `guide_profiles` by slug with no availability filter. Correct and already on `origin/main`/VPS.
- Approval path — already sets `is_available = true` + generates slug when missing (`moderation.ts`, `performModerationAction`).
- Stale VPS — VPS `/opt/provodnik` HEAD equals `origin/main` HEAD (see §5).
- Cache — `/guides` serves `cache-control: no-store` (dynamic via `searchParams`), so it reflects DB state on the next request.

## 2. Files / migrations changed

**None.** No repository code or migration files were changed. `origin/main` already contained everything needed (approval fix + backfill migration + `p_has_listings=false` query). The single gap was unapplied prod data. Fixing the smallest safe root cause therefore meant a targeted data backfill, not a code edit. (This report + screenshot are the only added files.)

## 3. DB action taken (targeted, idempotent, additive)

Applied the equivalent of migration `20260702000001` as a targeted PostgREST `PATCH` (no `supabase db push`), scoped to already-approved guides that were not yet available. `slug` was already present on both rows, so only `is_available` needed setting:

```
PATCH guide_profiles?verification_status=eq.approved&is_available=is.false
  { "is_available": true }
```

Idempotent (re-running matches 0 rows once repaired) and additive (only flips a visibility boolean; no deletes). Sanitized before/after:

| Metric | Before | After |
|---|---|---|
| approved AND `is_available=true` AND slug not null | 0 | **2** |
| live RPC `search_guides` rows | 0 | **2** |
| rows updated by PATCH | — | 2 |

## 4. Test / check results

- `bun run test:run "src/app/(site)/guides" src/data/supabase` → **41 passed / 41** (guide discovery, search, page render).
- Typecheck/lint/build: **N/A** — no repository source files changed. The already-deployed `origin/main` code is correct and unchanged.

## 5. Commit / merge / deploy status

- `origin/main` HEAD: `798657cc` — already contains the approval fix and the backfill migration `20260702000001`. No product-code commit or PR required.
- VPS `/opt/provodnik` HEAD: `798657cc` → **matches `origin/main`**.
- `systemctl is-active provodnik.service` → **active**
- `systemctl is-active caddy` → **active**
- No redeploy needed (data-only fix; deployed code was already correct).
- This report is committed on branch `worktree-guide-catalog-visibility-report` (draft PR) — docs only, no product code.

## 6. Live proof

- `GET https://vps.provodnik.app/guides` → HTTP 200, body shows **"Найдено 2 гида"** and two guide cards linking to `/guides/qa-guide-test-904cdd5c` and `/guides/жюль-верников-69f18040` (empty-state "Пока нет…" gone). Screenshot: `screenshots/guides-list-fixed.png`.
- `GET https://vps.provodnik.app/guides/qa-guide-test-904cdd5c` → HTTP 200, `<h1>QA Guide…</h1>` (guide profile, not 404).
- `GET https://vps.provodnik.app/guides/жюль-верников-69f18040` (Cyrillic, URL-encoded) → HTTP 200, `<h1>Жюль Верников</h1>` — encoded/Cyrillic slug resolves correctly.
- `GET https://vps.provodnik.app/guides?q=Жюль` → only the Жюль card; `?q=QA` → only the QA card (server-side search filter works).
- Negative control: `GET /guides/definitely-not-a-real-slug-xyz` → renders the 404 UI ("Страница не найдена") with **no** guide H1, confirming valid pages genuinely resolve. (The "Страница не найдена" string also present inside valid pages' RSC payload is the Next.js not-found boundary serialized into the flight data — not the displayed content.)

## 7. Remaining blockers / notes

- **No blockers.** Catalog is live and correct.
- **Ledger note (non-blocking):** migration `20260702000001_publish_approved_guides.sql` is present in `origin/main`/VPS but was never applied to the prod migration ledger. The data end-state is now correct, and the migration is guarded (idempotent), so re-application would be harmless. Left the ledger untouched per the "never `db push` on prod" landmine. If a future full migration replay is ever run, this file is safe.
- **Going forward:** new guide approvals set `is_available = true` (+ slug) in `performModerationAction`, so this class of stale-visibility rows will not recur from the normal approval flow.

## Tooling (Superpowers / Ponytail / Context7)

- **Superpowers (systematic-debugging):** enforced Phase-1 root-cause-before-fix. Instrumented the four RPC predicates individually against prod (counts + per-row role/account_status/slug/is_available) to isolate the single failing predicate (`is_available`) before touching anything — no guessing, one targeted change.
- **Ponytail:** climbed to the laziest correct rung. The catalog was fixable without a single code edit — the code, approval path, and backfill migration were all already correct and deployed; only prod data was stale. Fix = one idempotent visibility-boolean update on 2 rows. Explicitly rejected re-editing code, writing a new migration, or ledger surgery as unnecessary.
- **Context7:** available and considered for the two library-API questions (Next.js `searchParams` → dynamic rendering / cache freshness, Supabase RPC predicate semantics). Both were settled more strongly by direct live observation — `/guides` returns `cache-control: no-store` and reflected the data change on the next request — so no docs lookup would have changed the conclusion.

---

## Сводка для владельца (RU)

Каталог гидов на `https://vps.provodnik.app/guides` **починен**. ✅

- ✅ Причина: у обоих одобренных гидов стояло `is_available = false`, поэтому публичный поиск их скрывал (кроме этого флага всё было в порядке — статус, роль, slug).
- ✅ Что сделал: точечно и безопасно проставил `is_available = true` для одобренных гидов в проде (без `db push`, обратимо). Было видимых 0 → стало 2.
- ✅ Изменений в коде не потребовалось — нужный код уже был в `main` и на сервере; проблема была только в данных.
- ✅ Проверено вживую: `/guides` показывает 2 карточки («QA Guide Test», «Жюль Верников»), страницы гидов открываются (включая кириллический адрес), поиск по имени работает.
- ✅ Сервер и сервисы активны, код на сервере совпадает с `main`.
- ⚠️ Некритично: миграция `20260702000001` есть в репозитории, но исторически не была применена к проду — данные уже приведены в порядок вручную, миграция идемпотентна, риска нет.
