# Task: Signup — skip email confirmation, log user in immediately (Option A, MVP)

## Persona

Strict/mechanical. Follow spec exactly. No creativity, no extras, no refactors outside scope.

## Problem

Current signup at `/auth` calls `supabase.auth.signUp()` in the browser. Supabase tries to send a confirmation email via its built-in SMTP (not configured) → users see **"Error sending confirmation email"** and registration is blocked — Биржа launch blocker.

**MVP fix (decided by product):** skip email confirmation entirely. Server action creates the user pre-confirmed via `admin.auth.admin.createUser({ ..., email_confirm: true })`. Client then signs in with the same password to establish session. No email is sent. Trade-off accepted: no proof of email ownership — fine for MVP.

## Environment

- Working directory (absolute, your cwd): `D:\dev2\projects\provodnik\.claude\worktrees\signup-email-fix`
- Branch: `fix/signup-email`
- Package manager: **npm** (`package-lock.json`)
- Framework: Next.js App Router
- Typecheck: `npx tsc --noEmit` (do NOT run `npm run build` — may OOM on Windows)
- Do not install new packages. Everything needed is already installed: `@supabase/supabase-js`, `@supabase/ssr`.

## Scope

**Files to CREATE:**

1. `src/app/(auth)/auth/signup/actions.ts` — server action for signup

**Files to MODIFY:**

2. `src/features/auth/components/auth-entry-screen.tsx` — replace `supabase.auth.signUp(...)` call with server action + client sign-in

**Out of scope — DO NOT TOUCH:**

- `src/app/(auth)/forgot-password/actions.ts`
- `src/app/(auth)/auth/confirm/route.ts`
- `src/lib/supabase/admin.ts`, `src/lib/supabase/client.ts`, `src/lib/email/resend-client.ts`
- Database schema, migrations, `profiles` table triggers
- Any other auth flow (sign-in, forgot-password, update-password)
- Role routing / `resolveDashboardPathForUser` logic
- Any other file

## Context — existing patterns you MUST follow

### Pattern A — forgot-password action (reference for server-action shape, error message style)

`src/app/(auth)/forgot-password/actions.ts`:

```typescript
"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/email/resend-client";
import { getSiteUrl } from "@/lib/env";

export type ForgotPasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendPasswordResetEmail(email: string): Promise<ForgotPasswordResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "Введите email." };

  try {
    const admin = createSupabaseAdminClient();
    // ... uses admin.auth.admin.generateLink(...)
  } catch {
    return { ok: false, error: "Не удалось отправить письмо. Попробуйте позже." };
  }
}
```

Mirror: `"use server"`, import `createSupabaseAdminClient`, exported result union type, Russian error messages, trimmed/lowercased email, `try/catch` returning generic error.

### Pattern B — current signup code to replace

`src/features/auth/components/auth-entry-screen.tsx` — the signup branch (block starting at `const { data, error: signUpError } = await supabase.auth.signUp({` through `router.refresh();` immediately before the `} catch`). Read the file first to get exact line numbers — they shift as the file evolves.

That block currently:
1. Calls `supabase.auth.signUp({ email, password, options: { data: { full_name, role } } })` client-side
2. Handles error (localizer `getFriendlyAuthError`)
3. If `!data.session` → sets `success` state, switches to `sign-in` mode, returns
4. If `data.session` → resolves dashboard path, `router.replace(path)`, `router.refresh()`

After the change: server action returns `{ ok, error }`. On `ok`, client calls `supabase.auth.signInWithPassword({ email, password })` with the same credentials, then (always, since email is pre-confirmed) session exists → resolve dashboard path → `router.replace(path)` → `router.refresh()`.

## Task — numbered steps

### Step 1 — Read everything in your scope before touching anything

Read these files in full:

- `src/app/(auth)/forgot-password/actions.ts`
- `src/features/auth/components/auth-entry-screen.tsx`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/client.ts`
- `src/lib/env.ts` (confirm `getSiteUrl`, `hasSupabaseAdminEnv`, `serverEnv`, `clientEnv` exports exist — but you only need `createSupabaseAdminClient` for this task)

If any path doesn't exist — STOP and report, do not invent paths.

### Step 2 — Create `src/app/(auth)/auth/signup/actions.ts`

Use this implementation verbatim:

```typescript
"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SignUpResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  fullName: string;
  role: "traveler" | "guide";
}): Promise<SignUpResult> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const password = input.password;

  if (!email) return { ok: false, error: "Введите email." };
  if (!password) return { ok: false, error: "Введите пароль." };
  if (password.length < 6) {
    return { ok: false, error: "Пароль слишком короткий. Используйте не менее 6 символов." };
  }
  if (!fullName) {
    return { ok: false, error: "Укажите имя, которое нужно сохранить в профиле." };
  }
  if (input.role !== "traveler" && input.role !== "guide") {
    return { ok: false, error: "Недопустимая роль профиля." };
  }

  try {
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: input.role,
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists") ||
        msg.includes("duplicate")
      ) {
        return {
          ok: false,
          error: "Этот email уже зарегистрирован. Войдите в существующий аккаунт или используйте другой адрес.",
        };
      }
      if (msg.includes("password")) {
        return { ok: false, error: "Пароль слишком короткий. Используйте не менее 6 символов." };
      }
      return { ok: false, error: "Не удалось создать аккаунт. Попробуйте позже." };
    }

    const userId = data.user?.id;
    if (!userId) {
      return { ok: false, error: "Не удалось создать аккаунт. Попробуйте позже." };
    }

    return { ok: true, userId };
  } catch {
    return { ok: false, error: "Не удалось создать аккаунт. Попробуйте позже." };
  }
}
```

### Step 3 — Modify `src/features/auth/components/auth-entry-screen.tsx`

1. Add this import (group with the other `@/` imports at the top):

```typescript
import { signUpWithEmail } from "@/app/(auth)/auth/signup/actions";
```

2. Replace the signup branch (the block from `const { data, error: signUpError } = await supabase.auth.signUp({` through `router.refresh();` immediately before the `} catch`) with:

```typescript
      const signUpResult = await signUpWithEmail({
        email: trimmedEmail,
        password,
        fullName: trimmedFullName,
        role,
      });

      if (!signUpResult.ok) {
        setError(signUpResult.error);
        return;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError || !signInData.user) {
        setError(getFriendlyAuthError(signInError));
        return;
      }

      const dashboardPath = resolveDashboardPathForUser(signInData.user);
      setPassword("");
      router.replace(dashboardPath);
      router.refresh();
      return;
```

**Leave EVERYTHING ELSE in this file unchanged** — imports (except the added one), sign-in branch, render JSX, `resolveDashboardPathForUser`, `getFriendlyAuthError`, form fields, error display, role selector, `success` state. Only the signup branch body changes.

Notes:
- `trimmedEmail`, `trimmedFullName`, `password`, `role` are existing local variables in the submit handler — use the exact names that file already uses. If names differ, match them; do not rename.
- `supabase` is the existing `createSupabaseBrowserClient()` instance in the component. Reuse it.
- Do NOT add `await router.refresh();` — just call it like the existing code does.

### Step 4 — Verify

Run from the worktree root:

```bash
npx tsc --noEmit
```

Must pass with zero new errors. If errors exist only in your new/modified files, fix them. If there are pre-existing errors in unrelated files, report them but do NOT attempt to fix them.

### Step 5 — Commit

One commit on `fix/signup-email` branch:

```
fix(auth): skip email confirmation, sign user in on registration

Supabase default SMTP was unconfigured, causing "Error sending
confirmation email" on every registration attempt. MVP decision:
skip email verification entirely. Server action creates the user
pre-confirmed via admin.auth.admin.createUser({ email_confirm: true }),
then the client signs in with the same password to establish session.
No email is sent. Trade-off: no proof of email ownership — acceptable
for MVP.
```

## Investigation rule

Read every file in your scope before modifying anything. Never assume structure. If a path doesn't exist, say so and stop. Never speculate about code you haven't opened.

## Done criteria

- [ ] `src/app/(auth)/auth/signup/actions.ts` exists and exports `signUpWithEmail` + `SignUpResult` exactly as specified
- [ ] `src/features/auth/components/auth-entry-screen.tsx` signup branch uses `signUpWithEmail` server action followed by `supabase.auth.signInWithPassword`; no other changes in that file
- [ ] `npx tsc --noEmit` passes with zero new errors
- [ ] No new npm packages added (`package.json` and `package-lock.json` NOT modified)
- [ ] One commit on `fix/signup-email` branch with the specified message
- [ ] No TODOs, no console.logs, no hardcoded secrets in new code
- [ ] Report what was done in under 200 words
