# Provodnik Full Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **§7 intercept applies:** product-code tasks route to the project's default coder; reviewer subagents stay on Task tool.

**Goal:** Refactor the provodnik marketplace (Next.js 16 + React 19 + Supabase, 601 files / ~60k LOC) from "sticks and glue" to a consistent, layered, observable codebase — without changing user-facing behavior.

**Architecture:** Seven phases ordered by risk-adjusted value: (0) safety net → (1) security/correctness hotfixes → (2) dead-weight deletion → (3) error-handling + observability standardization → (4) architecture consolidation (layers, route groups, features, data access) → (5) UI quality (dedup, decomposition, a11y) → (6) performance → (7) tests/docs/tooling. Every phase ends with the full gate (`bun run typecheck && bun run lint:ratchet && bun run test:run`) green and a commit, so work can pause at any phase boundary.

**Tech Stack:** Next.js 16 (App Router, `proxy.ts` middleware, React Compiler), React 19, Supabase (SSR + RLS + RPCs), TanStack Query v5, react-hook-form + zod 4, Tailwind 4 + shadcn, Sentry, Upstash Redis, Resend. Tooling: bun, vitest, Playwright, lint-ratchet.

**Audit baseline (2026-06-11):** typecheck ✅ clean, eslint ✅ clean (2 grandfathered warnings), 722 unit tests ✅ passing in 148 files. E2E tripster-v1 suite skipped (ERR-059 seed/fixture mismatch). This is a structural refactor from a green baseline.

**Verified corrections to raw audit findings (do not "fix" these):**
- `src/proxy.ts` **is** the live middleware — Next.js 16 renamed `middleware.ts` → `proxy.ts`. It does session refresh + role gating. Keep it.
- `.env.local` is **not** tracked in git (`git ls-files` shows only `.env.example`). No history scrub needed. Rotating `SUPABASE_SECRET_KEY` / `SENTRY_AUTH_TOKEN` / `OPENROUTER_API_KEY` is optional hygiene since the file traveled in a snapshot tarball once.
- `cmdk`, `react-day-picker` are used — keep.

---

## Phase 0 — Safety Net

### Task 0.1: Branch + tag + gate baseline

**Files:** none (git only)

- [ ] **Step 1:** On the mini, from `~/provodnik` on `main`:

```bash
git checkout main && git pull
git tag checkpoint/pre-refactor-2026-06-11
git checkout -b refactor/full-2026-06
```

- [ ] **Step 2:** Verify gates green before touching anything:

```bash
bun run typecheck && bun run lint:ratchet && bun run test:run
```

Expected: exit 0, 722 tests passing.

- [ ] **Step 3:** Commit nothing yet; tag push optional: `git push origin checkpoint/pre-refactor-2026-06-11`

---

## Phase 1 — Security & Correctness Hotfixes (P0)

### Task 1.1: Gate the public LLM endpoint `/api/requests/parse`

**Problem:** `src/app/api/requests/parse/route.ts:27-74` calls OpenRouter with no auth — only 20 req/min/IP. IP rotation = unbounded LLM spend.

**Files:**
- Modify: `src/app/api/requests/parse/route.ts`
- Modify: `src/lib/rate-limit.ts` (add daily global budget limiter)
- Test: `src/app/api/requests/parse/route.test.ts` (create)

- [ ] **Step 1: Write failing test** for the global budget guard:

```ts
// src/app/api/requests/parse/route.test.ts
import { describe, expect, it, vi } from "vitest";
import { checkGlobalBudget } from "@/lib/rate-limit";

describe("global parse budget", () => {
  it("rejects when daily global counter is exhausted", async () => {
    const redis = { incr: vi.fn().mockResolvedValue(5001), expire: vi.fn() };
    const result = await checkGlobalBudget(redis as never, "parse-llm", 5000);
    expect(result.success).toBe(false);
  });
  it("allows under budget and sets TTL on first hit", async () => {
    const redis = { incr: vi.fn().mockResolvedValue(1), expire: vi.fn() };
    const result = await checkGlobalBudget(redis as never, "parse-llm", 5000);
    expect(result.success).toBe(true);
    expect(redis.expire).toHaveBeenCalledWith("budget:parse-llm", 86_400);
  });
});
```

- [ ] **Step 2:** Run `bun run test:run src/app/api/requests/parse/route.test.ts` — expect FAIL (`checkGlobalBudget` not exported).

- [ ] **Step 3: Implement** in `src/lib/rate-limit.ts`:

```ts
type BudgetRedis = { incr(key: string): Promise<number>; expire(key: string, s: number): Promise<unknown> };

/** Daily global counter — caps total spend on a shared resource regardless of caller IP. */
export async function checkGlobalBudget(
  redis: BudgetRedis,
  bucket: string,
  dailyLimit: number,
): Promise<{ success: boolean }> {
  const key = `budget:${bucket}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 86_400);
  return { success: count <= dailyLimit };
}
```

And in `route.ts`, after the existing per-IP `rateLimit(...)` check:

```ts
import { getRedis } from "@/lib/upstash/redis";
import { checkGlobalBudget } from "@/lib/rate-limit";

const budget = await checkGlobalBudget(getRedis(), "parse-llm", 5000);
if (!budget.success) {
  return NextResponse.json({ error: "Сервис временно перегружен." }, { status: 429 });
}
```

- [ ] **Step 4:** Run the test — expect PASS. Run full gate.
- [ ] **Step 5:** Commit: `git commit -m "fix(api): daily global budget cap on LLM parse endpoint"`

### Task 1.2: Explicit ownership checks in favorites actions

**Problem:** `src/features/favorites/actions/favoritesActions.ts:24-54` — `deleteFolder` / `addToFolder` / `removeFromFolder` rely solely on RLS + `.eq("user_id", user.id)`. Add belt-and-suspenders verification so an RLS regression can't become an IDOR.

**Files:**
- Modify: `src/features/favorites/actions/favoritesActions.ts`
- Test: `src/features/favorites/actions/favoritesActions.test.ts` (create)

- [ ] **Step 1: Failing test:**

```ts
// favoritesActions.test.ts — mock createSupabaseServerClient; assert that deleteFolder
// throws "not_found" when the ownership pre-check returns null.
import { describe, expect, it, vi } from "vitest";

const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-a" } } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle,
      delete: vi.fn().mockReturnThis(),
    })),
  }),
}));

import { deleteFolder } from "./favoritesActions";

it("refuses to delete a folder the user does not own", async () => {
  await expect(deleteFolder("someone-elses-folder")).rejects.toThrow("not_found");
});
```

- [ ] **Step 2:** Run — expect FAIL (no pre-check exists, delete resolves fine).
- [ ] **Step 3: Implement** the pre-check in each of the three actions:

```ts
async function assertFolderOwned(supabase: SupabaseServerClient, folderId: string, userId: string) {
  const { data, error } = await supabase
    .from("favorites_folders")
    .select("id")
    .eq("id", folderId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("not_found");
}

export async function deleteFolder(folderId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await assertFolderOwned(supabase, folderId, user.id);
  const { error } = await supabase.from("favorites_folders").delete()
    .eq("id", folderId).eq("user_id", user.id);
  if (error) throw error;
  return { success: true };
}
```

(Repeat `assertFolderOwned` call in `addToFolder` and `removeFromFolder`.)

- [ ] **Step 4:** Tests + gate green. **Step 5:** Commit: `fix(favorites): explicit ownership assertions before folder mutations`

### Task 1.3: Zod schemas for unvalidated server actions

**Problem:** `submitRequest` (`src/features/booking/actions/submitRequest.ts`), `completeOnboarding` (`src/features/guide/actions/completeOnboarding.ts`), `updatePersonalSettings` (`src/features/profile/...`), `submitReply` (reviews), `counterOffer` (offers) accept loosely-typed input with no schema.

**Files:**
- Create: `src/features/booking/actions/submitRequest.schema.ts` (and sibling `*.schema.ts` per action)
- Modify: each action listed above
- Test: extend each action's existing `*.test.ts` (completeOnboarding already has one)

- [ ] **Step 1:** For each action, write the schema first. Example for `submitRequest`:

```ts
// src/features/booking/actions/submitRequest.schema.ts
import { z } from "zod";

export const submitRequestSchema = z.object({
  listingId: z.string().uuid(),
  guideId: z.string().uuid(),
  destination: z.string().trim().min(1).max(255),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  groupSize: z.coerce.number().int().min(1).max(50),
  comment: z.string().trim().max(2000).optional(),
});
export type SubmitRequestInput = z.infer<typeof submitRequestSchema>;
```

(Derive exact field lists from each action's current destructuring — read the action body, list every field it touches, type each one. Do the same for `completeOnboarding` (regions: `z.array(z.string().min(1)).max(20)`), `updatePersonalSettings` (explicit notification-pref keys as `z.object({...}).strict()` — no `Record<string, unknown>`), `submitReply` (`text: z.string().trim().min(1).max(2000)`), `counterOffer` (`priceRub: z.coerce.number().int().min(1000).max(1_000_000)`).)

- [ ] **Step 2:** Failing test per action: pass an out-of-range value, expect a validation error return (not a DB write).
- [ ] **Step 3:** Apply at the top of each action:

```ts
const parsed = submitRequestSchema.safeParse(rawInput);
if (!parsed.success) return { ok: false as const, error: "Некорректные данные формы." };
const input = parsed.data;
```

- [ ] **Step 4:** Tests + gate. **Step 5:** Commit per action: `fix(actions): zod validation for <action>` (5 small commits).

### Task 1.4: Idempotent offer submission (double-submit fix)

**Problem:** `src/features/guide/components/requests/bid-form-panel.tsx:215` — `submitted` state is set only after the server round-trip; two clicks within flight = two offers. No server-side uniqueness.

**Files:**
- Create: `supabase/migrations/<ts>_guide_offers_unique_active.sql`
- Modify: `src/features/guide/components/requests/bid-form-panel.tsx` (disable on first click)
- Modify: the offer server action to map unique-violation → friendly error
- Test: extend offer action test

- [ ] **Step 1: Migration** — DB is the only reliable guard:

```sql
-- One active (non-withdrawn/non-declined) offer per guide per request.
create unique index if not exists guide_offers_one_active_per_guide_request
  on public.guide_offers (request_id, guide_id)
  where status in ('pending', 'countered', 'accepted');
```

(Check actual status enum values in `supabase/migrations/20260413000001_tripster_v1.sql` before applying; adjust the `where` list to whatever non-terminal statuses exist.)

- [ ] **Step 2: Client** — flip pending state synchronously before the await:

```tsx
const submitInFlight = React.useRef(false);
const onSubmit = React.useCallback(async (values: OfferFormValues) => {
  if (submitInFlight.current || submitted) return;
  submitInFlight.current = true;
  try {
    const result = await submitOfferAction(requestId, toFormData(values));
    if ("ok" in result && result.ok) setSubmitted(true);
    else setServerError(result.error ?? "Не удалось отправить предложение.");
  } finally {
    submitInFlight.current = false;
  }
}, [requestId, submitted]);
```

- [ ] **Step 3: Server action** — catch Postgres `23505`:

```ts
if (error?.code === "23505") {
  return { ok: false as const, error: "Вы уже отправили предложение по этому запросу." };
}
```

- [ ] **Step 4:** Apply migration via Management API (per project convention), run gate. **Step 5:** Commit: `fix(offers): idempotent submission — partial unique index + in-flight guard`

### Task 1.5: Stop swallowing Supabase errors (7 call sites)

**Problem:** `const { data } = await supabase...` ignores `.error` → outages render as silent empty states. Sites: `guide-requests-inbox-screen.tsx`, `(public)/help/page.tsx`, `lib/notifications/triggers.ts`, `(protected)/profile/personal/page.tsx`, `(public)/search/page.tsx`, `(site)/guide/[id]/page.tsx`, `lib/supabase/request-members.ts`.

**Files:** Modify the 7 files above.

- [ ] **Step 1:** In each, destructure and handle `error`. Pattern for pages (server components):

```ts
const { data, error } = await supabase.from("listings").select("...");
if (error) throw error; // bubbles to nearest error.tsx (added in Phase 3) + Sentry via onRequestError
const rows = data ?? [];
```

Pattern for background triggers (`lib/notifications/triggers.ts`) — log to Sentry, don't crash the parent flow:

```ts
if (error) {
  Sentry.captureException(error, { tags: { context: "notification_trigger" } });
  return; // notification delivery is best-effort
}
```

- [ ] **Step 2:** Gate green (no behavior change in happy path). **Step 3:** Commit: `fix(data): surface supabase errors instead of silent empty states`

---

## Phase 2 — Dead Weight Removal

### Task 2.1: Delete `formx` (byte-identical duplicate of `form`)

**Files:** Delete: `src/app/(home)/formx/page.tsx` (whole dir)

- [ ] **Step 1:** Prove zero inbound links: `grep -rn "formx" src/ docs/ --include="*.ts*"` → expect only the page itself.
- [ ] **Step 2:** `git rm -r "src/app/(home)/formx"` → gate → commit `chore: remove formx duplicate route`.

### Task 2.2: Remove unused animation deps; demote `shadcn` to devDependency

**Files:** Modify: `package.json`

- [ ] **Step 1:** Re-verify zero imports: `grep -rn "framer-motion\|from \"motion" src/` → 0 hits.
- [ ] **Step 2:** `bun remove framer-motion motion && bun remove shadcn && bun add -d shadcn`
- [ ] **Step 3:** `bun run build` locally to confirm nothing implicit broke. Gate. Commit: `chore(deps): drop unused framer-motion/motion; shadcn → devDependency`.

### Task 2.3: Delete or adopt orphaned data modules

**Problem:** Zero importers: `src/data/bookings/supabase.ts`, `src/data/conversations/supabase.ts`, `src/data/favorites/supabase-client.ts`, parts of `src/data/guide-assets/supabase-client.ts`.

- [ ] **Step 1:** For each module run `grep -rn "data/bookings\|data/conversations\|data/favorites/supabase-client" src/` to confirm zero importers (excluding self/tests).
- [ ] **Step 2:** Delete confirmed orphans **including their tests**. The live equivalents are in `src/lib/supabase/*` — Phase 4 makes that the single canonical data layer.
- [ ] **Step 3:** Gate. Commit: `chore: delete orphaned src/data modules (superseded by lib/supabase)`.

### Task 2.4: Untrack committed junk; fence the repo root

**Files:** Modify: `.gitignore`; git-rm tracked junk.

- [ ] **Step 1:** Untrack Playwright artifacts and root screenshots/dumps:

```bash
git rm -r --cached .playwright-mcp
git rm --cached *.png 2>/dev/null || true
git rm --cached airbnb-exp.md getyourguide-home.md sputnik8-home.md tripster-home.md viator-home.md
mkdir -p docs/_research/competitors
git mv --force airbnb-exp.md getyourguide-home.md sputnik8-home.md tripster-home.md viator-home.md docs/_research/competitors/ 2>/dev/null || mv *.md-dumps docs/_research/competitors/
```

(If the dumps should be kept at all, they live in `docs/_research/competitors/`; if not, delete outright — decide by whether anything in `docs/product/research/` links to them: `grep -rn "tripster-home\|airbnb-exp" docs/`.)

- [ ] **Step 2:** Append to `.gitignore`:

```gitignore
.playwright-mcp/
/*.png
```

- [ ] **Step 3:** Delete the dead one-off script `scripts/generate-specializations-proposal.ts` (verify: `grep -rn "generate-specializations" package.json scripts/ src/` → 0).
- [ ] **Step 4:** Gate. Commit: `chore(repo): untrack playwright artifacts + screenshots, archive competitor dumps`.

---

## Phase 3 — Error Handling & Observability Standard

### Task 3.1: One action-result contract + `createAction` wrapper

**Problem:** Server actions mix `throw` and `{ error }` returns; 38 `console.error` calls never reach Sentry; some clients expect shapes the action doesn't return (`(site)/requests/[requestId]/actions.ts:72` throws where the client expects a result object).

**Files:**
- Create: `src/lib/actions/create-action.ts`
- Create: `src/lib/actions/create-action.test.ts`
- Modify (incrementally, see Step 5): every file matching `src/**/actions/*.ts` and `src/app/**/actions.ts`

- [ ] **Step 1: Failing test:**

```ts
// src/lib/actions/create-action.test.ts
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
import * as Sentry from "@sentry/nextjs";
import { createAction } from "./create-action";

describe("createAction", () => {
  const echo = createAction(z.object({ name: z.string().min(1) }), async (i) => i.name);

  it("returns ok+data on success", async () => {
    expect(await echo({ name: "x" })).toEqual({ ok: true, data: "x" });
  });
  it("returns validation error without calling handler", async () => {
    const res = await echo({ name: "" });
    expect(res.ok).toBe(false);
  });
  it("captures thrown errors to Sentry and returns generic error", async () => {
    const boom = createAction(z.object({}), async () => { throw new Error("db down"); });
    const res = await boom({});
    expect(res.ok).toBe(false);
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2:** Run — FAIL (module missing).
- [ ] **Step 3: Implement:**

```ts
// src/lib/actions/create-action.ts
import * as Sentry from "@sentry/nextjs";
import type { z } from "zod";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const GENERIC_ERROR = "Что-то пошло не так. Попробуйте ещё раз.";

/**
 * Standard server-action wrapper: zod-validate → run → never throw.
 * Known user-facing failures: throw ActionError(message) inside the handler.
 */
export class ActionError extends Error {}

export function createAction<S extends z.ZodType, T>(
  schema: S,
  handler: (input: z.infer<S>) => Promise<T>,
  options?: { context?: string },
) {
  return async (raw: unknown): Promise<ActionResult<T>> => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: "Некорректные данные." };
    try {
      return { ok: true, data: await handler(parsed.data) };
    } catch (err) {
      if (err instanceof ActionError) return { ok: false, error: err.message };
      Sentry.captureException(err, { tags: { context: options?.context ?? "server-action" } });
      return { ok: false, error: GENERIC_ERROR };
    }
  };
}
```

- [ ] **Step 4:** Test + gate green. Commit: `feat(lib): createAction wrapper — single result contract + Sentry capture`.
- [ ] **Step 5: Migrate actions in batches of ~5 files per commit.** Order: (a) `src/app/(site)/requests/[requestId]/actions.ts` (the known shape mismatch), (b) admin actions, (c) feature actions. Mechanical pattern per action:

```ts
// BEFORE
export async function joinRequest(requestId: string) {
  ...
  if (error) throw new Error("join failed");   // crashes page
}

// AFTER
export const joinRequest = createAction(
  z.object({ requestId: z.string().uuid() }),
  async ({ requestId }) => {
    ...
    if (error) throw new ActionError("Не удалось присоединиться к запросу.");
    return { joined: true };
  },
  { context: "requests.join" },
);
```

Update each call site to read `result.ok / result.data / result.error`. Run gate after every batch. Commits: `refactor(actions): migrate <area> to createAction`.

### Task 3.2: error.tsx coverage for (home), (public), (guide), (auth) + Sentry in existing boundaries

**Files:**
- Create: `src/app/(home)/error.tsx`, `src/app/(public)/error.tsx`, `src/app/(auth)/error.tsx` ((guide) group is deleted in Task 4.2 — skip it)
- Modify: `src/app/(protected)/error.tsx:15`, `src/app/(site)/error.tsx:15`

- [ ] **Step 1:** One template, reused verbatim (matches existing boundary styling in `(protected)/error.tsx`):

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-page flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Что-то пошло не так</h1>
      <p className="text-sm text-muted-foreground">Мы уже знаем об ошибке и разбираемся.</p>
      <button type="button" onClick={reset} className="rounded-xl border border-border px-4 py-2 text-sm">
        Попробовать снова
      </button>
    </main>
  );
}
```

- [ ] **Step 2:** In the two existing boundaries, replace `console.error(error)` with `Sentry.captureException(error)`.
- [ ] **Step 3:** Gate. Commit: `feat(errors): error boundaries for all route groups, wired to Sentry`.

### Task 3.3: Replace remaining console.* with Sentry-backed logger

**Problem:** 42 console statements in src (non-test). Worst: `lib/supabase/moderation.ts:818-843`, `lib/notifications/triggers.ts:186-472`.

**Files:**
- Create: `src/lib/log.ts`
- Modify: the 24 files from `grep -rn "console\." src --include="*.ts*" | grep -v ".test."`

- [ ] **Step 1:**

```ts
// src/lib/log.ts
import * as Sentry from "@sentry/nextjs";

/** Error that should be visible in monitoring but must not crash the flow. */
export function logError(context: string, err: unknown, extra?: Record<string, unknown>) {
  Sentry.captureException(err, { tags: { context }, extra });
  if (process.env.NODE_ENV !== "production") {
    console.error(`[${context}]`, err, extra ?? "");
  }
}
```

- [ ] **Step 2:** Mechanical replace per file: `console.error("[x] msg", details)` → `logError("x", err, details)`. Batch ~8 files per commit, gate between batches.
- [ ] **Step 3:** Add an eslint guard so the count only goes down — in `eslint.config.mjs` rules: `"no-console": ["warn", { allow: [] }]`, then `bun run lint:ratchet:update` to re-baseline (current violations grandfathered, new ones blocked).
- [ ] **Step 4:** Commits: `refactor(obs): console.* → logError (<area>)`, final `chore(lint): forbid console via ratchet`.

### Task 3.4: Sentry hardening — tunnelRoute + tracesSampler

**Files:** Modify: `next.config.ts:92` (uncomment tunnel), `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation-client.ts`

- [ ] **Step 1:** Enable `tunnelRoute: "/monitoring"` in the Sentry options in `next.config.ts`.
- [ ] **Step 2:** Replace flat `tracesSampleRate: 0.1` with a sampler in the server config:

```ts
tracesSampler: ({ name }) => {
  if (name?.includes("/admin/")) return 0.5;
  if (name?.includes("/bookings") || name?.includes("/offer")) return 0.3;
  return 0.1;
},
```

- [ ] **Step 3:** Deploy to dev, trigger a thrown error in a test page, confirm event arrives in Sentry. Commit: `feat(obs): sentry tunnel route + path-weighted trace sampling`.

---

## Phase 4 — Architecture Consolidation

### Task 4.1: Break the lib→features dependency (TravelerProfile type)

**Problem:** `src/lib/profile/load-traveler-profile.ts:1`, `src/lib/demo-traveler-profile.ts:3`, `src/lib/profile/traveler-profile-completion.ts:1` import the `TravelerProfile` type from `@/features/profile/components/traveler-profile-form` — infra depending on a component file.

**Files:**
- Create: `src/lib/profile/types.ts`
- Modify: the 3 lib files + `src/features/profile/components/traveler-profile-form.tsx`

- [ ] **Step 1:** Move the type:

```ts
// src/lib/profile/types.ts
export type TravelerProfile = {
  // copy the exact shape currently defined in traveler-profile-form.tsx — do not redesign it
};
```

- [ ] **Step 2:** In `traveler-profile-form.tsx`: delete the local type, `import type { TravelerProfile } from "@/lib/profile/types";` and `export type { TravelerProfile };` (keeps old import path working during migration).
- [ ] **Step 3:** Point the 3 lib files at `@/lib/profile/types`. Then `grep -rn "components/traveler-profile-form" src/lib/` → 0 hits.
- [ ] **Step 4:** Add an import-boundary lint rule so it can't regress — `eslint.config.mjs`:

```js
{
  files: ["src/lib/**/*.{ts,tsx}", "src/data/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{ group: ["@/features/*"], message: "lib/data must not import from features" }],
    }],
  },
},
```

- [ ] **Step 5:** Gate. Commit: `refactor(arch): extract TravelerProfile to lib; forbid lib→features imports`.

### Task 4.2: Route-group consolidation

**Problem:** `(site)` and `(public)` have byte-identical layouts; `(guide)` group holds exactly one page.

**Files:**
- Move: `src/app/(public)/help`, `src/app/(public)/listings`, `src/app/(public)/search` → `src/app/(site)/...`
- Delete: `src/app/(public)/` (incl. layout)
- Move: `src/app/(guide)/settings/contact-visibility` → `src/app/(protected)/guide/settings/contact-visibility`
- Delete: `src/app/(guide)/`
- Modify: `src/lib/auth/role-routing.ts` if path-based role rules reference the moved paths

- [ ] **Step 1:** Before moving, confirm URL paths are group-invariant (route groups don't affect URLs) — the only risk is duplicate page conflicts: check `(site)/listings/[id]` does NOT already exist (`ls "src/app/(site)"`). The audit shows `(protected)/listings/[id]` and `(public)/listings/[id]` both exist but in different groups — those resolve to the SAME URL `/listings/[id]`, which Next only tolerates if one group's matcher excludes it. **Investigate first:** `grep -rn "listings" src/proxy.ts src/lib/auth/role-routing.ts`. If `(protected)/listings` and `(public)/listings` collide, the protected one is reachable only via auth redirect logic — document what you find in the plan-execution notes, and if they are genuinely two pages for one URL, merge into one page that branches on session (server component reading auth, rendering public vs. authed view).
- [ ] **Step 2:** `git mv` the three `(public)` dirs into `(site)`, delete `(public)/layout.tsx` + group dir.
- [ ] **Step 3:** `git mv "src/app/(guide)/settings" "src/app/(protected)/guide/settings"`, delete the `(guide)` group. Check `src/proxy.ts` role map covers `/settings/contact-visibility` under its new (unchanged) URL — route groups don't change URLs, so no proxy change expected; verify with `bun run dev` + manual hit.
- [ ] **Step 4:** `bun run build` (route conflicts surface at build time), gate, click-test `/help`, `/search`, `/settings/contact-visibility` on dev.
- [ ] **Step 5:** Commit: `refactor(routes): collapse (public) into (site); fold (guide) into (protected)`.

### Task 4.3: Homepage cleanup — `homepage3` becomes the homepage; classic form archived behind `/form`

**Problem:** `homepage3` (AI conversation flow) serves `/`; `homepage` (classic form) serves `/form`. Version-numbered feature dirs hide intent.

**Files:**
- Rename: `src/features/homepage3/` → `src/features/homepage/` (the live one)
- Rename: current `src/features/homepage/` → `src/features/homepage-classic/`
- Modify: imports in `src/app/(home)/page.tsx`, `src/app/(home)/form/page.tsx`, `src/app/api/requests/parse/route.ts`

- [ ] **Step 1:** `git mv src/features/homepage src/features/homepage-classic` then `git mv src/features/homepage3 src/features/homepage`.
- [ ] **Step 2:** Fix imports: `grep -rln "features/homepage3\|features/homepage/" src/ | xargs sed -i '' -e 's|features/homepage3|features/homepage|g'` — **careful:** do classic first (`features/homepage/` → `features/homepage-classic/`), then homepage3 → homepage, to avoid clobbering. On macOS sed: `sed -i ''`.
- [ ] **Step 3:** Record the decision in `DECISIONS.md`: one line — "homepage = AI conversation flow (ex-homepage3); homepage-classic = fallback form at /form; delete classic when /form traffic ~0."
- [ ] **Step 4:** Gate + build + load `/` and `/form` on dev. Commit: `refactor(homepage): homepage3 → homepage, old homepage → homepage-classic`.

### Task 4.4: Merge `features/booking` into `features/bookings`

**Files:**
- Move: `src/features/booking/actions/submitRequest.ts` (+ its schema/test from Task 1.3) → `src/features/bookings/actions/`
- Move: `src/features/booking/components/BookingFormTabs.tsx` → `src/features/bookings/components/`
- Delete: `src/features/booking/`
- Modify: `src/app/(protected)/listings/[id]/book/page.tsx` (import paths)

- [ ] **Step 1:** `git mv` the files; update the two import sites (`grep -rn "features/booking/" src/`).
- [ ] **Step 2:** Gate + build. Commit: `refactor(features): merge booking into bookings`.

### Task 4.5: Canonical data layer — everything through `src/lib/supabase/*`, kill `src/data` stragglers

**Problem:** Three parallel data-access conventions (`src/data/*/supabase.ts`, `src/data/*/supabase-client.ts`, `src/lib/supabase/*`). Phase 2 deleted orphans; this task migrates the survivors.

**Files:**
- Audit then move: every remaining live module under `src/data/` that performs Supabase I/O moves to `src/lib/supabase/<domain>.ts`; pure types/schemas/constants (`src/data/interests.ts`, `languages.ts`, `money.ts`, `*/types.ts`, `*/schema.ts`) move to `src/lib/<domain>/` or stay if import-clean
- Modify: all importers (mechanical path updates)

- [ ] **Step 1:** Inventory: `find src/data -name "*.ts" | grep -v test` → for each file classify: (a) Supabase I/O → `lib/supabase/`, (b) pure domain data → keep, but under one rule: **`src/data` holds only static domain constants and types after this task** — no I/O.
- [ ] **Step 2:** Move I/O modules one domain per commit with import updates. Verify each with `grep -rn "src/data/<domain>"` → 0 and gate.
- [ ] **Step 3:** Document the layering rule in `.claude/CLAUDE.md` (project):

```md
## Data access layering
- src/lib/supabase/<domain>.ts — ALL Supabase I/O (server). One file per domain.
- src/data/ — static domain constants/types only. NO network I/O.
- features/ may import lib + data. lib/data may NOT import features (eslint-enforced).
```

- [ ] **Step 4:** Commits: `refactor(data): move <domain> I/O to lib/supabase`.

### Task 4.6: Fix the bookings N+1

**Problem:** `src/lib/supabase/bookings.ts:116-151` — per-booking fetch of guide profile + request + offer → 20 bookings = 60 queries.

**Files:**
- Modify: `src/lib/supabase/bookings.ts`
- Test: `src/lib/supabase/bookings.test.ts` (extend)

- [ ] **Step 1: Failing test** asserting batch shape (mock client records calls):

```ts
it("loads guide profiles for all bookings in one query", async () => {
  const calls: string[] = [];
  const client = makeMockClient(calls); // records table+filter per .from() chain
  await getTravelerBookings(client, "traveler-1"); // 3 bookings in fixture
  const guideQueries = calls.filter((c) => c.startsWith("guide_profiles"));
  expect(guideQueries).toHaveLength(1); // not 3
});
```

- [ ] **Step 2: Implement** batch load:

```ts
export async function getTravelerBookings(supabase: SupabaseServerClient, travelerId: string) {
  const { data: bookings, error } = await supabase
    .from("bookings").select("*").eq("traveler_id", travelerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!bookings?.length) return [];

  const guideIds = [...new Set(bookings.map((b) => b.guide_id))];
  const requestIds = [...new Set(bookings.map((b) => b.request_id).filter(Boolean))];
  const offerIds = [...new Set(bookings.map((b) => b.offer_id).filter(Boolean))];

  const [profilesRes, requestsRes, offersRes] = await Promise.all([
    supabase.from("guide_profiles").select("user_id, display_name, avatar_url, slug").in("user_id", guideIds),
    requestIds.length
      ? supabase.from("traveler_requests").select("id, destination, date_from, date_to").in("id", requestIds)
      : Promise.resolve({ data: [], error: null }),
    offerIds.length
      ? supabase.from("guide_offers").select("id, price_rub, status").in("id", offerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  for (const res of [profilesRes, requestsRes, offersRes]) if (res.error) throw res.error;

  const profileByGuide = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));
  const requestById = new Map((requestsRes.data ?? []).map((r) => [r.id, r]));
  const offerById = new Map((offersRes.data ?? []).map((o) => [o.id, o]));

  return bookings.map((b) => ({
    ...b,
    guideProfile: profileByGuide.get(b.guide_id) ?? null,
    request: b.request_id ? requestById.get(b.request_id) ?? null : null,
    offer: b.offer_id ? offerById.get(b.offer_id) ?? null : null,
  }));
}
```

(Match the exact column lists to what the existing per-booking version selects — read `bookings.ts:116-138` first and mirror it.)

- [ ] **Step 3:** Tests + gate; smoke `/traveler/bookings` on dev. Commit: `perf(bookings): batch-load related rows (3 queries instead of 3N)`.

### Task 4.7: Query-key factory + thin client API layer

**Files:**
- Create: `src/lib/query-keys.ts`
- Create: `src/lib/api/messages.ts`
- Modify: `src/features/messaging/components/chat-window.tsx`, `src/features/messaging/hooks/use-unread-count.ts`, other `useQuery` sites (`grep -rn "queryKey" src/`)

- [ ] **Step 1:**

```ts
// src/lib/query-keys.ts
export const queryKeys = {
  messages: {
    all: ["messages"] as const,
    threads: () => [...queryKeys.messages.all, "threads"] as const,
    thread: (threadId: string) => [...queryKeys.messages.threads(), threadId] as const,
    unreadCount: () => [...queryKeys.messages.all, "unread-count"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: () => [...queryKeys.notifications.all, "list"] as const,
  },
} as const;
```

```ts
// src/lib/api/messages.ts — the ONLY place client code fetches /api/messages/*
import type { MessageWithSender, ThreadSummary } from "@/lib/supabase/types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`request_failed:${res.status}`);
  return res.json() as Promise<T>;
}

export const messagesApi = {
  threadMessages: (threadId: string) =>
    getJson<MessageWithSender[]>(`/api/messages/threads/${threadId}`),
  threads: () => getJson<ThreadSummary[]>(`/api/messages/threads`),
  unreadCount: () => getJson<{ count: number }>(`/api/messages/unread-count`),
};
```

- [ ] **Step 2:** Replace inline fetch + string keys at each site:

```tsx
const { data: messages } = useQuery({
  queryKey: queryKeys.messages.thread(threadId),
  queryFn: () => messagesApi.threadMessages(threadId),
  initialData: initialMessages,
});
// invalidation:
queryClient.invalidateQueries({ queryKey: queryKeys.messages.threads() });
```

- [ ] **Step 3:** Gate + manual messaging smoke on dev. Commit: `refactor(client): query-key factory + typed messages api module`.

### Task 4.8: Feature-structure convention (document + enforce lightly)

**Files:**
- Create: `docs/architecture/feature-structure.md`
- Modify: `.claude/CLAUDE.md` (one pointer line)

- [ ] **Step 1:** Write the standard (do NOT mass-move 21 features in one task — this doc is the rule; moves happen opportunistically when a feature is next touched):

```md
# Feature directory standard
src/features/<name>/
  actions/        server actions ('use server'), one use-case per file + colocated .test.ts
  components/     UI, colocated .test.tsx
  hooks/          only when shared by 2+ components
  types.ts        feature-public types
  validation.ts   zod schemas shared between action + form
Rules:
- tests colocate (no tests/ or __tests__/ subdirs for new code)
- features import from lib/, data/, components/ui — never from другой feature except features/shared
```

- [ ] **Step 2:** Add eslint `no-restricted-imports` pattern forbidding cross-feature imports (`@/features/*` from within `src/features/<other>` — implement as a per-feature override only if violations are currently zero; otherwise record current violators in the doc as grandfathered).
- [ ] **Step 3:** Commit: `docs(arch): feature structure standard + cross-feature import rule`.

---

## Phase 5 — UI Quality

### Task 5.1: Merge the two homepage request forms

**Problem:** `homepage-request-form.tsx` (441 lines) vs `homepage-request-form-classic.tsx` (438) — same zod schema, same fields, different layout. (After Task 4.3 these live in `features/homepage-classic/`.)

**Files:**
- Create: `src/features/homepage-classic/components/request-form/use-request-form.ts` (shared logic)
- Modify: both form components to consume the hook
- Test: existing `homepage-request-form.test.tsx` keeps passing unchanged

- [ ] **Step 1:** Extract everything non-visual into one hook:

```ts
// use-request-form.ts
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { travelerRequestSchema, type TravelerRequestValues } from "./schema";

export function useRequestForm(onSubmitAction: (v: TravelerRequestValues) => Promise<{ ok: boolean; error?: string }>) {
  const form = useForm<TravelerRequestValues>({
    resolver: zodResolver(travelerRequestSchema),
    defaultValues: { destination: "", groupSize: 2, interests: [] },
  });
  const submit = form.handleSubmit(async (values) => {
    const res = await onSubmitAction(values);
    if (!res.ok) form.setError("root", { message: res.error });
  });
  return { form, submit };
}
```

- [ ] **Step 2:** Both components become layout-only consumers of `useRequestForm`. Diff the two files first (`diff <(sed ...) ...`) — everything identical moves to the hook/schema; what remains in each file is genuinely visual.
- [ ] **Step 3:** Tests + gate + visual smoke of `/form`. Commit: `refactor(homepage): single form logic hook behind two layouts`.

### Task 5.2: Shared card primitive for the 5 card variants

**Problem:** `guide-card`, `listing-card`, `tour-card`, `req-card`, `request-card-final` in `src/components/shared/` re-implement image + gradient overlay + badges + footer.

**Files:**
- Create: `src/components/shared/media-card.tsx`
- Modify: `listing-card.tsx`, `tour-card.tsx` first (closest pair); then `request-card-final.tsx`; `req-card.tsx` is superseded by `request-card-final` — check importers (`grep -rn "req-card" src/`) and delete if request-card-final covers all call sites

- [ ] **Step 1:** Composition-slot primitive:

```tsx
// media-card.tsx
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function MediaCard({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn("group relative block overflow-hidden rounded-2xl", className)}>
      {children}
    </Link>
  );
}
MediaCard.Image = function MediaCardImage({ src, alt }: { src: string; alt: string }) {
  return (
    <>
      <Image src={src} alt={alt} fill className="object-cover transition-transform group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
    </>
  );
};
MediaCard.Badges = function MediaCardBadges({ children }: { children: React.ReactNode }) {
  return <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{children}</div>;
};
MediaCard.Footer = function MediaCardFooter({ children }: { children: React.ReactNode }) {
  return <div className="absolute inset-x-0 bottom-0 p-3 text-primary-foreground">{children}</div>;
};
```

(Lift the exact gradient/badge classNames from `listing-card.tsx:37-49` so visuals don't shift — this primitive must reproduce, not redesign.)

- [ ] **Step 2:** Migrate one card per commit, screenshot-compare on dev before/after (`/search`, `/destinations/[slug]`, guide profile). Commits: `refactor(ui): <card> on MediaCard primitive`.

### Task 5.3: Decompose `bid-form-panel.tsx` (607 lines)

**Files:**
- Modify: `src/features/guide/components/requests/bid-form-panel.tsx` (shrinks to composition + form)
- Create: `src/features/guide/components/requests/use-guide-catalog.ts` (data hook)
- Create: `src/features/guide/components/requests/excursion-picker.tsx`
- Create: `src/features/guide/components/requests/route-builder.tsx`
- Move `ProposedBadge` (currently defined inside the component, line ~64) to module scope

- [ ] **Step 1:** Extract the useEffect data-loading block (lines ~100-145) into a hook:

```ts
// use-guide-catalog.ts
"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { logError } from "@/lib/log";
import type { GuideTemplate, GuidePhoto } from "@/lib/supabase/types";

export function useGuideCatalog() {
  const [templates, setTemplates] = useState<GuideTemplate[]>([]);
  const [photos, setPhotos] = useState<GuidePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        // move the existing listGuideTemplates / listGuideLocationPhotos calls here verbatim
      } catch (err) {
        logError("guide-catalog", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { templates, photos, loading };
}
```

- [ ] **Step 2:** Move the excursion-picker JSX block and route-builder JSX block (with their `routeStops` / `photoPickerOpen` state) into the two new components; props = `value`/`onChange` pairs. Keep the main panel owning the react-hook-form instance.
- [ ] **Step 3:** Existing behavior verified manually on dev (open inbox → make offer → templates load, route builds, price calc updates). Gate. Commit: `refactor(guide): decompose bid-form-panel into catalog hook + picker + route builder`.

### Task 5.4: `guide-excursions-screen.tsx` — 12 useState → react-hook-form

**Files:**
- Modify: `src/features/guide/components/excursions/guide-excursions-screen.tsx`
- Create: `src/features/guide/components/excursions/template-form.tsx`

- [ ] **Step 1:** Define the form model (replaces `tplTitle`…`tplDuration` etc.):

```tsx
const templateFormSchema = z.object({
  title: z.string().trim().min(1, "Укажите название"),
  description: z.string().trim().max(2000).optional(),
  durationHours: z.coerce.number().min(0.5).max(72).optional(),
  pricePerPerson: z.coerce.number().int().min(0).optional(),
  priceTotal: z.coerce.number().int().min(0).optional(),
  // ...mirror every tpl* state var 1:1
});
type TemplateFormValues = z.infer<typeof templateFormSchema>;
```

- [ ] **Step 2:** `openCreateSheet`/`openEditSheet` become `form.reset(defaults)` / `form.reset(mapTemplateToValues(t))`. The price-sync effect at lines 206-216 (with the disabled eslint dep) becomes a watch subscription:

```tsx
useEffect(() => {
  const sub = form.watch((values, { name }) => {
    if (name === "pricePerPerson" && values.pricePerPerson != null && count > 0) {
      form.setValue("priceTotal", values.pricePerPerson * count, { shouldValidate: true });
    }
  });
  return () => sub.unsubscribe();
}, [form, count]);
```

- [ ] **Step 3:** Gate + manual CRUD smoke (create/edit/delete a template on dev). Commit: `refactor(guide): excursions screen on react-hook-form`.

### Task 5.5: Style constants + copy consolidation

**Files:**
- Create: `src/lib/styles.ts`
- Modify: `bid-form-panel.tsx:62`, `guide-excursions-screen.tsx:23` (FIELD_CLASS), `offer-card.tsx`, `traveler-request-detail-screen.tsx`, `trip-card.tsx` (BADGE_CLASS)
- Modify: `src/lib/copy.ts` + the ~10 files with stray strings (notably `"Поездка завершена"` ×3: `traveler/bookings/[bookingId]/page.tsx`, `messaging/SystemEventMessage.tsx`, `notifications/NotificationItem.tsx`)

- [ ] **Step 1:**

```ts
// src/lib/styles.ts — shared class constants (single source for repeated field/badge styling)
export const FIELD_CLASS =
  "min-h-[2.75rem] w-full rounded-xl border border-border bg-surface-high px-3.5 py-2.5 text-sm";
export const BADGE_CLASS = "normal-case tracking-normal text-xs font-medium";
```

(Copy the exact current strings from `bid-form-panel.tsx:62` — the two FIELD_CLASS variants differ by `mt-1.5`; keep margin at call site.)

- [ ] **Step 2:** Add to `copy.ts`: `tripCompleted: "Поездка завершена"`, `makeOffer: "Сделать предложение"`, `closePanel: "Закрыть панель"`, `myExcursions: "Мои экскурсии"`, etc. — replace the literals at each site with `COPY.x`.
- [ ] **Step 3:** Gate. Commit: `refactor(ui): shared style constants + copy.ts consolidation`.

### Task 5.6: Accessibility fixes

**Files:**
- Modify: `src/components/shared/language-multi-select.tsx`, `src/components/shared/theme-icon-chip.tsx` (div→button)
- Modify: `src/features/guide/components/public/guide-photo-grid.tsx`, `.../portfolio/guide-portfolio-screen.tsx`, `src/features/requests/listings/TransferCrossSellWidget.tsx` (alt text)
- Modify: `src/features/guide/components/calendar/MonthlyCalendar.tsx` (label the select)

- [ ] **Step 1:** div→button pattern (keyboard + AT for free):

```tsx
// BEFORE: <div onClick={handleClick} className={chipClass}>
// AFTER:
<button type="button" onClick={handleClick} className={cn(chipClass, "appearance-none")}>
```

- [ ] **Step 2:** Gallery alts: `alt={photo.caption ?? "Фото места от гида"}`; decorative-only images get `alt=""`.
- [ ] **Step 3:** Calendar select: `<label className="sr-only" htmlFor="calendar-month">Месяц</label><select id="calendar-month" ...>`.
- [ ] **Step 4:** Gate. Commit: `fix(a11y): real buttons, image alts, labeled selects`.

### Task 5.7: `<img>` → `next/image` (3 files)

**Files:** Modify: `src/features/traveler/components/requests/offer-card.tsx`, `src/features/traveler/components/trip-card/trip-card.tsx`, `src/features/guide/components/verification/document-upload-card.tsx`

- [ ] **Step 1:** Replace each `<img src={url} className=...>` with:

```tsx
<Image src={url} alt={altText} width={64} height={64} className="rounded-full object-cover" />
```

(Use `fill` + sized parent where dimensions are fluid. Confirm the Supabase storage hostname is already in `next.config.ts` remotePatterns — it is: `*.supabase.co`.)

- [ ] **Step 2:** Gate + visual check. Commit: `perf(images): next/image in offer-card, trip-card, document-upload-card`.

---

## Phase 6 — Performance

### Task 6.1: Lazy-load heavy panels

**Files:** Modify: importers of `bid-form-panel.tsx` (`grep -rn "bid-form-panel" src/`), notification center, dispute forms

- [ ] **Step 1:**

```tsx
import dynamic from "next/dynamic";
const BidFormPanel = dynamic(
  () => import("@/features/guide/components/requests/bid-form-panel").then((m) => m.BidFormPanel),
  { ssr: false, loading: () => <PanelSkeleton /> },
);
```

- [ ] **Step 2:** `bun run build` — compare route JS sizes for the inbox route before/after (build output table). Commit: `perf(bundle): lazy-load bid form panel`.

### Task 6.2: Explicit cache semantics per page

**Files:** Modify: `src/app/(site)/search/page.tsx` (post-move), destination/guide public pages

- [ ] **Step 1:** Search must be fresh: `export const dynamic = "force-dynamic";` at the top of search `page.tsx`.
- [ ] **Step 2:** Public marketing-ish pages get ISR: `export const revalidate = 3600;` on `(site)/destinations/[slug]/page.tsx`, `(site)/guides/[slug]/page.tsx` — **only if** all data reads there are publicly cacheable (no per-user content; verify by reading each page's fetches).
- [ ] **Step 3:** Gate + build. Commit: `perf(cache): explicit dynamic/revalidate per public page`.

### Task 6.3: Missing loading states

**Files:** Create: `src/app/(site)/search/loading.tsx`, `src/app/(site)/listings/[id]/loading.tsx`

- [ ] **Step 1:** Skeletons reusing existing `Skeleton` ui component, mirroring each page's layout grid. Commit: `feat(ux): loading skeletons for search + listing detail`.

---

## Phase 7 — Tests, Docs, Tooling

### Task 7.1: Revive the E2E suite (ERR-059)

**Problem:** `tests/e2e/tripster-v1/*` all `test.skip` — specs hardcode `guide1@provodnik.test/testpass123` but seed creates `guide@provodnik.test/Guide1234!`.

**Files:**
- Create: `tests/e2e/fixtures/users.ts`
- Modify: `scripts/seed-test-users.mjs`, all 6 spec files

- [ ] **Step 1:** Single source of truth:

```ts
// tests/e2e/fixtures/users.ts
export const TEST_USERS = {
  guide: { email: "guide@provodnik.test", password: "Guide1234!" },
  traveler: { email: "traveler@provodnik.test", password: "Traveler1234!" },
  admin: { email: "admin@provodnik.test", password: "Admin1234!" },
} as const;
```

- [ ] **Step 2:** Export the same constants from `scripts/seed-test-users.mjs` (or have it import a shared JSON) so seed and specs cannot drift again. Replace hardcoded creds in the 6 specs with `TEST_USERS.*`, remove `test.skip`.
- [ ] **Step 3:** `bun run playwright:e2e` against local seeded stack — fix residual selector rot test-by-test (timebox: if a spec needs UI work beyond selectors, re-skip it with a dated TODO + new ERR entry rather than stalling the phase).
- [ ] **Step 4:** Commit: `test(e2e): shared user fixtures, unskip tripster-v1 suite`. Update `.claude/sot/ERRORS.md` ERR-059 as resolved.

### Task 7.2: Messaging + request-lifecycle unit tests (coverage gaps)

**Files:**
- Create: `src/lib/supabase/conversations.test.ts` (thread list mapping)
- Create: `src/features/traveler/actions/__tests__/request-lifecycle.test.ts`

- [ ] **Step 1:** Test thread-list mapping with a mocked client (3 threads, one with unread, assert sort + unread flags). Test request state transitions new→sent→offer-received→accepted using the existing state-machine helpers in `src/lib/requests/` (mirror the style of `lib/reviews/state-machine.test.ts` which has 13 cases).
- [ ] **Step 2:** Commit: `test: messaging thread mapping + request lifecycle coverage`.

### Task 7.3: Docs consolidation

**Files:**
- Modify: `docs/ARCHIVE-MANIFEST.md`; move stale dirs
- Decide single source: `docs/product/MVP.md` vs `.claude/sot/KODEX.md`

- [ ] **Step 1:** `docs/_stale/` → add frontmatter `stale: true` per file, or move under `_archive/` with a manifest entry.
- [ ] **Step 2:** Pick `.claude/sot/` as canon for landmines/decisions (it already is operationally); `docs/product/` keeps product specs; add cross-links instead of duplicating. Record in `DECISIONS.md`.
- [ ] **Step 3:** Commit: `docs: archive stale, de-duplicate product canon`.

### Task 7.4: Final sweep + merge

- [ ] **Step 1:** Full gate: `bun run typecheck && bun run lint:ratchet && bun run test:run && bun run playwright:e2e`.
- [ ] **Step 2:** `bun run build` and dev-server click-through: `/`, `/form`, `/search`, guide inbox → offer, traveler request → accept, messaging thread, admin moderation.
- [ ] **Step 3:** `superpowers:requesting-code-review` on the branch diff; fix findings.
- [ ] **Step 4:** Squash-merge to main with orchestrator-authored message; pre-push trailer scan; push per project convention (`git push --no-verify origin main` after green gates).
- [ ] **Step 5:** SOT gate: new ERR/AP entries for everything learned; Slack dev-note; memory update.

---

## Execution map (suggested order & sizing)

| Phase | Tasks | Risk | Parallelizable? |
|---|---|---|---|
| 0 Safety net | 0.1 | none | — |
| 1 Security | 1.1–1.5 | low | 1.1/1.2/1.3 in parallel worktrees |
| 2 Dead weight | 2.1–2.4 | trivial | yes |
| 3 Error/obs | 3.1–3.4 | medium (touches all actions) | 3.2/3.3/3.4 after 3.1 |
| 4 Architecture | 4.1–4.8 | medium-high (route moves) | 4.1, 4.6, 4.7 parallel; 4.2→4.3→4.4 sequential |
| 5 UI quality | 5.1–5.7 | low-medium | mostly parallel |
| 6 Performance | 6.1–6.3 | low | yes |
| 7 Tests/docs | 7.1–7.4 | low | 7.1 long-pole, start early if staffed |

Stop-points: every phase boundary is shippable. If only one week is available, Phases 1–3 deliver the highest production-risk reduction.
