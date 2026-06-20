# 15 restore-form (P0-6) — cursorSDK
SCOPE: restore the deleted /form manual request route (reachability; old styling OK — refactor is task 25).
FILES (≤5): create src/app/(home)/form/page.tsx (recover via `git show 06021e15^:src/app/(home)/form/page.tsx` — mounts SiteHeaderServer + HomePageShell2Classic with getActiveGuideDestinations + getHomepageRequests); remove the `/form → /` redirect in next.config.ts:51; repoint hero-conversation.tsx:263 link href "/" → "/form".
WHAT: make /form load the manual form again; confirm createRequestAction wires.
VERIFY: live — /form loads (no 301 to /); homepage "Обычная форма" link lands on it; submit creates a request.
COMMIT: `fix(form): restore manual /form route + repoint homepage link`

