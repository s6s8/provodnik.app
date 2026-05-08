# Sentry Client Error Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate 3 unhandled client-side errors in Sentry by adding error callbacks to Supabase Realtime subscriptions and wrapping two network calls in try/catch.

**Architecture:** Three independent, surgical fixes. No new files, no new dependencies, no behaviour change under normal conditions. Each fix degrades gracefully: on failure the component shows stale/zero data instead of crashing.

**Tech Stack:** `@supabase/supabase-js@^2.99.1` · `@supabase/ssr@^0.9.0` · Vitest 4 + jsdom + @testing-library/react · React 19

---

## File Map

| File | Change |
|------|--------|
| `src/features/notifications/components/NotificationBell.tsx` | Add `(status, err)` callback to `.subscribe()` |
| `src/features/notifications/components/NotificationBell.test.tsx` | New — verify subscribe callback is wired |
| `src/features/messaging/hooks/use-unread-count.ts` | Wrap `fetch()` in try/catch inside `refetch` |
| `src/features/messaging/hooks/use-unread-count.test.ts` | New — verify fetch throw returns zero count |
| `src/features/homepage/components/homepage-request-form.tsx` | Wrap `supabase.auth.getUser()` in try/catch in `onSubmit` |
| `src/features/homepage/components/homepage-request-form.test.tsx` | New — verify auth gate opens on getUser throw |

---

## Task 1: NotificationBell — Realtime subscribe error callback

**Files:**
- Modify: `src/features/notifications/components/NotificationBell.tsx`
- Create: `src/features/notifications/components/NotificationBell.test.tsx`

### Background

`REALTIME_SUBSCRIBE_STATES` from `@supabase/realtime-js` is a string enum:
```
SUBSCRIBED = "SUBSCRIBED"
TIMED_OUT  = "TIMED_OUT"
CLOSED     = "CLOSED"
CHANNEL_ERROR = "CHANNEL_ERROR"
```

The subscribe method signature (from installed types at `node_modules/@supabase/realtime-js/dist/main/RealtimeChannel.d.ts`):
```ts
subscribe(
  callback?: (status: REALTIME_SUBSCRIBE_STATES, err?: Error) => void,
  timeout?: number
): RealtimeChannel
```

When a WebSocket handshake fails the SDK emits `CHANNEL_ERROR` and **automatically retries** — no manual reconnect needed. Without a callback the status emission is a no-op, but the failed WebSocket upgrade itself surfaces as an unhandled `TypeError: NetworkError` in Firefox.

- [ ] **Step 1: Write the failing test**

Create `src/features/notifications/components/NotificationBell.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it, vi, type Mock } from "vitest";

// Must be declared BEFORE the module is imported so vi.mock hoisting picks it up
const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
const mockOn = vi.fn().mockReturnThis();
const mockChannel = vi.fn().mockReturnValue({ on: mockOn, subscribe: mockSubscribe });

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    channel: mockChannel,
    // Mock the initial notifications load chain:
    // .from().select().eq().eq().neq().order().limit() → { data: [], error: null }
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            neq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      }),
    }),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
}));

import { NotificationBell } from "./NotificationBell";

describe("NotificationBell", () => {
  it("passes an error callback to .subscribe()", () => {
    render(<NotificationBell userId="user-123" />);

    expect(mockSubscribe).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it("callback does not throw when called with CHANNEL_ERROR", () => {
    render(<NotificationBell userId="user-123" />);

    const callback = (mockSubscribe as Mock).mock.calls[0][0] as (
      status: string,
      err?: Error
    ) => void;

    expect(() =>
      callback("CHANNEL_ERROR", new Error("WebSocket handshake failed"))
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd provodnik.app && bun run test:run -- NotificationBell.test
```

Expected: FAIL — `subscribe` called with 0 arguments, test fails on `expect.any(Function)`.

- [ ] **Step 3: Implement the fix in `NotificationBell.tsx`**

Find the `.subscribe()` call (currently at the end of the `useEffect` channel setup, around line 91) and add the callback:

```tsx
// BEFORE
const channel = supabase
  .channel("notifications")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      const row = payload.new as NotificationRow2;
      if (row.channel !== IN_APP_NOTIFICATION_CHANNEL || row.status === "read") return;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === row.id)) return prev;
        return [row, ...prev].slice(0, 20);
      });
    },
  )
  .subscribe();

// AFTER
const channel = supabase
  .channel("notifications")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      const row = payload.new as NotificationRow2;
      if (row.channel !== IN_APP_NOTIFICATION_CHANNEL || row.status === "read") return;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === row.id)) return prev;
        return [row, ...prev].slice(0, 20);
      });
    },
  )
  .subscribe((status, err) => {
    if (status === "CHANNEL_ERROR") {
      console.error("[NotificationBell] realtime error:", err);
    }
  });
```

No import needed — `"CHANNEL_ERROR"` is a string literal that satisfies the `REALTIME_SUBSCRIBE_STATES` enum type.

- [ ] **Step 4: Run test — verify it passes**

```bash
bun run test:run -- NotificationBell.test
```

Expected: PASS — both tests green.

- [ ] **Step 5: Typecheck**

```bash
bun run typecheck
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/notifications/components/NotificationBell.tsx \
        src/features/notifications/components/NotificationBell.test.tsx
git commit -m "fix(notifications): handle realtime CHANNEL_ERROR in NotificationBell subscribe"
```

---

## Task 2: use-unread-count — fetch try/catch

**Files:**
- Modify: `src/features/messaging/hooks/use-unread-count.ts`
- Create: `src/features/messaging/hooks/use-unread-count.test.ts`

### Background

`fetch()` throws a `TypeError` at the network level (DNS failure, offline, connection reset) before an HTTP response exists. The current `if (!response.ok)` guard never runs in that case. The exception propagates out of the `refetch` callback → unhandled rejection → Sentry.

The fix wraps the entire fetch block in try/catch and sets state to safe zero values on any throw.

- [ ] **Step 1: Write the failing test**

Create `src/features/messaging/hooks/use-unread-count.test.ts`:

```ts
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({}),
    }),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  }),
}));

import { useUnreadCount } from "./use-unread-count";

describe("useUnreadCount", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns unreadCount 0 when fetch throws a network error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(
      new TypeError("Failed to fetch")
    );

    const { result } = renderHook(() => useUnreadCount(true));

    await waitFor(() => {
      // Hook has settled after fetch threw
      expect(result.current.unreadCount).toBe(0);
    });
  });

  it("returns unreadCount 0 when fetch returns non-ok response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 })
    );

    const { result } = renderHook(() => useUnreadCount(true));

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(0);
    });
  });

  it("returns unreadCount from successful fetch", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ unreadCount: 3, userId: "u-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { result } = renderHook(() => useUnreadCount(true));

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(3);
    });
  });
});
```

- [ ] **Step 2: Run test — verify first test fails**

```bash
bun run test:run -- use-unread-count.test
```

Expected: FAIL on the "fetch throws" case — unhandled rejection propagates, test errors.

- [ ] **Step 3: Implement the fix in `use-unread-count.ts`**

Replace the `refetch` callback body. Full replacement of the `useCallback` block:

```ts
const refetch = useCallback(async () => {
  if (!enabled || !hasSupabaseEnv()) {
    setUnreadCount(0);
    setUserId(null);
    return;
  }

  try {
    const response = await fetch("/api/messages/unread-count", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      setUnreadCount(0);
      setUserId(null);
      return;
    }

    const payload = (await response.json()) as UnreadCountResponse;
    setUnreadCount(payload.unreadCount);
    setUserId(payload.userId);
  } catch {
    setUnreadCount(0);
    setUserId(null);
  }
}, [enabled]);
```

- [ ] **Step 4: Run test — verify all three pass**

```bash
bun run test:run -- use-unread-count.test
```

Expected: PASS — all 3 tests green.

- [ ] **Step 5: Typecheck**

```bash
bun run typecheck
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/messaging/hooks/use-unread-count.ts \
        src/features/messaging/hooks/use-unread-count.test.ts
git commit -m "fix(messaging): catch network errors in useUnreadCount fetch"
```

---

## Task 3: HomepageRequestForm — auth.getUser try/catch

**Files:**
- Modify: `src/features/homepage/components/homepage-request-form.tsx`
- Create: `src/features/homepage/components/homepage-request-form.test.tsx`

### Background

`supabase.auth.getUser()` makes a network request to the Supabase Auth server to verify the JWT. If the network is unavailable it throws a `TypeError`. The current `onSubmit` has no try/catch, so the throw becomes an unhandled rejection.

The safe fallback is to treat a thrown `getUser` as "user unknown → show auth gate". The form data is already serialised into `fd` at that point and will be stored in `pendingFormData` for re-submission after the user authenticates.

`getUser()` return type: `Promise<{ data: { user: User | null }; error: AuthError | null }>`. It does not return on a network throw — it throws.

- [ ] **Step 1: Write the failing test**

Create `src/features/homepage/components/homepage-request-form.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("@/app/(protected)/traveler/requests/new/actions", () => ({
  createRequestAction: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/dates", () => ({
  todayMoscowISODate: () => "2026-01-01",
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
}));

// HomepageAuthGate renders a dialog — stub it to a simple sentinel
vi.mock("./homepage-auth-gate", () => ({
  HomepageAuthGate: ({ open }: { open: boolean }) =>
    open ? <div data-testid="auth-gate-open" /> : null,
}));

import { HomepageRequestForm } from "./homepage-request-form";

function fillMinimalForm() {
  fireEvent.change(screen.getByLabelText(/город/i), {
    target: { value: "Москва" },
  });
  fireEvent.change(screen.getByLabelText(/дата/i), {
    target: { value: "2026-06-01" },
  });
}

describe("HomepageRequestForm", () => {
  it("opens auth gate when getUser throws a network error", async () => {
    mockGetUser.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    render(<HomepageRequestForm destinations={[]} />);
    fillMinimalForm();
    fireEvent.click(screen.getByRole("button", { name: /найти гида/i }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-gate-open")).toBeInTheDocument();
    });
  });

  it("opens auth gate when getUser returns null user (not logged in)", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    render(<HomepageRequestForm destinations={[]} />);
    fillMinimalForm();
    fireEvent.click(screen.getByRole("button", { name: /найти гида/i }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-gate-open")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test — verify first test fails**

```bash
bun run test:run -- homepage-request-form.test
```

Expected: FAIL on the "getUser throws" case — unhandled rejection causes test error.

- [ ] **Step 3: Implement the fix in `homepage-request-form.tsx`**

Replace the `onSubmit` function. Find the existing `onSubmit` (around line 110) and replace it entirely:

```ts
const onSubmit = async (values: FormValues) => {
  const fd = new FormData();
  fd.set("mode", values.mode);
  for (const i of values.interests) {
    fd.append("interests[]", i);
  }
  fd.set("destination", values.destination);
  fd.set("startDate", values.startDate);
  fd.set("startTime", values.startTime ?? "");
  fd.set("endTime", values.endTime ?? "");
  if (values.mode === "assembly") {
    fd.set("groupSizeCurrent", String(values.groupSizeCurrent ?? 1));
    if (values.groupMax) fd.set("groupMax", String(values.groupMax));
  } else {
    fd.set("groupSize", String(values.groupSize ?? 1));
  }
  fd.set(
    "allowGuideSuggestionsOutsideConstraints",
    String(values.allowGuideSuggestionsOutsideConstraints),
  );
  fd.set("budgetPerPersonRub", String(values.budgetPerPersonRub));
  fd.set("notes", values.notes ?? "");

  try {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await submitWithFormData(fd);
    } else {
      setPendingFormData(fd);
      setAuthGateOpen(true);
    }
  } catch {
    // Network failure while checking auth — treat as unauthenticated.
    // Form data is preserved in pendingFormData for resubmission after sign-in.
    setPendingFormData(fd);
    setAuthGateOpen(true);
  }
};
```

- [ ] **Step 4: Run test — verify both tests pass**

```bash
bun run test:run -- homepage-request-form.test
```

Expected: PASS — both tests green.

- [ ] **Step 5: Run full test suite**

```bash
bun run test:run
```

Expected: all pre-existing tests still pass. 0 new failures.

- [ ] **Step 6: Typecheck**

```bash
bun run typecheck
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/homepage/components/homepage-request-form.tsx \
        src/features/homepage/components/homepage-request-form.test.tsx
git commit -m "fix(homepage): catch getUser network error in HomepageRequestForm onSubmit"
```

---

## Post-Implementation Verification

After all three tasks are committed and pushed:

- [ ] Verify Sentry — after one logged-in Firefox session on provodnik.app, confirm issues 113533003, 114224805, 114372012 produce no new events
- [ ] Check Sentry dashboard stays at 0 unresolved issues:

```bash
curl -s "https://de.sentry.io/api/0/projects/na-3z2/javascript-nextjs/issues/?query=is:unresolved&limit=10" \
  -H "Authorization: Bearer sntryu_REDACTED_2026-05-08_see_env_local" | \
  node -e "const d=JSON.parse(require('fs').readFileSync('D:/dev2/sentry-verify.json','utf8')); console.log('Open issues:', d.length);" 2>/dev/null || \
curl -s "https://de.sentry.io/api/0/projects/na-3z2/javascript-nextjs/issues/?query=is:unresolved&limit=10" \
  -H "Authorization: Bearer sntryu_REDACTED_2026-05-08_see_env_local" | \
  python -c "import sys,json; d=json.load(sys.stdin); print('Open issues:', len(d))"
```
