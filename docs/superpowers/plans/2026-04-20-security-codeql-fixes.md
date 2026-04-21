# Security: CodeQL Alert Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two CodeQL security alerts — open redirect in auth confirm route and XSS in HelpArticle — plus deduplicate the serializeJsonLd utility.

**Architecture:** Three independent changes: (1) a `safeRedirectPath` validator added to `src/lib/auth/`, (2) `HelpArticle` rewritten to use `react-markdown` instead of hand-rolled HTML, (3) `serializeJsonLd` extracted to `src/lib/seo/json-ld.ts` and consumed by the three pages that duplicate it.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, react-markdown (new dep), Tailwind / prose classes, Vitest.

---

## File Map

| Action | File | What changes |
|---|---|---|
| Create | `src/lib/auth/safe-redirect.ts` | `safeRedirectPath` validator |
| Create | `src/lib/auth/safe-redirect.test.ts` | unit tests |
| Modify | `src/app/(auth)/auth/confirm/route.ts:14` | use `safeRedirectPath` |
| Create | `src/lib/seo/json-ld.ts` | shared `serializeJsonLd` |
| Modify | `src/app/(site)/destinations/[slug]/page.tsx:35` | remove inline copy |
| Modify | `src/app/(site)/guide/[id]/page.tsx:52` | remove inline copy |
| Modify | `src/app/(site)/guides/[slug]/page.tsx:33` | remove inline copy |
| Modify | `src/components/help/HelpArticle.tsx` | replace custom renderer with react-markdown |
| Modify | `package.json` | add react-markdown |

---

## Task 1: safeRedirectPath utility + tests

**Files:**
- Create: `src/lib/auth/safe-redirect.ts`
- Create: `src/lib/auth/safe-redirect.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/auth/safe-redirect.test.ts
import { describe, expect, test } from "vitest";
import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  test("returns / for null", () => {
    expect(safeRedirectPath(null)).toBe("/");
  });

  test("returns / for empty string", () => {
    expect(safeRedirectPath("")).toBe("/");
  });

  test("allows simple relative path", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
  });

  test("allows nested relative path", () => {
    expect(safeRedirectPath("/traveler/requests/123")).toBe("/traveler/requests/123");
  });

  test("blocks absolute URL with https", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/");
  });

  test("blocks absolute URL with http", () => {
    expect(safeRedirectPath("http://evil.com")).toBe("/");
  });

  test("blocks protocol-relative URL", () => {
    expect(safeRedirectPath("//evil.com/path")).toBe("/");
  });

  test("blocks path that resolves to external origin", () => {
    expect(safeRedirectPath("https://evil.com/auth/confirm")).toBe("/");
  });

  test("returns / for path not starting with /", () => {
    expect(safeRedirectPath("evil.com")).toBe("/");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd provodnik.app && bun run test:run src/lib/auth/safe-redirect.test.ts
```
Expected: `Cannot find module './safe-redirect'`

- [ ] **Step 3: Implement safeRedirectPath**

```ts
// src/lib/auth/safe-redirect.ts

/**
 * Validates that a redirect target is a safe same-origin relative path.
 * Blocks open redirect attacks where ?next=https://evil.com is passed
 * as a query parameter to auth flows.
 */
export function safeRedirectPath(raw: string | null | undefined): string {
  if (!raw) return "/";
  // Must start with / but not // (protocol-relative = external)
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  // Belt-and-suspenders: try parsing as URL from a dummy origin;
  // if the hostname escapes localhost, it is not a relative path.
  try {
    const parsed = new URL(raw, "http://localhost");
    if (parsed.hostname !== "localhost") return "/";
  } catch {
    return "/";
  }
  return raw;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun run test:run src/lib/auth/safe-redirect.test.ts
```
Expected: `9 passed`

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/safe-redirect.ts src/lib/auth/safe-redirect.test.ts
git commit -m "fix(auth): add safeRedirectPath — blocks open redirect via ?next= param"
```

---

## Task 2: Apply safeRedirectPath in auth confirm route

**Files:**
- Modify: `src/app/(auth)/auth/confirm/route.ts`

Current code at line 14:
```ts
const next = searchParams.get("next") ?? "/";
```
Used at line 47:
```ts
const redirectTo =
  type === "recovery"
    ? new URL("/auth/update-password", origin)
    : new URL(next, origin);
```

- [ ] **Step 1: Import and apply safeRedirectPath**

Replace lines 14 and 47 in `src/app/(auth)/auth/confirm/route.ts`:

```ts
// Add import at top (after existing imports):
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

// Line 14 — change:
const next = safeRedirectPath(searchParams.get("next"));

// Line 47 — change (next is now guaranteed safe, but new URL is still correct):
const redirectTo =
  type === "recovery"
    ? new URL("/auth/update-password", origin)
    : new URL(next, origin);
```

Full file after change:
```ts
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { clientEnv, hasSupabaseEnv } from "@/lib/env";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

type VerifyType = "email" | "recovery" | "invite";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as VerifyType | null;
  const next = safeRedirectPath(searchParams.get("next"));

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(new URL("/auth?error=invalid_link", origin));
  }

  if (tokenHash && type) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL!,
      clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      },
    );

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      const redirectTo =
        type === "recovery"
          ? new URL("/auth/update-password", origin)
          : new URL(next, origin);

      return NextResponse.redirect(redirectTo);
    }
  }

  return NextResponse.redirect(new URL("/auth?error=invalid_link", origin));
}
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/auth/confirm/route.ts
git commit -m "fix(auth): apply safeRedirectPath in confirm route — closes CodeQL alert #1"
```

---

## Task 3: Extract shared serializeJsonLd utility

**Files:**
- Create: `src/lib/seo/json-ld.ts`
- Modify: `src/app/(site)/destinations/[slug]/page.tsx`
- Modify: `src/app/(site)/guide/[id]/page.tsx`
- Modify: `src/app/(site)/guides/[slug]/page.tsx`

- [ ] **Step 1: Create the shared utility**

```ts
// src/lib/seo/json-ld.ts

/**
 * Serializes a JSON-LD object for safe inline injection in <script> tags.
 * Escapes < as \u003c to prevent </script> injection via data values.
 */
export function serializeJsonLd(jsonLd: Record<string, unknown>): string {
  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}
```

- [ ] **Step 2: Update destinations page**

In `src/app/(site)/destinations/[slug]/page.tsx`:
- Remove lines 35–37 (the inline `function serializeJsonLd` definition)
- Add import at the top of the file:

```ts
import { serializeJsonLd } from "@/lib/seo/json-ld";
```

- [ ] **Step 3: Update guide/[id] page**

In `src/app/(site)/guide/[id]/page.tsx`:
- Remove lines 52–54 (the inline `function serializeJsonLd` definition)
- Add import:

```ts
import { serializeJsonLd } from "@/lib/seo/json-ld";
```

- [ ] **Step 4: Update guides/[slug] page**

In `src/app/(site)/guides/[slug]/page.tsx`:
- Remove lines 33–35 (the inline `function serializeJsonLd` definition)
- Add import:

```ts
import { serializeJsonLd } from "@/lib/seo/json-ld";
```

- [ ] **Step 5: Run typecheck**

```bash
bun run typecheck
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/seo/json-ld.ts \
  src/app/\(site\)/destinations/\[slug\]/page.tsx \
  src/app/\(site\)/guide/\[id\]/page.tsx \
  src/app/\(site\)/guides/\[slug\]/page.tsx
git commit -m "refactor(seo): extract shared serializeJsonLd utility — remove 3 inline duplicates"
```

---

## Task 4: Install react-markdown

**Files:**
- Modify: `package.json` (via bun add)

- [ ] **Step 1: Install react-markdown**

```bash
cd provodnik.app && bun add react-markdown
```

Expected output: react-markdown added to dependencies.

- [ ] **Step 2: Verify typecheck still passes**

```bash
bun run typecheck
```
Expected: no errors

- [ ] **Step 3: Commit lockfile + package.json**

```bash
git add package.json bun.lock
git commit -m "chore(deps): add react-markdown for safe markdown rendering"
```

---

## Task 5: Rewrite HelpArticle with react-markdown

**Files:**
- Modify: `src/components/help/HelpArticle.tsx`

Current file (25 lines, custom markdown → HTML pipeline):
```tsx
function markdownToHtml(md: string): string { ... }
export function HelpArticle({ body }: { body: string }) {
  const html = markdownToHtml(body.trim());
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

Target: replace with react-markdown, zero dangerouslySetInnerHTML, same visual output.

- [ ] **Step 1: Rewrite HelpArticle.tsx**

```tsx
// src/components/help/HelpArticle.tsx
import Markdown from "react-markdown";

export function HelpArticle({ body }: { body: string }) {
  return (
    <div className="prose prose-sm max-w-none text-foreground">
      <Markdown>{body}</Markdown>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```
Expected: no errors

- [ ] **Step 3: Run full test suite**

```bash
bun run test:run
```
Expected: `11 passed (11)`

- [ ] **Step 4: Run full pre-commit gate**

```bash
sh scripts/install-hooks.sh && sh .git/hooks/pre-commit
```
Expected: `✓ all checks passed`

- [ ] **Step 5: Commit**

```bash
git add src/components/help/HelpArticle.tsx
git commit -m "fix(xss): replace dangerouslySetInnerHTML in HelpArticle with react-markdown — closes CodeQL alert #2"
```

---

## Task 6: Push and verify

- [ ] **Step 1: Push to origin**

```bash
git push
```

- [ ] **Step 2: Verify Vercel build passes**

Check Vercel dashboard — deployment should complete without errors.

- [ ] **Step 3: Verify CodeQL alerts are dismissed**

Open `https://github.com/s6s8/provodnik.app/security/code-scanning` — alerts #1 and #2 should show as "Fixed" within ~5 minutes of the push.

---

## Summary of changes

| Alert | Fix | File |
|---|---|---|
| CodeQL #1 open redirect | `safeRedirectPath` validator | `src/lib/auth/safe-redirect.ts` + `confirm/route.ts` |
| CodeQL #2 XSS | `react-markdown` replaces custom renderer | `src/components/help/HelpArticle.tsx` |
| Bonus: DRY | shared `serializeJsonLd` | `src/lib/seo/json-ld.ts` + 3 pages |
