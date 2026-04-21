ALTER TABLE traveler_requests RENAME COLUMN category TO interests;
ALTER TABLE traveler_requests ALTER COLUMN interests TYPE text[] USING ARRAY[interests];
ALTER TABLE traveler_requests ALTER COLUMN interests SET DEFAULT '{}';
