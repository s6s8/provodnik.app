DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'storage_assets_bucket_id_object_path_key'
      AND conrelid = 'public.storage_assets'::regclass
  ) THEN
    ALTER TABLE public.storage_assets
    ADD CONSTRAINT storage_assets_bucket_id_object_path_key
    UNIQUE (bucket_id, object_path);
  END IF;
END;
$$;
