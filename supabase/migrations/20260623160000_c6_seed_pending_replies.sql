-- C6 — seed 2 pending review replies so the admin moderation "Ответы на отзывы" queue is demoable.
-- ADDITIVE + idempotent (fixed demo PKs, on conflict do nothing). The BEFORE-UPDATE status trigger
-- does NOT fire on INSERT, so inserting status=pending_review directly is legal. Demo rows only (@demo guides).
insert into public.review_replies (id, review_id, guide_id, body, status, submitted_at)
values
  ('d6000000-0000-4000-8000-000000000001','d5000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000101',
   'Спасибо за тёплый отзыв! Был рад показать вам настоящую Калмыкию — приезжайте ещё, покажу степь весной.','pending_review', now()),
  ('d6000000-0000-4000-8000-000000000002','d5000000-0000-4000-8000-000000000002','d0000000-0000-4000-8000-000000000107',
   'Благодарю за добрые слова! Рад, что экскурсия по Элисте вам понравилась. До новых встреч!','pending_review', now())
on conflict (id) do nothing;
