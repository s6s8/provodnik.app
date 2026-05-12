# SOT HOT

_Top 8 landmines orchestrator must never forget. Include the relevant one inline in every cursor-agent prompt that touches the affected area. Full entries in ERRORS.md / ANTI_PATTERNS.md / DECISIONS.md._

---

### AP-010 — TZ-naive calendar dates (server/client divergence)
**Never** compute a calendar date with `new Date().toISOString().slice(0,10)`. It's UTC-anchored; SSR (UTC container) and CSR in MSK diverge near midnight UTC → hydration mismatch + "yesterday" as min date.
**Always** pin TZ: `Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow' }).format(new Date())`. Use the single helper `todayMoscowISODate` in `src/lib/dates.ts`.

---

### AP-012 / ADR-013 — Currency crosses go through `src/data/money.ts`
**Never** inline `* 100` / `/ 100` or write `_minor` columns directly in feature code. A missed conversion made the entire wizard write path 100× too small (ERR-025).
**Always** use `rubToKopecks(rub)` / `kopecksToRub(kopecks)`. `grep '\* 100\|/ 100\|_minor'` should return zero hits outside `src/data/money.ts` and its direct consumers. Round-trip Vitest test guards the invariant.

---

### AP-014 / ERR-034 / ERR-036 — Client/server import boundary
**Never** import an async server component, or any **value** (not just type) from a server-only module, into a `'use client'` file. A single value import pulls the whole transitive module — including `next/headers` → 5-deploy Turbopack failure streak.
**Always** split shared constants/types into `*-types.ts` with zero server imports. Client imports from `*-types.ts`; server module imports + re-exports from `*-types.ts`. Pattern: `qa-threads-types.ts` (client-safe) + `qa-threads.ts` (server-only).

---

### ERR-025 — Wizard write paths must convert RUB → kopecks
**Never** write `budget_minor: input.budgetPerPersonRub` (or any `_minor` field) without calling `rubToKopecks`. Symptom: "от 50 ₽" on a 5000 ₽ request. See ADR-013.
**Always** run `rubToKopecks(input.budgetPerPersonRub)` on insert. Read side uses `kopecksToRub` for display.

---

### ADR-014 / ERR-029 — Registration is server-only via `signUpAction`
**Never** call browser `supabase.auth.signUp()` anywhere. Race: JWT mints before `handle_new_user()` trigger commits → `custom_access_token_hook` sees no role → white screen.
**Always** register via `signUpAction` (admin client): `createUser({ email_confirm: true })` → upsert `profiles` → stamp `app_metadata.role` → `signInWithPassword` — all server-side, all before JWT is returned.

---

### ADR-015 / ERR-030 — Logout goes through `/api/auth/signout`
**Never** call browser `supabase.auth.signOut()` as the primary logout. `@supabase/ssr` stores session in HTTP-only cookies; browser client can't clear them; middleware re-hydrates the session → logout appears to hang for minutes.
**Always** navigate to `/api/auth/signout` (GET route handler calls server-side `signOut()` + redirect). Use `window.location.href = '/api/auth/signout'`.

---

### ADR-010 — cursor-agent dispatch is ONLY via `cursor-dispatch.mjs`
**Never** spawn `cursor-agent.cmd` directly from Node or a subagent (Node v24 throws `spawn EINVAL`; see ERR-011, ERR-012). Never `cmd //c "cursor-agent.cmd ..."`.
**Always** dispatch via `node .claude/logs/cursor-dispatch.mjs <prompt-file.md> --workspace "D:\\dev2\\projects\\provodnik\\provodnik.app"`. The wrapper resolves `node.exe` + `index.js` from `cursor-agent\versions\<latest>` and streams `[init] → [tool_call] → [assistant] → [result]` live.

---

### ADR-011 — Slack dev-notes ONLY via `slack-devnote.mjs`
**Never** call `chat.postMessage` / `chat.update` directly, and never use deprecated `slack-post.mjs` / `slack-update.mjs` for dev-notes. Freeform composition drifts under load (jargon, wrong emojis, missing footer).
**Always** `node .claude/logs/slack-devnote.mjs <items.json> [--dry] [--force-new] [--ts=<ts>] [--manifest=<path>]`. The wrapper enforces forbidden-jargon blacklist, emoji whitelist, same-day merge, hours from git, block structure, footer. Use `--dry` first.

---

### ADR-022 — `bek-restart.flag` is archived, not a debug toggle
**Never** manually create or `del` the file `_archive/bek-frozen-2026-05-08/logs/restart.flag`. The bek daemon is retired (Phase 1, 2026-05-08) — the flag's only consumer is gone, but the path is referenced by archived bek code that should never be reactivated. Manual touches are noise at best, footguns at worst.
**Always** for a manual restart of the orchestrator on macmini: `ssh sshm "pm2 restart orch-provodnik"`. The bek-watchdog process is dead pm2 — replaced by the macmini orchestrator's pm2 entry (Phase 6.2, 2026-05-10). If you find yourself wanting to manually create or delete the flag: stop, the system you're thinking of is the orchestrator, not bek.

---

### ADR-025 / ERR-047 — cursor-agent prompts: no `git`/`bun`, ever
**Never** put `git`, `bun run`, or any shell command in a cursor-agent prompt on Windows. Even plain `git add` / `git commit` (no `cd` chain) hangs the whole agent loop until wrapper timeout. Plan 08 Task 1 v3 burned 600s on `git add -A && git commit -m "..."` after the agent had already finished its 5 file edits cleanly via native tools.
**Always** use the "no bash at all" hard rule in every prompt: cursor-agent uses only Read/Edit/Write/Glob/Grep. Orchestrator runs all git ops (branch, add, commit, push, merge) and all verification (typecheck, lint, build) from its own bash after the dispatch returns. Final commit message goes in the prompt for the orchestrator to copy-paste. cursor-agent's DONE report lists files edited + unexpected findings, never a commit SHA.

---

### HOT-NEW / Ревизия Бека — pre-DONE browser test (mandatory for any UI work)
**Never** declare a UI task DONE on the basis of `bun run typecheck` + `bun run lint` alone. A green build does not prove the page renders, the form submits, the spacing matches the spec, or the role-correct nav shows up. Plan 28-precursor (homepage spacing, 2026-04-29) was reported DONE while the actual gap on disk had only changed by a couple of pixels — Alex flagged the false report and recorded this rule.
**Always** before reporting DONE on any task that touches a live page or component:
1. Open the affected URL in a browser at **1280px** under the role that uses it (guest / traveler / guide / admin).
2. Open the same URL at **375px** when the page has any responsive behaviour.
3. For any form change: fill → save → reload → verify the persisted state.
4. Confirm console is clean (no red errors, no warnings tied to your edit).
5. Measure spacing/typography against the spec when the task is layout-related — DevTools Inspector or rule-based pixel measurement, not eyeballing.

If any check fails, the task is not DONE. No exceptions for "the typecheck is green" / "the lint is clean" / "the cursor-agent reported success." Green build ≠ working feature. The report register is **honest**: write what's broken, don't flatter yourself.

---

### HOT-NEW / SOS Бек — stuck protocol (mandatory when blocked)
**Never** silently work around a blocker, hack the spec, or report DONE while a block is unresolved. Hidden hacks compound; spec drift turns into product drift. If something inside Ревизия Бека fails and the cause is unknown or beyond your access, raise an SOS instead of pushing through.
**Always** when stuck on any task:
1. Post in the working chat: ping `@CarbonS8 + @six` together.
2. Use the four-line format:
   - **Что должен был сделать:** one sentence
   - **Что попробовал:** one sentence (every approach attempted)
   - **Где упёрся:** one sentence (the exact symptom + where it surfaces)
   - **Что нужно для разблокировки:** one sentence (named tool / access / decision)
3. Wait for a response. Do NOT report DONE while waiting. Do NOT substitute hacks. Do NOT widen scope to "fix" the blocker if the fix isn't in your authorisation.
4. After unblock, fold the resolution back into Ревизия Бека and verify in browser before DONE.

The SOS is a feature, not a failure. Better to ask once than to ship a hack three times.

- **grammY bot.command swallows hyphenated variants** (ERR-069 + ERR-070, hit twice). When registering bot.command("foo"), any sibling slash command like /foo-bar arrives as bot_command /foo + literal -bar. bot.command middleware does NOT bubble to bot.on(message) after the handler runs. Mitigation: re-dispatch the hyphenated variants through onTopicMessage at the TOP of the bot.command handler, before the main logic. Required for every multi-variant slash command prefix.

- **Telegram parse_mode required** (ERR-077). sendMessage without `parse_mode: 'HTML'` or `'MarkdownV2'` displays raw `**`, `|`, `#`, `---` chars to the user. New send sites with model output MUST use `markdownToTelegramHTML(text)` from `bot/lib/format-telegram.mjs` and pass `parse_mode: 'HTML'`. /think had this latent bug from Phase 9.x — easy to miss because plain ack messages render fine without parse_mode.

- **Telegram reactions are chat-specific** (ERR-076). `setMessageReaction` rejects with `REACTION_INVALID` for emoji outside the chat's allowed set. Universal-safe emoji: `👀 👍 👎 🔥 🎉 🤔`. ✅ ❌ work in some chats but NOT in provodnik's default config. Don't add new reactions without verifying against chat config — and never swallow setReaction errors silently (the helper now logs them).

- **FSM session spawn requires continuePipeline** (ERR-071). Any new ticket-spawn surface (/new, /fire, future surfaces) MUST follow the contract: `runIntake → save → sendMessage → continuePipeline(child.sessionId)`. Missing the final kick produces a silent ROUTE-state orphan that never advances. Audit against bot.mjs:onNew when adding new spawn paths.



### HOT-NEW / Live seed drift — audit-blocker class (P0)
**Never** assume documented seed credentials still work on the live environment before dispatching a multi-persona audit or any cursor-agent task that requires role-based login. The PPFS Stage 1 machine pass (2026-05-12) found that all four documented seeds (`traveler@ / guide@ / admin@` + test passwords) rejected on live, blocking every `/guide/*` and `/admin/*` route row — 29+ findings deferred to a re-walk.
**Always** before any audit or cursor-agent task requiring live login:
1. Test each required seed credential via a quick `/auth` login — confirm redirect to kabinet, not a credential-error toast.
2. If any seed rejects: raise SOS immediately (`@CarbonS8 + @six`). Do NOT proceed with a stale session or a non-SOT fallback account.
3. Unblock by deploying the seed migration to live, rotating passwords via Supabase admin API, or issuing self-issued test accounts with explicit role stamps (see PPFS Stage 2 QUEUE.md P0 row for open product question).
Affected surface: any ticket touching `/guide/*`, `/admin/*`, or authenticated traveler flows where persona identity must come from a documented seed account.




### PII-012 — Message body masking is VISUAL-ONLY; DB stores raw contact data
**Never** render `messages.body` from any Supabase query directly to a user-facing surface (page, API response, realtime callback, export) without passing through `maskMessageBodies` from `src/lib/pii/mask.ts`.
**Why it bites:** `maskMessageBodies` is applied at the display layer — the DB rows stay raw. Any new surface added after this ship (e.g. a new API route, a realtime subscription that renders messages, an admin panel, a PDF export) will leak phone numbers and emails unless the developer explicitly imports and calls `maskMessageBodies`. The function is generic (`<T extends { body: string }>`) so it works on any message-shaped array.
**Always** when adding any new code path that reads message rows: (1) import `maskMessageBodies` from `@/lib/pii/mask`, (2) wrap the query result before passing to render/JSON, (3) verify with `grep -n 'maskMessageBodies' src/app/...` that every surface is covered.




### HOT-NEW — Unguarded demo payment UI on traveler booking detail page
**Never** leave `<DemoModeBanner />` or `<MockPaymentButton />` in `src/app/(protected)/traveler/bookings/[bookingId]/page.tsx` without a `process.env.NODE_ENV !== 'production'` guard. Both components were shipped unconditionally (2026-05-13) and render in all environments, displaying «Это демо-режим. Транзакции имитируются, реальной оплаты нет.» and a fake payment button to real users. This is an ERR-002 redux in a financially sensitive flow.
**Always** wrap demo/stub payment UI in `{process.env.NODE_ENV !== 'production' && (...)}` per the NODE_ENV Guard Pattern (PATTERNS.md). Additionally, verify that `MockPaymentButton` receives a real `onClick` prop wired to the actual payment action before any production payment integration — the current page.tsx call site passes no `onClick`, making the button silently inert beyond showing a toast.
- **Files at risk:** `src/app/(protected)/traveler/bookings/[bookingId]/page.tsx`, `…/_components/demo-mode-banner.tsx`, `…/_components/mock-payment-button.tsx`
- **Precedent:** ERR-002 (demo bar visible in production — same class, same fix).

