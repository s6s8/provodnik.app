# 30 guide-profile (V-4 + R-3 + R-4 + R-7) — cursorSDK
SCOPE: immersive guide profile + the missing primary CTA.
FILES: guide-profile-screen.tsx (+ guides/[slug]/page.tsx).
WHAT: replace custom hero with ImmersiveHero (portrait + name + headline + verified); ADD primary CTA "Оставить запрос этому гиду" (single loud action); RatingDisplay new-but-vetted (kill 0.0/0 trips); wire languages/specialties (queried but dropped); full bio (no mid-sentence cut); reviews recent-first + "после реальной экскурсии". Keep listings + reviews sections.
VERIFY: live 1280/375 — hero + one CTA + no zero-stats.
COMMIT: `feat(guides): immersive profile + primary request CTA`

