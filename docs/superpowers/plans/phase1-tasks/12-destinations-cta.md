# 12 destinations-cta (P0-3) — cursorSDK
SCOPE: fix dead "Найти гида" CTA + remove hardcoded season/theme chips.
FILES: src/features/destinations/components/destination-detail-screen.tsx.
WHAT: point "Найти гида" → /guides?region={region} (or /search?city={name}); make it the single primary CTA, demote "Смотреть маршруты" to secondary. Delete the hardcoded "Лучший сезон…" + "Природа·Культура·Гастрономия" chips (zero fabrication) unless backed by real data fields.
VERIFY: live — CTA lands on a filtered view; no fake chips.
COMMIT: `fix(destinations): real CTA target + remove hardcoded chips`

