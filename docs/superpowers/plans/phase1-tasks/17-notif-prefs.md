# 17 notif-prefs (B-2) — cursorSDK
SCOPE: load saved notification prefs (not {}) + surface save errors + 44px targets.
FILES: src/app/(protected)/account/notifications/page.tsx, NotificationPrefsMatrix.
WHAT: fetch the user's saved prefs on mount and seed state from them; surface save failures (inline/toast, not silent); wrap switches to ≥44px hit area.
VERIFY: unit test (seeded prefs render; save-failure surfaces error); live — existing prefs pre-populate.
COMMIT: `fix(account): load saved notification prefs + error surfacing`

