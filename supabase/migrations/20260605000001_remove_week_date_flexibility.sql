UPDATE public.traveler_requests
SET date_flexibility = 'few_days'
WHERE date_flexibility = 'week';

DO $$
DECLARE
  constraint_record record;
BEGIN
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.traveler_requests'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%date_flexibility%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.traveler_requests DROP CONSTRAINT IF EXISTS %I',
      constraint_record.conname
    );
  END LOOP;
END $$;

ALTER TABLE public.traveler_requests
  ADD CONSTRAINT traveler_requests_date_flexibility_check
  CHECK (date_flexibility IN ('exact', 'few_days'));
