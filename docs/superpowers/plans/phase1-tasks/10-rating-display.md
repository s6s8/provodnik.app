# 10 rating-display (P0-1 + R-3 cold-start) — cursorSDK
SCOPE: kill the zero-rating trust-killer; add a reusable RatingDisplay with a "new but vetted" zero state.
FILES (≤5): create src/components/shared/rating-display.tsx; update consumers that print stars (public-guides-grid, guide-profile-screen, search/listing cards, destination cards).
WHAT: RatingDisplay({rating, reviewCount, verified?, responseLabel?, experienceLabel?}). reviewCount>0 → amber star + rating.toFixed(1) + "· N {pluralize отзыв}". reviewCount===0 → a "Новый гид" chip PAIRED with verified badge + response/experience signals (NOT "★0"/"0.0"). On guide profile, suppress "0 поездок"/"0.0 рейтинг" stat blocks at zero. Semantic tokens only.
VERIFY: unit test (0→no stars+"Новый гид"; 3→stars+count); live — 0-review guide shows "Новый гид", reviewed shows stars.
COMMIT: `fix(trust): RatingDisplay + new-but-vetted zero state`

