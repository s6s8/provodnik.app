# 29 guides (V-3 + R-2 + R-5) — cursorSDK
SCOPE: immersive guide directory.
FILES: public-guides-grid.tsx; src/data/supabase/queries.ts getGuides (select trips_completed/recommend_pct/verified from v_guide_public_profile — NO migration, columns exist).
WHAT: ListHero + search; replace inline cards with PublicGuideCard (name+face); RatingDisplay (fixes ★0); demote "Стать гидом" to a single subordinate strip; loading/empty states.
VERIFY: live — rich guide cards, no zero-star, search preserved.
COMMIT: `feat(guides): immersive directory + PublicGuideCard`

