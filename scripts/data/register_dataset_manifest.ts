#!/usr/bin/env -S npx tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_DATASET_BUCKET ?? 'datasets';

async function main() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: manifestData, error: manifestError } = await supabase.storage
    .from(bucketName)
    .download('metadata/datasets-manifest.json');

  if (manifestError) {
    throw new Error(`Could not read manifest: ${manifestError.message}`);
  }

  const manifestText = await manifestData.text();
  const manifest = JSON.parse(manifestText) as {
    files: Array<{
      source: string;
      storagePath: string;
      sizeBytes: number;
      contentType: string;
      curated?: boolean;
      originalSizeBytes?: number;
    }>;
  };

  const rows = manifest.files.map((file) => ({
    bucket: bucketName,
    path: file.source,
    file_name: file.source.split('/').pop() ?? file.source,
    storage_path: file.storagePath,
    file_size_bytes: file.sizeBytes,
    content_type: file.contentType,
    compressed: Boolean(file.curated),
    original_size_bytes: file.originalSizeBytes ?? null,
    metadata: {
      source_path: file.source,
      content_type: file.contentType,
      curated: Boolean(file.curated),
      original_size_bytes: file.originalSizeBytes ?? null,
    },
  }));

  const { data, error } = await supabase.from('dataset_catalog').upsert(rows, {
    onConflict: 'bucket,storage_path',
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(`Dataset catalog sync failed: ${error.message}`);
  }

  console.log(`Registered ${rows.length} dataset entries in dataset_catalog.`);
  console.log(JSON.stringify(data, null, 2));
}

main().catch((error: unknown) => {
  console.error('Dataset catalog registration failed.');
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
});
