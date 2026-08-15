import process from 'node:process';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const sql = `
CREATE TABLE IF NOT EXISTS public.dataset_catalog (
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
  ON public.dataset_catalog(bucket, storage_path);

ALTER TABLE public.dataset_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view dataset catalog" ON public.dataset_catalog;
DROP POLICY IF EXISTS "Service role can manage dataset catalog" ON public.dataset_catalog;

CREATE POLICY "Authenticated users can view dataset catalog"
  ON public.dataset_catalog FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage dataset catalog"
  ON public.dataset_catalog FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
`;

async function runSql(query) {
  const response = await fetch(`${url}/rest/v1/sql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });

  const bodyText = await response.text();
  console.log('STATUS', response.status);
  console.log(bodyText);

  if (!response.ok) {
    throw new Error(`SQL failed: ${response.status} ${bodyText}`);
  }
}

await runSql(sql);
await runSql("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dataset_catalog';");
console.log('dataset_catalog ensured successfully.');
