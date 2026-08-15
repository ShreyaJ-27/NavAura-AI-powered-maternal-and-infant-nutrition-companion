CREATE TABLE IF NOT EXISTS dataset_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  content_type TEXT,
  compressed BOOLEAN NOT NULL DEFAULT false,
  original_size_bytes BIGINT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS dataset_catalog_bucket_path_idx
  ON dataset_catalog(bucket, storage_path);

ALTER TABLE dataset_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view dataset catalog"
  ON dataset_catalog FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage dataset catalog"
  ON dataset_catalog FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
