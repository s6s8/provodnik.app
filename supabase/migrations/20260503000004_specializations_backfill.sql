-- Data backfill: assign specializations to approved guides per .bek/data/specializations-proposal.csv
-- Rows 103 and 106 have no proposed values and are left unchanged.

UPDATE guide_profiles SET specializations = '{history}'::text[]
WHERE user_id = '30000000-0000-4000-8000-000000000001';

UPDATE guide_profiles SET specializations = '{kids}'::text[]
WHERE user_id = '00000000-0000-4000-8000-000000000002';

UPDATE guide_profiles SET specializations = '{history,art,unusual}'::text[]
WHERE user_id = '10000000-0000-4000-8000-000000000101';

UPDATE guide_profiles SET specializations = '{history,food,kids}'::text[]
WHERE user_id = '10000000-0000-4000-8000-000000000102';

UPDATE guide_profiles SET specializations = '{nature,food}'::text[]
WHERE user_id = '10000000-0000-4000-8000-000000000105';

UPDATE guide_profiles SET specializations = '{kids}'::text[]
WHERE user_id = '10000000-0000-4000-8000-000000000107';

UPDATE guide_profiles SET specializations = '{history}'::text[]
WHERE user_id = '10000000-0000-4000-8000-000000000108';

UPDATE guide_profiles SET specializations = '{history,kids}'::text[]
WHERE user_id = '10000000-0000-4000-8000-000000000109';
