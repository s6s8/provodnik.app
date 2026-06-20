# 19 admin-badge (B-4) — cursorSDK
SCOPE: replace undefined `booking-badge` CSS classes with shared Badge.
FILES: admin/guides/page.tsx, admin/guides/[id]/page.tsx, admin/listings/page.tsx (+ verificationBadgeClass helper).
WHAT: swap the no-op booking-badge* classes for <Badge variant=…> + status label (semantic colors).
VERIFY: typecheck/lint; live admin pages show styled status badges.
COMMIT: `fix(admin): replace undefined booking-badge classes with Badge`

