# 16 booking-loading (B-1, HIGH) — cursorSDK
SCOPE: stop the false "Бронирование не найдено" while loading.
FILES: src/features/bookings/components/booking-detail-screen.tsx (guide view ~L372-495; apply same to traveler view).
WHAT: add isLoading state; render a loading skeleton while the fetch is pending; show "не найдено" only when !isLoading && !record; add an error+retry branch.
VERIFY: render test (pending→skeleton, null→not-found, ok→content); live demo booking shows content, no flash of "не найдено".
COMMIT: `fix(bookings): loading + error states (no false not-found)`

