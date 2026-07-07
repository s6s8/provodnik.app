# Quarantine ledger — deslop 2026-07-07

These symbols are **0-reference dead today** but deliberately **NOT deleted**. Re-check date: **2026-10-01** (or when the owning feature is decided).

## A. WIP scaffolding — preserved per operator decision (favorites / notify* / template photos / moderation-case)
Left in place (removing a single export from a live file is not cleanly reversible; a ledger entry is). If the feature is confirmed abandoned, delete in a follow-up.

| Symbol | File | Feature it scaffolds |
|---|---|---|
| `getUserFavorites`, `toggleFavorite` | src/data/supabase/queries.ts | Favorites |
| `getActiveFavoritesUserId` | src/data/favorites/active-user.ts (whole file → moved to .refactor/quarantine/) | Favorites |
| `notifyBookingConfirmed`, `notifyReviewRequested` | src/lib/notifications/triggers.ts | Notifications triggers |
| `listNotificationsForCurrentUserFromSupabase`, `markNotificationReadInSupabase` | src/data/notifications/supabase.ts | Notifications read/write |
| `uploadTemplatePhoto`, `deleteTemplatePhoto` | src/data/guide-templates/supabase-client.ts | Guide-template photos |
| `getModerationCases`, `getModerationCase`, `createModerationCase` + case types (ModerationCaseRow/…/AdminDashboardStats) | src/lib/supabase/moderation.ts | Moderation-case console |
| `ensureGuideDocumentReservations`, `ensureListingCoverReservation`, `updateGuideLocationPhotoOrders`, `listListingMediaReservationsForGuide` | src/data/guide-assets/supabase-client.ts | Storage reservations (MED — storage side effects) |

## B. Deferred to the open-tasks security work (do NOT touch here — collides with #34/#35 auth fixes)
| Symbol | File | Reason |
|---|---|---|
| `getWorkspacePrefixForRole`, `isProtectedRolePathname`, `isRoleDashboardPathname`, `getRedirectPathForRole`, `ROLE_DASHBOARD_PATHS`, `ROLE_WORKSPACE_PREFIXES` | src/lib/auth/role-routing.ts | Auth routing — touching now risks the pending #34 relogin / #35 blocked-user fixes |
| `readJwtRole`, `isAdminAuthUser` | src/lib/auth/admin-access.ts | Auth role resolution — same |
| `assertTransition`, `isTripsterStatus`, `assertReviewTransition`, `assertReplyTransition`, `assertListingTransition`, `isModerationStatus` | src/lib/{requests,reviews,moderation}/state-machine.ts | **Real bug, not just dead code:** these transition guards are never wired → status transitions are currently unguarded. Hand to security/product; do not silently delete the safety scaffold. |

## C. Orphaned by this pass (candidates for the next sweep)
- `createDemoSession`, `serializeDemoSessionCookieValue` in src/lib/demo-session.ts — only the two removed writers used them; now export-orphaned. Verify + remove next.
