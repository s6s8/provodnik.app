# 13 route-arrows (P0-4) — cursorSDK
SCOPE: ASCII `->` → `→` in itineraries/routes.
FILES: the itinerary/route renderer(s) for listing cards + /listings/[id] (search ListingCard, ExcursionShapeDetail route section).
WHAT: replace the literal `->` separator with `→` at the render layer; do NOT mutate DB data.
VERIFY: live — routes read "A → B → C".
COMMIT: `fix(listings): render route separators as →`

