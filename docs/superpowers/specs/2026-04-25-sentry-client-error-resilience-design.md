# Spec: Client-Side Error Resilience (Sentry Issues Fix)
> 2026-04-25 | Status: DRAFT

## Problem

Sentry shows 3 unhandled client-side errors across `NotificationBell`, `use-unread-count`, and `HomepageRequestForm`. All three share the same root cause: async operations that can throw at the network level have no error handling, so failures propagate as unhandled promise rejections captured by Sentry with no stack trace and no user-visible feedback.

The errors were identified from Sentry org `na-3z2` / project `javascript-nextjs`:

| Sentry ID | Error | Page | Browser | Hits |
|-----------|-------|------|---------|------|
| 113533003 | `TypeError: NetworkError when attempting to fetch resource.` | 8 pages (all where NotificationBell renders) | Firefox 149 | 13 |
| 114224805 | `TypeError: Failed to fetch` | `/traveler/requests/:requestId` | Chrome 147 | 1 |
| 114372012 | `TypeError: Load failed` | `/traveler/dashboard` | Mobile Safari 26.2 | 1 |

Issue 111792490 (PGRST200 FK error) was already fixed in commit `0cd4bfe` and has been resolved in Sentry.

## Root Causes

### 1. `NotificationBell.tsx` — Supabase Realtime `.subscribe()` unhandled

`NotificationBell` lives in `SiteHeader` and renders on every page for authenticated users. It opens a Supabase Realtime WebSocket channel with no error callback:

```ts
// current — no error handler
const channel = supabase
  .channel("notifications")
  .on("postgres_changes", { ... }, handler)
  .subscribe();
```

When the WebSocket handshake fails (network drop, Supabase Realtime temporarily unavailable, Firefox's stricter WebSocket handling), the `.subscribe()` emits status `CHANNEL_ERROR`. Without a callback, this surfaces as an unhandled rejection → Sentry captures it with no useful stack. The client SDK retries automatically — no data is lost — but the unhandled error fires on every page navigation for the affected session.

**Supabase Realtime subscribe callback API** (from official docs):
```ts
channel.subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR', err?: Error) => void)
```
`CHANNEL_ERROR` means the client will automatically retry. No manual reconnect needed — just handle it gracefully.

### 2. `use-unread-count.ts` — `fetch()` not wrapped in try/catch

```ts
// current — network throw propagates unhandled
const response = await fetch("/api/messages/unread-count", { cache: "no-store" });
if (!response.ok) { setUnreadCount(0); return; }
```

`if (!response.ok)` handles HTTP errors (4xx/5xx) but not network-level throws. When `fetch()` itself throws (`TypeError: Failed to fetch` / `Load failed`), the exception propagates out of `refetch()` → unhandled rejection → Sentry.

### 3. `homepage-request-form.tsx` — `supabase.auth.getUser()` not wrapped

```ts
// current — can throw on network failure
const { data: { user } } = await supabase.auth.getUser();
```

If the Supabase auth endpoint is unreachable when the user submits the form, `getUser()` throws. The outer `onSubmit` has no try/catch, so the error propagates unhandled.

## Solution

Three targeted fixes, each file independent. No schema changes, no new dependencies, no feature additions.

### Fix 1 — `NotificationBell.tsx`: add subscribe status callback

Wire the status callback to `.subscribe()`. On `CHANNEL_ERROR`, log silently — the SDK handles retry automatically. No user-visible change; the bell still renders and loads existing notifications from the initial fetch.

```ts
const channel = supabase
  .channel("notifications")
  .on("postgres_changes", { ... }, handler)
  .subscribe((status, err) => {
    if (status === "CHANNEL_ERROR") {
      console.error("[NotificationBell] realtime error:", err);
    }
  });
```

**Degraded state:** If realtime never connects, the bell shows notifications from the initial load only. New notifications don't appear live until page refresh. Acceptable — the alternative is a silent crash.

### Fix 2 — `use-unread-count.ts`: wrap `fetch()` in try/catch

```ts
const refetch = useCallback(async () => {
  if (!enabled || !hasSupabaseEnv()) { setUnreadCount(0); setUserId(null); return; }
  try {
    const response = await fetch("/api/messages/unread-count", { cache: "no-store" });
    if (!response.ok) { setUnreadCount(0); setUserId(null); return; }
    const payload = (await response.json()) as UnreadCountResponse;
    setUnreadCount(payload.unreadCount);
    setUserId(payload.userId);
  } catch {
    setUnreadCount(0);
    setUserId(null);
  }
}, [enabled]);
```

**Degraded state:** Unread badge shows 0. No crash, no Sentry noise.

### Fix 3 — `homepage-request-form.tsx`: wrap `supabase.auth.getUser()` in try/catch

```ts
const onSubmit = async (values: FormValues) => {
  // ... build fd ...
  try {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await submitWithFormData(fd);
    } else {
      setPendingFormData(fd);
      setAuthGateOpen(true);
    }
  } catch {
    // Network failure checking auth — treat as unauthenticated, show auth gate
    setPendingFormData(fd);
    setAuthGateOpen(true);
  }
};
```

**Degraded state:** On auth check failure, user sees the sign-in gate. They can sign in and their form data is preserved via `pendingFormData`. Better than a silent crash.

## Files Changed

| File | Change |
|------|--------|
| `src/features/notifications/components/NotificationBell.tsx` | Add `(status, err) => {}` callback to `.subscribe()` |
| `src/features/messaging/hooks/use-unread-count.ts` | Wrap `fetch()` call in try/catch inside `refetch` |
| `src/features/homepage/components/homepage-request-form.tsx` | Wrap `supabase.auth.getUser()` in try/catch in `onSubmit` |

## Out of Scope

- Supabase Realtime reconnection tuning (SDK handles this automatically)
- Toast/UI notification of degraded state (silent degradation is appropriate for background features)
- Other client-side fetch calls across the codebase (this spec covers the three Sentry-confirmed failures only)

## Verification

1. Open browser DevTools → Network → set to "Offline" → navigate to homepage while logged in → no unhandled rejection in console
2. Open DevTools → Network → block `wss://yjzpshutgmhxizosbeef.supabase.co` → NotificationBell renders without crash
3. `bun run typecheck` passes (subscribe callback signature matches `(status: string, err?: Error) => void`)
4. Sentry issue count drops to 0 after deploy + one full test session in Firefox
