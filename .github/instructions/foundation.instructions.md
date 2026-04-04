---
applyTo: "src/app/layout.tsx,src/app/globals.css,src/app/(home)/**,src/app/(site)/**,src/app/(protected)/layout.tsx,src/components/**,src/features/home/**,src/features/homepage/**"
---

Preserve the current shared shell and visual system.

Prefer server components by default. Add `"use client"` only when hooks, browser APIs, or client-side interactivity are required.

Keep shared chrome in `src/components/shared` and app-wide providers in `src/components/providers`.

Do not move feature-specific logic into shared components.

If you change global layout, route groups, provider shape, or design tokens, update `docs/architecture/module-map.md`.
