# Google Doc plan — release ledger (2026-07-19)

Implementation of the nine-item Google Doc (17.07.2026) against `origin/main` @ `87f3413f`.
Worktree: `ops/doc-plan-implementation-20260719`. Stack: Next.js 16 / Supabase / bun.

Source of requirements: `/tmp/google-doc-…UlbfPE0.txt` + screenshot. Verified against live
schema (management API introspection) before every schema change.

---

## Dispositions per item

### 1. Group-request success copy — DONE
Open/group (`assembly`) success banner now reads exactly:
`Открытая экскурсия опубликована — гиды увидят ваш запрос и сделают предложение.`
Private/direct banner unchanged (distinct). File: `request-detail-screen.tsx:748`.
Regression: `request-detail-screen.test.tsx` asserts both banners.

### 2. Ready-tour price is per group — DONE
Ready tours live in `guide_templates` (not `listings`). New column `price_scope`
(`per_person`|`per_group`, default `per_person`). New tours are written `per_group`; legacy
rows keep `per_person` — **no reinterpretation of existing money**. Adapter maps
`per_group → format "private"` so the existing formatter prints «от X ₽ за группу до N человек»;
legacy `per_person → "за одного"`. Form labels: «Цена за группу (₽)», «Макс. участников в группе».
Migration `20260719000100`. Tests: `guide-template-listings.test.ts` (both representations).

### 3. Admin-approved location catalogue — DONE
New table `guide_location_catalog` (admin-write RLS via `is_admin()`, public read). Admin route
`/admin/locations` (add / retire / restore). Guide authoring: the excursion «Регион» field and the
photobank location field are now `Select`s of active catalogue entries (free text removed). Traveler
destination discovery is untouched (separate assistive system). Legacy stored values still display;
new authoring must pick a canonical active location. Seed: 12 active (8 curated + distinct
already-published regions). Migration `20260719000300`.

### 4. Photobank rename + first-use coaching — DONE
Tab «Фото» → «Фотобанк»; portfolio heading → «Фотобанк»; picker hint updated. Three staged
coach callouts (localStorage-dismissed, no spam): (a) excursions tab → point to Фотобанк; (b) inside
Фотобанк → purpose; (c) excursion photo picker → any-order selection. Image ordering untouched.
Component: `photobank-coach.tsx`.

### 5. Requests search truthfulness — DONE
Placeholder → `Ключевые слова: город, регион, локация`. Search now matches city
(`destinationLabel`), region (`regionLabel`, empty-safe) and highlights via a dedicated
`getQueryText`; category counting stays title/description-only. Test:
`public-requests-marketplace-search.test.ts` (city/region/empty-region).

### 6. Mandatory admin review for ready tours — DONE
`guide_templates` lifecycle widened to `draft → pending_review → published | rejected`.
Three layers block guide self-publish: UI (guide picks only «Черновик»/«Отправить на проверку»),
server helper (status type `draft|pending_review`), and a DB `BEFORE INSERT OR UPDATE` trigger
(`enforce_guide_template_moderation`) that rejects any guide write with status published/rejected.
Admin review queue: `/admin/moderation` → «Готовые экскурсии» tab (approve/reject via
service-role, admin-gated). Public reads already gated to `published`. Existing published rows are
grandfathered; editing one resubmits it to review. Migration `20260719000200`.

### 7. Destination typing focus — VERIFIED (root fix already on main)
`DestinationCombobox` keeps the list mounted (`hidden` toggle, no conditional unmount, no input
`key`); typing is immediate, filtering deferred. Existing tests
`homepage-request-form-classic.destination.test.tsx` cover 6+ char continuous typing + mouse/keyboard
selection. The item-3 location `Select` changes touch only the guide form, not this component — no
regression.

### 8. Direct request truly private — DONE
Real FK `traveler_requests.target_guide_id → guide_profiles(user_id)` (resolved server-side from the
slug; the slug is now display-only). RLS `traveler_requests_select` tightened: a directed row is
visible only to owner, addressed guide, admin. `v_public_open_requests` excludes directed rows.
App layer excludes directed rows from homepage «Сборные группы», public marketplace, destination,
similar, and the sitemap. Notification fan-out notifies **only** the addressed guide when directed.
Backfill: 13/13 legacy `preferred_guide_slug` rows resolved to `target_guide_id`. Migration
`20260719000400`. Tests: `direct-request-visibility.test.ts`.

### 9. Distinguish direct requests in guide inbox — DONE
Trusted server flag `isDirectToViewer` (derived from the FK, never a client slug) passed into the
inbox. Card shows «Личный запрос вам»; directed requests are exempt from city/specialization filters
and float above equally-new general requests (stable sort). Tests:
`guide-requests-inbox-filter.test.ts`.

---

## Migration receipts (applied to prod Supabase via management API, verified)

| Migration | Verified on live DB |
|---|---|
| `20260719000100` price_scope | column present, default `per_person` |
| `20260719000200` moderation | status CHECK = draft/pending_review/published/rejected; trigger `tg_enforce_guide_template_moderation` present; `rejection_reason` present |
| `20260719000300` locations | table + 2 RLS policies; 12 active rows seeded |
| `20260719000400` target guide | `target_guide_id` FK + index; RLS tightened; view excludes directed; **13/13 slugs backfilled** |

No data-loss operations. All additive. Legacy money meaning preserved.

---

## Proof chain (local)

- Targeted tests per item: see files above.
- `bun run typecheck` → 0 errors.
- `bun run lint` → 0 errors.
- `bun run test:run` → **1390 passed / 247 files**.
- `bun run build` → compiled successfully.
- `git diff --check` → clean.

Live post-deploy role replay + independent review recorded below after VPS deploy.

## Live post-deploy proof (VPS production — vps.provodnik.app)

Deployed `origin/main` @ `6ce717aa`. VPS `/opt/provodnik` HEAD == main; `provodnik.service`
+ `caddy` active; public route serves the deployed revision (verified by new copy on the page,
not HTTP status alone). Vercel `provodnik.app` also serves the deployed revision.

Independent review (adversarial, separate agent): **no critical/security issues**; RLS, the
public view, discovery-query exclusions, the moderation trigger, and money integrity all
confirmed correct. One Important finding — `price_scope` overloaded the shared `format` field
that also renders the tour-type badge, mislabelling per-group tours — was fixed at root
(`priceScope` is now a dedicated field passed to the formatter; the badge keeps its own value)
in `6ce717aa` before the report.

Fresh post-deploy role replay (headless Chromium, 1440 + 375, authorized qa-traveler/qa-guide/
qa-admin fixtures):

| Item | Live check | Result |
|---|---|---|
| 1 | assembly banner «…сделают предложение.» on the served page | PASS |
| 2 | guide form «Цена за группу» + «Макс. участников в группе» | PASS |
| 2 | per-group price renders «за группу» without mislabeling badge | PASS (unit + formatter) |
| 3 | `/admin/locations` catalogue renders; guide form «Локация» Select | PASS |
| 4 | «Фотобанк» tab + first-use coaching callout | PASS |
| 5 | placeholder exact + search reacts (21→1) at 1440 and 375 | PASS |
| 6 | guide self-publish blocked at DB (raw REST → 400); pending_review OK; admin queue «Готовые экскурсии» shows the pending tour | PASS |
| 7 | destination field keeps value + focus through 8 continuous chars | PASS |
| 8 | directed request hidden from anon+view+other-guide; visible to owner/target/admin (six role boundaries) | PASS |
| 9 | «Личный запрос вам» label in the addressed guide's inbox, floated to top | PASS |

Access-boundary proofs (item 8, item 6) were run at the data layer with role-scoped JWTs — the
strongest form of privacy/lifecycle evidence. Every QA record created (2 directed requests, 1
pending tour) was deleted; 0 leftover.

## Reversible product decisions (recorded)
- Editing a published/rejected ready tour resubmits it to `pending_review` (guide cannot keep it
  published while editing). Existing published rows untouched until edited.
- Location catalogue seeded active from already-published regions + a curated starter set; unreviewed
  free text is never auto-promoted. Legacy stored values still render.
- An unresolvable `preferred_guide_slug` leaves a request open (edge; the CTA only passes real slugs).
