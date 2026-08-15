# Supabase Storage Configuration

This file documents the setup required for Supabase Storage to support NavAura's meal image uploads.

## Storage Bucket Setup

### 1. Create meal-images Bucket

In the Supabase dashboard:

1. Go to **Storage** > **Buckets**
2. Click **Create a new bucket**
3. Name: `meal-images`
4. Make it **Private** (not public)
5. Enable **File size limit**: 20 MB
6. Click **Create bucket**

### 2. Configure Storage Policies

These policies must be set in the Supabase dashboard under **Storage** > **Policies**:

#### Allow users to upload images

```sql
CREATE POLICY "Users can upload their own meal images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'meal-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### Allow users to read their own images

```sql
CREATE POLICY "Users can read their own meal images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'meal-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### Allow users to delete their own images

```sql
CREATE POLICY "Users can delete their own meal images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'meal-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 3. Verify Storage Access

After setup, test that:

1. Authenticated users can upload images to `meal-images/{user_id}/`
2. Users can only access files in their own user folder
3. Unauthenticated requests are rejected

## File Path Structure

Files are stored following this structure:

```
meal-images/
├── {user_id}/
│   ├── meal-{user_id}-{timestamp}-{original_filename}
│   └── meal-{user_id}-{timestamp}-{original_filename}
└── {another_user_id}/
    └── ...
```

This ensures automatic path-based access control through RLS policies.
