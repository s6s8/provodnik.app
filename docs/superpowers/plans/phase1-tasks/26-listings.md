# 26 listings (V-1 + R-1 + R-2 + R-5) — cursorSDK
SCOPE: immersive catalog.
FILES: src/features/listings/components/public/public-listing-discovery-screen.tsx (+ listing-card.tsx token-align).
WHAT: ListHero (region photo + "Готовые экскурсии" + search-in-hero); token-align theme pills (kill off-brand blue shadow on active); guide name+photo on cards; RatingDisplay; real filter UX (facet counts, persistent filters, removable chips, mobile "Показать N" drawer, OR-in/AND-across); loading skeleton; zero-results→"Опубликуйте запрос →" CTA.
VERIFY: live 1280/375; filters preserved.
COMMIT: `feat(listings): immersive catalog + filter UX + lead CTA`

