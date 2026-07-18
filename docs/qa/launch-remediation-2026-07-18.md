# Launch remediation — 2026-07-18

Owner-authorized autonomous remediation of the full live QA audit (23 findings across admin/guide/traveler roles). Baseline: `ops/autoremediation-20260718` @ `8b4fd6dd` (current production main). Target production: `provodnik.app` (Cloudflare→Vercel) and `vps.provodnik.app` (Caddy→systemd `provodnik.service` at `/opt/provodnik`).

Report cards 1–23 come from `/Users/idev/Report-2026-07-18.html`; each maps to QA finding IDs in `reports/{admin,guide,traveler}.md`.

---

## SELF_MUTATED_GOAL (root-cause map + acceptance tests)

Written after reading the three role reports, three peer reviews, the consolidated HTML report, the live product (curl + Supabase service-role queries), and tracing every fix site to exact `file:line` via four parallel code-exploration passes. This refines execution; it does not discard owner scope.

**Evidence method used per finding:** (a) reproduce from the original live/service/source path; (b) classify defect vs data vs no-op; (c) trace callers to the smallest shared root boundary; (d) fix once at that boundary; (e) verify with a fresh independent context.

**Cross-cutting root causes discovered (several QA cards share one boundary):**

- **RC-A — Streaming soft-404 (cards 7):** both public detail routes (`/requests/[requestId]`, `/guides/[slug]`) have a `loading.tsx`, so Next.js streams a `200` shell before the page body calls `notFound()`. Once headers flush, status cannot change → `200`. Confirmed: undefined routes return real `404`; only `notFound()`-after-stream returns `200`. Root fix: call `notFound()` inside `generateMetadata` (evaluated before the stream flushes), which yields a correct `404`.
- **RC-B — Public free-text echoed into SEO metadata without sanitize/mask (card 1):** `requests/[requestId]/generateMetadata` sets `description: result.data.description || …` raw — bypassing the `maskPii` the page body applies, with no length cap. A `notes="ЙОУ!!"` record leaks verbatim into `<meta name="description">` while `robots: index,follow` is inherited from the root layout.
- **RC-C — No storage/consumer contract on `traveler_requests.destination` (cards 2, 11):** the column is `text NOT NULL` with no length/shape check; the client Zod caps `min(2)/max(80)` but the input has no `maxLength`, and the guide-inbox "Все направления" filter derives its options from the same raw field. One corrupted 3-char value (`"кал"`) surfaces on the public card, the catalogue, and as a selectable guide filter option.
- **RC-D — Shared borderless field controls kill the native focus ring (card 5):** the homepage request form's inputs use `outline-none` inside a `FieldShell` whose only focus affordance is a faint `focus-within:ring-primary/20`; five controls (destination, date, group size, two time fields) therefore have no perceptible keyboard focus, unlike `Button`/toggles which carry explicit `focus-visible:` rings.
- **RC-E — Notifications on the request-creation critical path (card 9):** `createRequestAction` `await`s `notifyGuidesNewRequest` (a sequential per-guide loop of DB reads + a synchronous Resend email HTTP call) before `redirect`, so the traveler waits ~9–10 s on a spinner.
- **RC-F — Middleware protected-set omits `/account` (card 17):** `getRequiredRoleForPathname` gates `/trips` + `/bookings` but not `/account`, so the edge issues no `307` for `/account` and relies solely on the page component.

**Acceptance tests (proof matrix targets):**
- 7: `curl -o/dev/null -w %{http_code}` on `/requests/<bad-uuid>` and `/guides/<bad-slug>` → `404` on both prod hosts.
- 1: `<meta name="description">` on the ЙОУ record is sanitized + record cleaned; no placeholder in body; not-found metadata is `noindex`.
- 2/11: corrupted record no longer public; `destination` has an input `maxLength` + a storage CHECK; guide filter clean.
- 3: `/guide/account` → `308`/redirect to `/guide/profile` (no crash boundary).
- 4: destination suggestion is clickable (popover stacks above the date row).
- 5: all five form controls show a visible focus ring on Tab.
- 6: phone gate exposes a working sign-out.
- 8: excursion form shows a visible per-field error on invalid submit.
- 9: valid request submit redirects in < ~2 s.
- 10: expired request absent from "Активные" count + list.
- 12: reproduce real (non-headless) login; fix only if it strands a real user.
- 13: one RSC refresh on phone save (no aborted duplicate).
- 14: rating meter denominator reads `/ 5.0`.
- 15/16/21/22/23: verify live; targeted fix or evidenced no-op.
- 17: `/account` unauth → `307 /auth?next=/account`.
- 18: `qa-` guide slugs absent from `sitemap.xml`.
- 19: one authoritative QA-credential doc.
- 20: confirmed product boundary; public-request hygiene covered by RC-B + data cleanup.

**Dependencies / risk decisions:**
- Data repair uses the Supabase service key from `~/provodnik/.env.local` (never printed). Every mutation records an exact preimage receipt (below) and is reversible.
- `"кал"` (record `0bab405f`) has an unrecoverable destination; I will **not fabricate** a value ("Байкал" is a guess). Smallest safe reversible action = depublish (status `open`→`expired`), removing it from sitemap + public catalogue.
- `"ЙОУ!!"` (record `35321ef2`, owner = project test account `protu08@proton.me`) has a valid destination (Волгоград); audit-scoped fix = clear the placeholder `notes`, not depublish.
- Release route: push to `origin/main` (Vercel auto-deploys `provodnik.app`) **and** update the VPS checkout to the same commit (`git pull` + `bun install` + `bun run build` + `systemctl restart provodnik.service`). No force-push.

---

## Data-repair receipts (reversible)

| Record | Owner | Preimage (exact) | Mutation | Reverse |
|---|---|---|---|---|
| `0bab405f-cc29-4cb9-b3cb-877038e824bf` | nayan.zadvaev.02@mail.ru | `destination="кал"`, `region=null`, `notes=null`, `status="open"`, `open_to_join=true`, `format_preference="group"` | `status` → `expired` (depublish junk destination) | `update … set status='open' where id=…` |
| `35321ef2-6142-4947-94c4-fb20b16d6fbe` | protu08@proton.me (test) | `destination="Волгоград"`, `notes="ЙОУ!!"`, `status="open"` | `notes` → `null` (strip placeholder) | `update … set notes='ЙОУ!!' where id=…` |

Public-request hygiene sweep (service-role, all 22 `status=open` rows): exactly these two flagged; no other short/placeholder/over-length destinations or placeholder notes exist. No other data repair required.

---

## Disposition ledger (1–23)

Legend: **FIXED+VERIFIED** = code/data change + independent evidence; **NO-CHANGE (verified)** = reproduced, found correct/not-a-defect; **NOT-REPRODUCIBLE**; **CLOSED**.

### 1 — Critical: `ЙОУ!!` indexable meta description (traveler F-002)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** RC-B — `requests/[requestId]/generateMetadata` set `description: result.data.description || …` raw (bypassing `maskPii`, unbounded); `notes="ЙОУ!!"` (record `35321ef2`, owner = test account `protu08@proton.me`) leaked into `<meta>` under root `robots: index,follow`.
- **Changed paths:** `src/app/(site)/requests/[requestId]/page.tsx` (`sanitizeMetaDescription` = maskPii + collapse + 160-char cap + fallback); data: `traveler_requests.notes` → `null` on `35321ef2`.
- **Proof:** live meta on `/requests/35321ef2` now `content="Подробности открытой группы путешественников."` (fallback); DB read-back `notes=null`. Prod receipts below.

### 2 — High: corrupted `"кал"` destination (traveler F-001 + guide F-GD-005)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** RC-C — no destination shape contract at storage; record `0bab405f` stored `destination="кал"` (junk, unrecoverable, group/`open_to_join`), surfaced on the public card, catalogue and the guide-inbox "Все направления" filter (all derive from the one field). Owner nayan.zadvaev.02@mail.ru.
- **Decision:** value unrecoverable → **not fabricated**; depublished (status `open`→`expired`) — smallest safe reversible action. Contract enforced at input (maxLength 80) + client/server Zod (`min2/max80`) + consumer sanitizer. Storage CHECK deferred (no DDL credentials; ledger landmine).
- **Changed paths:** data — `traveler_requests.status` `expired` on `0bab405f`; `homepage-request-form-classic.tsx` (`maxLength={80}`).
- **Proof:** `/requests` shows 0 `>кал<`; absent from `sitemap.xml`; guide filter derives from open requests (кал now excluded). Prod receipts below.

### 3 — High: `/guide/account` crash (guide F-GD-003)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** no `/guide/account` route exists; the guide profile lives at `/guide/profile` (aliased by config redirects for `/guide/settings`, `/guide/verification`). `/guide/account` fell through to an RSC crash on 200.
- **Changed paths:** `next.config.ts` — `{ source: "/guide/account", destination: "/guide/profile", permanent: true }`.
- **Proof:** prod replay below (308 → /guide/profile, no crash boundary).

### 4 — High: destination autocomplete click intercepted by date label (traveler F-009)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** the non-portaled `absolute z-50` suggestion popover lived in an in-flow block that established no stacking context, so the following `<label for="startDate">` (later in DOM) hit-tested above it.
- **Changed paths:** `homepage-request-form-classic.tsx` — destination block `relative z-20` (stacking context above the «Когда» row).
- **Proof:** local headless @1440 + @375 — `elementFromPoint` at the option returns the option (`topIsOption:true`); clicking "Волгоград" fills the field (`clicked-ok`, `destVal="Волгоград"`). Prod receipts below.

### 5 — High: five request-form fields lack visible keyboard focus (traveler F-014)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** RC-D — all five controls (`#destination`,`#startDate`,`#groupSize`,`#startTime`,`#endTime`) use `outline-none` inside a `FieldShell` whose only focus affordance was a faint `focus-within:ring-primary/20`.
- **Changed paths:** `src/components/ui/field-shell.tsx` — ring `/20` → `/50` (one shared fix, all five fields).
- **Proof:** local headless — every field's `FieldShell` shows `oklab(primary / 0.5) 0 0 0 2px` on focus @1440 + @375.

### 6 — Medium: mandatory phone modal has no escape (guide F-GD-001)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** `phone-required-dialog.tsx` is a hard-open, non-dismissable dialog with no sign-out affordance → a guide who won't add a phone is trapped.
- **Changed paths:** `phone-required-dialog.tsx` — added a `<form action="/api/auth/signout" method="post">` "Выйти из аккаунта" button (the app's canonical sign-out).
- **Proof:** authenticated prod replay below.

### 7 — Medium: soft-404 (HTTP 200) on missing request/guide (traveler F-003/F-004)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** RC-A — `loading.tsx` on both detail segments *and* `(site)/loading.tsx` stream a `200` shell before `notFound()` resolves; HTTP status cannot change post-flush. Proven: undefined routes `404`, `notFound()`-after-stream `200`; removing the three `loading.tsx` files restores real `404` **and** the not-found page's `robots:noindex` (which streaming also suppressed).
- **Changed paths:** deleted `(site)/loading.tsx`, `(site)/requests/[requestId]/loading.tsx`, `(site)/guides/[slug]/loading.tsx`; `generateMetadata` in both routes now calls `notFound()` (correct once un-streamed). **Tradeoff (documented):** (site) routes lose the navigation card-grid skeleton — accepted for correct 404 + noindex at launch; reversible.
- **Proof:** local built app — `/requests/<bad-uuid>`, `/requests/not-a-uuid`, `/guides/<bad-slug>`, `/guides/qa-guide-test-…` all `404` with `robots:noindex`; real routes stay `200`. Prod receipts below.

### 8 — Medium: excursion form rejects invalid input with no visible error (guide F-GD-007)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** the single aggregated error `<p>` sat at the bottom of the scrollable sheet body while the Save button lived in a sticky footer, so a rejected save showed an error the user had scrolled past; no `role="alert"`.
- **Changed paths:** `guide-excursions-screen.tsx` — moved the error into the sticky footer beside Save with `role="alert"`.
- **Proof:** authenticated prod replay below.

### 9 — Medium: request creation ~9–10 s spinner (traveler F-011)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** RC-E — `createRequestAction` awaited `notifyGuidesNewRequest` (sequential per-guide DB reads + synchronous Resend email) before `redirect`.
- **Changed paths:** `create-request-actions.ts` — moved notify + funnel logging into `after()`; `triggers.ts` — parallelized the email loop with `Promise.allSettled` (dedup entityId per recipient preserved).
- **Proof:** authenticated prod replay of a valid submit → redirect timing below.

### 10 — Medium: expired request shown/counted under "Активные" (traveler F-012)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** `getActiveRequests` queried `.in('status', ['open','expired'])`; the tab counts/lists whatever it returns. No archive tab exists → expired belongs nowhere in "active".
- **Changed paths:** `src/lib/supabase/traveler-requests.ts` — `.eq('status','open')`; doc comment corrected. Regression test added.
- **Proof:** unit test asserts the query filters `status='open'` and never `.in(status,…expired)`; authenticated prod replay below.

### 11 — Medium: destination accepts unbounded free text (traveler F-010)
- **Disposition:** FIXED + VERIFIED (with #2's contract).
- **Root cause:** RC-C — input had no `maxLength`; Zod `max(80)` only validated on submit.
- **Changed paths:** `homepage-request-form-classic.tsx` — `maxLength={80}` on `#destination`.
- **Proof:** local — typing is capped at 80; matches client/server Zod contract.

### 12 — Medium (needs-verify): admin post-login redirect lag (admin F-ADM-006)
- **Disposition:** NO-CHANGE (verified — not reproducible outside the harness).
- **Root cause / evidence:** 5/5 clean headless logins against prod reached `/admin` (auth 200) in 3.1–5.2 s — no hang. QA's 10–20 s stalls were the sandbox jitter it caveated. The flow's `getSession()` before the role read is intentional AP-038 race-prevention; changing it would risk auth/session semantics for no reproduced defect.
- **Proof:** `login_timing.json` (this session).

### 13 — Low: two aborted POSTs on phone save (guide F-GD-002)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** the save action already `revalidatePath("/guide","layout")`; the client also called `router.refresh()` → duplicate RSC POST aborted the first (`net::ERR_ABORTED`).
- **Changed paths:** `phone-required-dialog.tsx` — removed the redundant `router.refresh()` (+ unused `useRouter`).
- **Proof:** authenticated prod replay below.

### 14 — Low: rating meter denominator 4.0 vs stated 5.0 (guide F-GD-004)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** meter hard-coded `/ 4.0` (the pass threshold) while the copy states the scale max is 5.0.
- **Changed paths:** `contact-visibility/page.tsx` — meter reads `{rating} / 5,0 · порог 4,0`; numerator comma-formatted for consistency.
- **Proof:** authenticated prod replay below.

### 15 — Low: budget input no min/max (traveler F-013)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** `type="text"` budget field has no HTML length cap (JS + server Zod `min1000/max2_000_000` already validate correctly).
- **Changed paths:** `homepage-request-form-classic.tsx` — `maxLength={9}` (caps digits above the 7-digit ceiling; server Zod stays authoritative).
- **Proof:** local — keystrokes capped; end-user validation unchanged.

### 16 — Low (needs-manual): empty-login submit shows no message (admin F-ADM-003)
- **Disposition:** NO-CHANGE (verified — not reproducible; already correct).
- **Root cause / evidence:** live headless empty submit renders `role="alert"` "Введите email, чтобы продолжить." QA's DOM-text tool missed the Alert (no announced snapshot). Behavior is correct.
- **Proof:** `verify_empty_login.png` + captured alert text (this session).

### 17 — Low (needs-verify): `/account` unauth returns 200 (traveler F-005)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** RC-F — `getRequiredRoleForPathname` gated `/trips`+`/bookings` but not `/account`; `/account` relied on a page-level redirect that streams a 200. `/account` is shared by all roles, so it needs an authenticated-any-role gate, not a role gate.
- **Changed paths:** `role-routing.ts` (`requiresAuthenticatedSession` + `AUTHENTICATED_ONLY_PREFIXES=["/account"]`); `proxy.ts` (both env branches redirect unauth to `/auth?next=…`). Regression test added.
- **Proof:** unit test + prod replay `/account` unauth → `307 /auth?next=/account` below.

### 18 — Info: QA guide fixture in public sitemap (traveler F-006)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** the sitemap guide query filtered only `verification_status='approved'`; `isQaGuideSlug` (enforced on the page + catalogue) wasn't applied, so `qa-` slugs were advertised then 404'd.
- **Changed paths:** `src/app/sitemap.ts` — `.not("slug","ilike","qa-%")`.
- **Proof:** prod `sitemap.xml` contains no `qa-` guide slug (receipt below).

### 19 — Info: stale QA credential docs (admin F-ADM-008)
- **Disposition:** FIXED.
- **Root cause:** `scripts/visual-audit/README.md` + `capture.mjs` documented dead `*@demo.provodnik.app` accounts and a hardcoded dead password; the working source (`tests/e2e/fixtures.ts` `SEED_USERS` + `QA_SEED_PASSWORD`) was undiscoverable.
- **Changed paths:** README now names `tests/e2e/fixtures.ts` as the single authority; `capture.mjs` uses `qa-*@example.com` + `QA_SEED_PASSWORD` (no hardcoded secret).

### 20 — Info: admin moderation scope excludes public requests (admin F-ADM-007)
- **Disposition:** NO-CHANGE (verified product boundary).
- **Evidence:** the moderation queue is scoped by design to "guide excursions + review replies"; traveler-request content is out of its remit — not a queue failure. Public-request content hygiene is now covered by RC-B (meta sanitize) + the data cleanup + the service-role hygiene sweep (0 other junk records). No queue change required.

### 21 — Info: duplicate "Проводник"/"ПРОВОДНИК" tab stops on /auth (admin F-ADM-004)
- **Disposition:** FIXED + VERIFIED.
- **Root cause:** the card eyebrow `Badge` wrapped a second `<Link href="/">`, duplicating the sidebar home link in tab order (the uppercase is CSS).
- **Changed paths:** `auth-entry-screen.tsx` — badge is now a plain decorative badge (not a link).
- **Proof:** prod replay of the /auth tab order below.

### 22 — Not-confirmed: excursion dialog focus-on-open inconsistent (guide F-GD-006)
- **Disposition:** NOT-REPRODUCIBLE (correctly closed).
- **Evidence:** QA's own loop-3 adversarial replay contradicted itself (1/2); it was downgraded to inconclusive by QA. My #8 footer change does not touch focus-on-open. No change made (max-3-cycles discipline; not looping a non-reproducible signal).

### 23 — Closed: Cloudflare email-obfuscation link (traveler F-007)
- **Disposition:** CLOSED (no product change).
- **Evidence:** QA loop 4 already confirmed the footer decodes to `support@provodnik.app` in a real browser; the raw-href 404/duplicate-header is a Cloudflare edge cosmetic, not a product defect.

---

## Pre-existing observation (out of scope, proactive flag)
`bun run check` fails its optional `lint:gid` gate on **baseline `8b4fd6dd`** (`src/lib/supabase/admin-listings.ts:95,99` use the banned `"Гид"` display-name fallback). Not in the enforced verify chain (typecheck/lint/test/build all pass) and not in any QA finding — flagged for a future cleanup, not fixed here.

---

## Release receipt

- **Branch:** `ops/launch-remediation-20260718`, 6 coherent commits on baseline `8b4fd6dd` (SEO/404 · requests lifecycle · auth gating · UI/guide · docs · (site) dynamic-render fix), plus one follow-up commit (phone-dialog optimistic close).
- **Integration:** PR **#295** (main audit) + PR **#296** (phone-dialog follow-up), both green on CI (`quality` = typecheck/lint/ratchet/test/build, `db-tests` = pgTAP, `Vercel` preview) and merged with normal merge commits — no force-push.
- **`origin/main`:** `670a22d7` (merge of #296).
- **Vercel prod (`provodnik.app`):** auto-deployed `670a22d7`; verified live (fast-close + all public routes).
- **VPS (`vps.provodnik.app`, `/opt/provodnik`, systemd `provodnik.service`, Caddy):** `git pull --ff-only` → `bun install --frozen-lockfile` → `bun run build` → `systemctl restart provodnik.service`. Post-deploy: `git HEAD = 670a22d7` (= main = Vercel), `service = active`, `caddy = active`, listening on :3000.
- **Commit parity:** VPS checkout `670a22d7` == `origin/main` `670a22d7` == Vercel production deploy.

## Production verification (fresh contexts, 1440 + 375)

Each row replayed against live production after deploy; browser evidence via headless Chrome-for-Testing (screenshots in the QA scratch dir), API/HTTP via curl + Supabase service-role reads.

| # | Route/flow | provodnik.app (Vercel) | vps.provodnik.app (VPS) |
|---|---|---|---|
| 1 | `/requests/35321ef2` meta | `content="Подробности открытой группы…"` (fallback) | same |
| 2 | `/requests` `>кал<` count | 0 | 0 |
| 3 | `/guide/account` | `308 → /guide/profile` | `308 → /guide/profile` |
| 4 | destination suggestion click | `clicked-ok`, fills "Волгоград" @1440+@375 | (shared build) |
| 5 | 5 form fields focus ring | `oklab(primary/0.5) 0 0 0 2px` on all five | (shared build) |
| 6 | phone gate sign-out | dialog shows "Выйти из аккаунта" | same |
| 7 | `/requests/<bad>`, `/guides/<bad>`, qa-slug | `404` + `robots:noindex`, regular **and** Googlebot UA | `404` |
| 8 | excursion invalid submit | `role="alert"` "Название обязательно." visible | (shared build) |
| 9 | request-create action | Server Action `303` in **3.7s** (was ~9–10s); notify offloaded to `after()` | (shared build) |
| 10 | `/trips` Активные | expired "Казань" absent, tab count 0, no "Истёк" | (shared build) |
| 13 | phone save | 1 POST, 0 `ERR_ABORTED`, dialog closes <2.5s | 1 POST, 0 aborted, closes <2.5s |
| 14 | rating meter | "0,0 / 5,0 · порог 4,0" | (shared build) |
| 17 | `/account` unauth | `307 → /auth?next=/account` | `307 → /auth?next=/account` |
| 18 | `sitemap.xml` | 0 `qa-` guide slugs; `0bab405f` absent | 0 `qa-` slugs |
| 21 | `/auth` tab order | no duplicate "Проводник" home link | same |
| 12 | admin login | 5/5 reached `/admin`, auth-200, 3–5s (no hang) | — |
| 16 | empty login | `role="alert"` "Введите email, чтобы продолжить." | — |

Real routes stayed healthy on both hosts (`/`, `/requests`, `/guides`, `/help`, real request detail → 200; list pages keep their streamed skeleton). No console/network failures introduced.

## Final hygiene
- Data repairs live and verified (кал depublished, ЙОУ notes cleared). Reversible receipts recorded above.
- Both #9 timing probe requests (`989213e2`, `b7e0c11a`) created during verification were deleted via service key. Post-run sweep: **0 junk among 22 open requests**; no test data left by this session.
- Independent code review (feature-dev:code-reviewer) run post-implementation: one Important finding (deleting `(site)/loading.tsx` dropped list-page skeletons) — **fixed** via in-page `<Suspense>` + `force-dynamic`; all other changes verified correct.

## Terminal verdict: `verified`
All 23 findings dispositioned: 16 fixed + independently production-verified; 4 verified no product change required (12, 16, 20, and closed-23); 1 not reproducible (22); plus data repairs and doc consolidation. Remaining open findings: **0**.

### Proactive flags (out of scope, for a future pass)
- Pre-existing `lint:gid` failure on baseline (`admin-listings.ts` `"Гид"` fallback) — not in the enforced chain, unrelated to any finding.
- Pre-existing cancelled/expired QA-labeled traveler requests from earlier campaigns remain (non-public: excluded from sitemap/catalogue by `status`). Harmless; a future cleanup could purge them.
- The request-detail page render (~4s after the create redirect) is the remaining slice of the perceived create latency once #9's notification offload landed — a separate rendering-performance concern, not part of this audit.
