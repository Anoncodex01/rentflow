-- Create Storage Bucket for Room Images
-- Run this in Supabase SQL Editor

-- Step 1: Create storage bucket for room images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-images',
  'room-images',
  true, -- Public bucket (images can be accessed via URL)
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create storage policies
-- Note: With service role key in backend, these policies allow the backend to manage files
-- Delete existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes" ON storage.objects;

-- Public read access (anyone can view images)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-images');

-- Allow authenticated users and service role to insert
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'room-images');

-- Allow authenticated users and service role to update
CREATE POLICY "Allow updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'room-images');

-- Allow authenticated users and service role to delete
CREATE POLICY "Allow deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'room-images');
