# Nav Context Architecture — Design Spec
_2026-04-23 | Status: approved, pending implementation_

## Problem

`SiteHeader` selects nav links by user role only. A traveler logged in on a public page (e.g. `/requests`, `/destinations`, `/guides`) receives `travelerNavLinks` — which omits "Гиды." Plan 03 required "Гиды" removed only inside `/traveler/*` cabinet pages.

Root cause: role ≠ context. The header doesn't know whether the traveler is browsing the public marketplace or managing their cabinet. That distinction lives in the layout, not in the header.

## Decision

**Layout-driven context prop on `SiteHeader`.** The `/traveler` cabinet layout passes `context="traveler-cabinet"`. All other layouts pass nothing (default public behavior). Nav selection keys off `context` + role, not path inference.

This is the permanent architecture. No path-based workarounds.

## Implementation

### 1. `SiteHeader` — add `context` prop

File: `src/components/shared/site-header.tsx`

```tsx
interface SiteHeaderProps {
  isAuthenticated?: boolean;
  role?: AppRole | null;
  email?: string | null;
  canonicalRedirectTo?: AuthRedirectTarget | null;
  userId?: string | null;
  context?: 'traveler-cabinet' | null;  // ← new, optional
}
```

Nav link selection (replaces current ternary at lines 101 + 196):

```tsx
function resolveNavLinks(
  isAuthenticated: boolean,
  role: AppRole | null,
  context: 'traveler-cabinet' | null
) {
  if (isAuthenticated && role === 'guide') return guideNavLinks;
  if (isAuthenticated && role === 'traveler' && context === 'traveler-cabinet') return travelerNavLinks;
  if (isAuthenticated) return navLinks;           // traveler on public pages, admin
  return unauthNavLinks;
}
```

Apply `resolveNavLinks(isAuthenticated, role, context)` in both the desktop `<ul>` and the mobile sheet `<nav>`. Replace the inline ternary chain in both places.

### 2. Traveler cabinet layout — pass context

File: `src/app/(protected)/traveler/layout.tsx`

Find where `SiteHeader` is rendered and add `context="traveler-cabinet"`:

```tsx
<SiteHeader
  isAuthenticated={isAuthenticated}
  role={role}
  email={email}
  canonicalRedirectTo={canonicalRedirectTo}
  userId={userId}
  context="traveler-cabinet"
/>
```

If `SiteHeader` is rendered in a parent layout (`(protected)/layout.tsx`) that covers both guide and traveler, the context prop should be threaded down from a traveler-specific sub-layout. Check the layout hierarchy first.

### 3. No other layouts change

- `(protected)/guide/*` — guide layout doesn't need a context prop; `role === 'guide'` already routes to `guideNavLinks`
- `(public)/layout.tsx`, `(site)/layout.tsx`, `(home)/layout.tsx` — no changes; no context prop → public nav

## Files touched

| File | Change |
|------|--------|
| `src/components/shared/site-header.tsx` | Add `context` prop + `resolveNavLinks()` helper; apply in desktop ul + mobile sheet |
| `src/app/(protected)/traveler/layout.tsx` | Pass `context="traveler-cabinet"` to SiteHeader |

Possibly also: `src/app/(protected)/layout.tsx` if SiteHeader lives there and needs the prop threaded.

## Verification

1. Logged-in traveler on `/requests` → header shows Запросы, Направления, **Гиды** ✅
2. Logged-in traveler on `/traveler/requests` → header shows Мои запросы, Направления (no Гиды) ✅
3. Logged-in traveler on `/destinations` → header shows Запросы, Направления, **Гиды** ✅
4. Unauthenticated visitor on any page → header shows Как это работает, Стать гидом ✅
5. Logged-in guide on any page → header shows Входящие, Заказы, Предложения, Календарь, Статистика ✅
6. Mobile sheet: same nav sets as desktop for all cases above ✅
7. `bun run typecheck` → 0 errors ✅
8. `bun run lint` → 0 errors ✅

## Why not path-based inference

- The layout already knows what it is — inferring it from `pathname` is guessing what's declared elsewhere
- Path strings are fragile; a rename breaks the guard silently
- `resolveNavLinks()` with explicit props is pure and unit-testable; path matching is not
- Scales: future cabinet pages (billing, reviews) inherit correct nav for free without touching SiteHeader

## Why not a separate CabinetHeader component

- At current scale, one SiteHeader with a single optional prop is simpler
- If the cabinet header diverges significantly post-launch (e.g. adds breadcrumbs, step indicators), extract then — YAGNI
