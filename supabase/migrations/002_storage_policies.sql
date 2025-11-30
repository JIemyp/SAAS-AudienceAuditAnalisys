-- =====================================================
-- Storage Bucket & Policies for Project Files
-- Run this AFTER creating the bucket in Dashboard
-- =====================================================

-- NOTE: First create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage → New Bucket
-- 2. Name: "project-files"
-- 3. Public: OFF (private bucket)
-- 4. Then run this SQL:

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files (optional)
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
