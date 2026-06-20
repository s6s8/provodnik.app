# 11 destinations-dedup (P0-2) — cursorSDK
SCOPE: fix "Москва Москва Москва" on destination cards.
FILES: src/features/destinations/components/destinations-grid.tsx (+ card subcomponent).
WHAT: render city once; show region only when it differs from city; drop the duplicate label node.
VERIFY: live — one city + (distinct) region per card.
COMMIT: `fix(destinations): de-duplicate city/region label`

