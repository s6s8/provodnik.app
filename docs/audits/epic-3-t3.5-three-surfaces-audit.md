# Epic 3 · T3.5 — Three suspect surfaces audit (2026-05-28)

## Guide catalog (`src/app/(site)/guides/page.tsx`, `src/features/guide/components/public/public-guides-grid.tsx`)
- resolveDisplayName: yes (was: guide records already resolved in `mapGuideRow`, now: unchanged)
- ProfileAvatar: yes (was: inline shadcn `Avatar`/`AvatarImage`/`AvatarFallback`, now: `ProfileAvatar` with `size={56}`)
- «Гид» literal: absent as a display name

## Specific guide page (`src/app/(site)/guides/[slug]/page.tsx`, `src/features/guide/components/public/guide-profile-screen.tsx`)
- resolveDisplayName: yes (was: `getGuideBySlug` feeds through `mapGuideRow`, now: unchanged)
- ProfileAvatar: no (the visible guide image is a 3:4 portrait hero, not a circular square avatar; `ProfileAvatar` is intentionally not used here)
- «Гид» literal: absent as a display name

## Notifications (`src/app/(protected)/notifications/page.tsx`, `src/features/notifications/components/notification-center-screen.tsx`, `src/features/notifications/components/NotificationItem.tsx`, `src/features/notifications/components/NotificationBell.tsx`)
- resolveDisplayName: no (was: no profile display names rendered, now: unchanged)
- ProfileAvatar: no (was: no profile avatars rendered, now: unchanged)
- «Гид» literal: absent

Resulting actions:
- `src/features/guide/components/public/public-guides-grid.tsx` now renders guide catalog cards through `ProfileAvatar`.
- `docs/audits/epic-3-t3.5-three-surfaces-audit.md` records the three-surface audit.
