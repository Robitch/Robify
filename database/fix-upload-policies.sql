-- Fix RLS policies for upload functionality

-- 1. Add user_id field to artists table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='artists' AND column_name='user_id') THEN
        ALTER TABLE artists ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);
    END IF;
END $$;

-- 2. Update Artists policies
DROP POLICY IF EXISTS "Artistes visibles par tous" ON artists;
DROP POLICY IF EXISTS "Créer des profils d'artiste" ON artists;
DROP POLICY IF EXISTS "Modifier ses propres profils d'artiste" ON artists;

CREATE POLICY "Artistes visibles par tous" ON artists FOR SELECT USING (true);
CREATE POLICY "Créer des profils d'artiste" ON artists FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Modifier ses propres profils d'artiste" ON artists FOR UPDATE USING (
    user_id = auth.uid()
);

-- 3. Add uploaded_by field to albums if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='albums' AND column_name='uploaded_by') THEN
        ALTER TABLE albums ADD COLUMN uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_albums_uploaded_by ON albums(uploaded_by);
    END IF;
END $$;

-- Update Albums policies
DROP POLICY IF EXISTS "Albums visibles par tous" ON albums;
DROP POLICY IF EXISTS "Créer des albums" ON albums;
DROP POLICY IF EXISTS "Modifier ses propres albums" ON albums;

CREATE POLICY "Albums visibles par tous" ON albums FOR SELECT USING (true);
CREATE POLICY "Créer des albums" ON albums FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Modifier ses propres albums" ON albums FOR UPDATE USING (uploaded_by = auth.uid());

-- 4. Add uploaded_by field to tracks if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tracks' AND column_name='uploaded_by') THEN
        ALTER TABLE tracks ADD COLUMN uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_tracks_uploaded_by ON tracks(uploaded_by);
    END IF;
END $$;

-- Update Tracks policies
DROP POLICY IF EXISTS "Morceaux visibles par tous" ON tracks;
DROP POLICY IF EXISTS "Créer des morceaux" ON tracks;
DROP POLICY IF EXISTS "Modifier ses propres morceaux" ON tracks;

CREATE POLICY "Morceaux visibles par tous" ON tracks FOR SELECT USING (true);
CREATE POLICY "Créer des morceaux" ON tracks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Modifier ses propres morceaux" ON tracks FOR UPDATE USING (uploaded_by = auth.uid());

-- 5. Update Collaborations policies
DROP POLICY IF EXISTS "Collaborations visibles par tous" ON collaborations;
DROP POLICY IF EXISTS "Créer des collaborations" ON collaborations;
DROP POLICY IF EXISTS "Modifier ses collaborations" ON collaborations;

CREATE POLICY "Collaborations visibles par tous" ON collaborations FOR SELECT USING (true);
CREATE POLICY "Créer des collaborations" ON collaborations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Modifier ses collaborations" ON collaborations FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 6. Ensure storage policies allow file uploads
-- Note: Storage policies are managed separately in the Supabase dashboard
-- Make sure the 'files' bucket has these policies:
-- INSERT: authenticated users can upload
-- SELECT: authenticated users can view
-- UPDATE: users can update their own files
-- DELETE: users can delete their own files

-- 7. Add release_year field to albums if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='albums' AND column_name='release_year') THEN
        ALTER TABLE albums ADD COLUMN release_year INTEGER;
    END IF;
END $$;