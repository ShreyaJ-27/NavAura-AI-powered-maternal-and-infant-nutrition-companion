#!/usr/bin/env -S npx tsx

import { createClient } from '@supabase/supabase-js';
import { createGzip } from 'node:zlib';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '../../..');
const datasetsRoot = path.join(repoRoot, 'Datasets');
const bucketName = process.env.SUPABASE_DATASET_BUCKET ?? 'datasets';
const maxObjectBytes = Number(process.env.SUPABASE_MAX_OBJECT_BYTES ?? 50 * 1024 * 1024);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function getMimeType(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();

  switch (extension) {
    case '.csv':
      return 'text/csv';
    case '.json':
      return 'application/json';
    case '.xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case '.xls':
      return 'application/vnd.ms-excel';
    case '.pdf':
      return 'application/pdf';
    case '.gz':
      return 'application/gzip';
    default:
      return 'application/octet-stream';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureBucket(supabase: any) {
  const { data, error } = await supabase.storage.createBucket(bucketName, {
    public: false,
  });

  if (error && !error.message.toLowerCase().includes('already exists')) {
    throw new Error(`Failed to create bucket ${bucketName}: ${error.message}`);
  }

  if (data) {
    console.log(`Bucket ${bucketName} ready.`);
  }
}

async function compressIfNeeded(sourcePath: string): Promise<{ filePath: string; effectiveSize: number; originalSize: number; archived: boolean; archivePath?: string }> {
  const originalSize = (await fs.stat(sourcePath)).size;

  if (originalSize <= maxObjectBytes) {
    return {
      filePath: sourcePath,
      effectiveSize: originalSize,
      originalSize,
      archived: false,
    };
  }

  const archivePath = `${sourcePath}.gz`;
  const source = await fs.open(sourcePath, 'r');
  const destination = await fs.open(archivePath, 'w');

  try {
    await pipeline(
      source.createReadStream(),
      createGzip(),
      destination.createWriteStream(),
    );
  } finally {
    await source.close();
    await destination.close();
  }

  const compressedSize = (await fs.stat(archivePath)).size;
  if (compressedSize <= maxObjectBytes) {
    return {
      filePath: archivePath,
      effectiveSize: compressedSize,
      originalSize,
      archived: true,
      archivePath,
    };
  }

  await fs.unlink(archivePath).catch(() => undefined);
  return {
    filePath: sourcePath,
    effectiveSize: originalSize,
    originalSize,
    archived: false,
  };
}

async function main() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase credentials. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment before running this script.'
    );
  }

  const datasetsExists = await fs
    .access(datasetsRoot)
    .then(() => true)
    .catch(() => false);

  if (!datasetsExists) {
    throw new Error(`Dataset directory not found at ${datasetsRoot}`);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  await ensureBucket(supabase);

  const files = await collectFiles(datasetsRoot);
  if (files.length === 0) {
    throw new Error(`No files were found under ${datasetsRoot}`);
  }

  const uploaded: Array<{
    source: string;
    storagePath: string;
    sizeBytes: number;
    contentType: string;
    curated: boolean;
    originalSizeBytes?: number;
  }> = [];

  for (const filePath of files) {
    const relativePath = path.relative(datasetsRoot, filePath).split(path.sep).join('/');
    const prepared = await compressIfNeeded(filePath);

    if (prepared.effectiveSize > maxObjectBytes) {
      console.warn(`Skipping oversized dataset: ${relativePath} (${prepared.originalSize} bytes). It exceeds the Supabase 50MB object limit even after gzip compression.`);
      continue;
    }

    const storagePath = prepared.archived ? `${relativePath}.gz` : relativePath;
    const buffer = await fs.readFile(prepared.filePath);
    const contentType = getMimeType(storagePath);

    const { error } = await supabase.storage.from(bucketName).upload(storagePath, buffer, {
      upsert: true,
      contentType,
      cacheControl: '3600',
    });

    if (error) {
      throw new Error(`Upload failed for ${relativePath}: ${error.message}`);
    }

    uploaded.push({
      source: relativePath,
      storagePath,
      sizeBytes: buffer.length,
      contentType,
      curated: prepared.archived,
      originalSizeBytes: prepared.originalSize,
    });

    console.log(`Uploaded: ${relativePath}${prepared.archived ? ' -> compressed to ' + storagePath : ''}`);

    if (prepared.archived && prepared.filePath !== filePath) {
      await fs.unlink(prepared.filePath).catch(() => undefined);
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    bucket: bucketName,
    datasetRoot: 'Datasets',
    totalFiles: uploaded.length,
    totalSizeBytes: uploaded.reduce((sum, item) => sum + item.sizeBytes, 0),
    files: uploaded,
  };

  const manifestPath = 'metadata/datasets-manifest.json';
  const manifestUpload = await supabase.storage.from(bucketName).upload(manifestPath, JSON.stringify(manifest, null, 2), {
    upsert: true,
    contentType: 'application/json',
    cacheControl: '3600',
  });

  if (manifestUpload.error) {
    throw new Error(`Manifest upload failed: ${manifestUpload.error.message}`);
  }

  console.log(`\nUpload complete. ${uploaded.length} files uploaded to bucket ${bucketName}.`);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch((error: unknown) => {
  console.error('Dataset upload failed.');
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
});
