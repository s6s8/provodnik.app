# 14 search-slugs (P0-5 + R-1 zero-results) — cursorSDK
SCOPE: slug links + consistent rating + zero-results→post-request CTA on /search.
FILES: src/app/(site)/search/page.tsx (select slug), src/components/traveler/ListingCard.tsx, the search empty-state.
WHAT: link cards to /listings/{slug} (fallback id only if no slug); use RatingDisplay (0-review → nothing/"Новый"); the no-results state becomes a primary "Ничего не нашли? Опубликуйте запрос →" CTA (→ / or /form), not a bare "ничего не найдено".
VERIFY: live — slug links; consistent rating; empty search shows the post-request CTA.
COMMIT: `fix(search): slug links + rating + zero-results lead CTA`

