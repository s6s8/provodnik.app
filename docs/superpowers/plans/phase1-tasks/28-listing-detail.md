# 28 listing-detail (V-2 + R-4 + R-7) — cursorSDK
SCOPE: immersive listing detail + CTA hierarchy + conversion micro-copy.
FILES: ExcursionShapeDetail.tsx (+ TourShapeDetail.tsx), listings/[id]/page.tsx if needed.
WHAT: immersive hero (gallery/scrim + title + meta chips); sticky desktop rail + mobile bottom bar (reuse request-detail pattern); ONE primary "Заказать" + secondary ghost "Задать вопрос"; rating adjacent to CTA + "от N ₽" + doubt-remover line ("оплата напрямую гиду · ответ за ~2 ч"); RatingDisplay; route →; reviews recent-first + "после реальной экскурсии" tag. Keep PII masking, tariffs/schedule, instant-booking.
VERIFY: live 1280/375; book + question flows work.
COMMIT: `feat(listings): immersive detail + primary CTA + conversion copy`

