-- Foreign keys so PostgREST can embed breakdown/replies from reviews.* selects.
ALTER TABLE public.review_ratings_breakdown
  DROP CONSTRAINT IF EXISTS review_ratings_breakdown_review_id_fkey;

ALTER TABLE public.review_ratings_breakdown
  ADD CONSTRAINT review_ratings_breakdown_review_id_fkey
  FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;

ALTER TABLE public.review_replies
  DROP CONSTRAINT IF EXISTS review_replies_review_id_fkey;

ALTER TABLE public.review_replies
  ADD CONSTRAINT review_replies_review_id_fkey
  FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;
