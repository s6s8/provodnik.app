---
name: provodnik-z-index
description: Use ONLY when adding modals, drawers, dialogs, popovers, backdrops, or any overlay component in apps/provodnik/code. Covers ERR-094 — Tailwind z-40/z-50 stacks BELOW fixed layout chrome; use z-[110] for backdrop, z-[120] for panel.
---

# Overlay z-index floor in provodnik

### ERR-094 — Overlay z-index: z-40/z-50 render behind fixed layout chrome
**Never** use standard Tailwind `z-40` / `z-50` for overlay backdrops or modal panels. The provodnik.app layout contains one or more fixed-position elements above `z-50`; any overlay at those values renders behind them — a silent visual bug with no console error. Caught in `BidFormPanel` (ERR-094, 2026-05-20).
**Always** use the project z-index tier:
- Overlay backdrop → `z-[110]`
- Overlay panel / dialog → `z-[120]`

Applies to any `position: fixed` element intended to cover the full page (modals, drawers, bottom sheets, lightboxes). Reference implementation: `src/features/guide/components/requests/bid-form-panel.tsx`. See also PATTERNS.md — Project Z-Index Tier Pattern.

```tsx
// CORRECT — clears fixed layout chrome
<div className="fixed inset-0 z-[110] bg-black/50" />  {/* backdrop */}
<div className="fixed inset-y-0 right-0 z-[120] w-96 bg-white"> {/* panel */}

// WRONG — backdrop and panel render behind fixed layout chrome
<div className="fixed inset-0 z-40 bg-black/50" />
<div className="fixed inset-y-0 right-0 z-50 w-96 bg-white">
```