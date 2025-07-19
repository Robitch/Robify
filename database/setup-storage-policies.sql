-- Storage policies for the 'files' bucket
-- These need to be executed in the Supabase SQL Editor or Dashboard

-- 1. Create the 'files' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'files' 
    AND auth.role() = 'authenticated'
);

-- 3. Allow public read access to files
CREATE POLICY "Public read access for files" ON storage.objects
FOR SELECT USING (bucket_id = 'files');

-- 4. Allow users to update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
    bucket_id = 'files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
    bucket_id = 'files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Note: If these policies already exist, you may need to drop them first:
-- DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
-- DROP POLICY IF EXISTS "Public read access for files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;