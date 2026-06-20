# 22 public-guide-card (S-3 + R-3 + R-5) — cursorSDK
SCOPE: canonical guide list card (name + face the guide).
FILES: create src/components/shared/public-guide-card.tsx.
WHAT: non-selectable link card reusing GuideOfferCard's look — guide photo + name (always), verified badge, RatingDisplay (new-but-vetted at 0), experience, specialties, trips/%recommend. Wraps next/link → /guides/{slug}.
VERIFY: render test (name+photo present, links to slug, hides rating at 0).
COMMIT: `feat(ui): PublicGuideCard for guide directory`

