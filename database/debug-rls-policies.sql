-- Debug script to check RLS policies and permissions

-- 1. Check if RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('artists', 'albums', 'tracks', 'collaborations', 'user_profiles');

-- 2. List all policies for our tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('artists', 'albums', 'tracks', 'collaborations', 'user_profiles')
ORDER BY tablename, policyname;

-- 3. Check storage bucket configuration
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'files';

-- 4. List storage policies
SELECT policyname, bucket_id, target, cmd, qual, with_check
FROM storage.bucket_policies 
WHERE bucket_id = 'files';

-- 5. Check current user authentication
SELECT auth.uid() as current_user_id, auth.role() as current_role;

-- 6. Test basic permissions by trying to select from each table
-- (Run these one by one to see which ones fail)

-- Test user_profiles access
SELECT COUNT(*) as user_profiles_count FROM user_profiles;

-- Test artists access  
SELECT COUNT(*) as artists_count FROM artists;

-- Test albums access
SELECT COUNT(*) as albums_count FROM albums;

-- Test tracks access
SELECT COUNT(*) as tracks_count FROM tracks;

-- Test collaborations access
SELECT COUNT(*) as collaborations_count FROM collaborations;

-- 7. Check table structure for missing columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'artists' 
AND column_name IN ('user_id', 'created_by');

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'albums' 
AND column_name IN ('uploaded_by', 'release_year');

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
AND column_name IN ('uploaded_by', 'file_path');

-- 8. Test insert permissions (these should work if policies are correct)
-- Note: These are test queries - don't actually run them unless you want test data

/*
-- Test artist creation (DON'T RUN - just for reference)
INSERT INTO artists (name, created_by) 
VALUES ('Test Artist', auth.uid());

-- Test album creation (DON'T RUN - just for reference)  
INSERT INTO albums (title, artist_id, uploaded_by)
VALUES ('Test Album', (SELECT id FROM artists LIMIT 1), auth.uid());

-- Test track creation (DON'T RUN - just for reference)
INSERT INTO tracks (title, artist_id, file_url, uploaded_by)
VALUES ('Test Track', (SELECT id FROM artists LIMIT 1), 'https://example.com/test.mp3', auth.uid());
*/