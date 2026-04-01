# BACKLOG — Staged Features

> Features planned but not yet implemented. Each entry is a Codex-ready spec.
> When ready to implement: copy the entry's Codex prompt and fire it.
> Status: `staged` → `in-progress` → `done`

---

## Template

```
### FEAT-XXX — Title
**Status:** staged
**Filed:** YYYY-MM-DD
**Why:** one-line motivation

**What it does:** ...

**Files to touch:**
- ...

**Acceptance criteria:**
- ...

**Codex prompt:**
\`\`\`
...
\`\`\`
```

---

## Staged

### FEAT-001 — Hide "Войти" nav button when user is already logged in
**Status:** staged
**Filed:** 2026-03-31
**Why:** Logged-in users see a "Войти" (Login) link in the public SiteHeader nav — redundant and confusing when a session is active.

**What it does:**
The SiteHeader shows "Войти" and "Создать запрос" CTAs on the right. When a user is authenticated (via Supabase session), hide "Войти" and optionally replace it with an avatar/profile link or nothing. "Создать запрос" stays visible for logged-in users.

**Files to touch:**
- `src/components/shared/site-header.tsx` — make it auth-aware
- `src/lib/auth/server-auth.ts` — already has `readAuthContextFromServer()`, use it
- `src/app/layout.tsx` or wherever SiteHeader is rendered — pass auth prop if needed

**Constraints:**
- SiteHeader is `"use client"` currently (uses `usePathname`). Options:
  a) Keep client component, use Supabase browser client to read session
  b) Convert to Server Component, pass auth as prop — cleaner
- Do not flash "Войти" on load then hide it (avoid layout shift). Server-side is preferred.
- CSS: no per-component `<style>` blocks. All styles in `globals.css`.
- Use existing `readAuthContextFromServer()` from `src/lib/auth/server-auth.ts`.

**Acceptance criteria:**
- Logged-in user: "Войти" link absent from nav
- Logged-out user: "Войти" link present as before
- No flash/layout shift on page load
- "Создать запрос" visible regardless of auth state
- `bun run build` passes

**Codex prompt:**
```
Read D:\dev\projects\provodnik\provodnik.app\AGENTS.md first.
Workspace: D:\dev\projects\provodnik\provodnik.app

Before writing any code, read:
- D:\dev\projects\provodnik\DESIGN.md
- C:\Users\x\.agents\skills\superpowers\systematic-debugging\SKILL.md
- C:\Users\x\.agents\skills\superpowers\verification-before-completion\SKILL.md

## Task: Hide "Войти" from SiteHeader when user is logged in

Read these files in full before touching anything:
1. src/components/shared/site-header.tsx
2. src/lib/auth/server-auth.ts  (readAuthContextFromServer)
3. src/lib/auth/types.ts         (AuthContext type)
4. src/app/(protected)/layout.tsx  (see how auth is read and passed)
5. src/app/globals.css

The SiteHeader currently always renders a "Войти" link and a "Создать запрос" link.
When a user is authenticated, "Войти" is redundant — hide it.

Approach:
- SiteHeader is "use client" (needs usePathname). Keep it client but add an optional
  `isAuthenticated: boolean` prop.
- Wherever SiteHeader is rendered (find all call sites via grep), pass `isAuthenticated`
  from the server auth context. If SiteHeader is rendered in a Server Component context,
  call readAuthContextFromServer() there and pass auth.isAuthenticated down.
- In SiteHeader: render "Войти" only when `!isAuthenticated`.
- Do NOT use useEffect + client-side session check — that causes a flash. Server-side prop is required.
- "Создать запрос" always visible.
- No new CSS needed.

Acceptance:
1. Logged-in user: "Войти" absent from nav
2. Logged-out user: "Войти" present
3. No flash on load
4. bun run build passes
5. bun run typecheck passes

ACCEPTANCE: bun run build passes. Do NOT push — commit only.
```

---
