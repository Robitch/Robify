-- Add user_id field to artists table to link artists to users
ALTER TABLE artists 
ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_artists_user_id ON artists(user_id);

-- Add a unique constraint to prevent duplicate artist profiles for the same user with the same name
CREATE UNIQUE INDEX idx_artists_user_name_unique ON artists(user_id, name) WHERE user_id IS NOT NULL;

-- Update RLS policy for artists to allow users to see all artists
-- but only modify their own artist profiles
DROP POLICY IF EXISTS "Artistes visibles par tous" ON artists;
DROP POLICY IF EXISTS "Créer des profils d'artiste" ON artists;
DROP POLICY IF EXISTS "Modifier ses propres profils d'artiste" ON artists;

CREATE POLICY "Artistes visibles par tous" ON artists FOR SELECT USING (true);
CREATE POLICY "Créer des profils d'artiste" ON artists FOR INSERT WITH CHECK (
    user_id = auth.uid() OR auth.uid() IS NOT NULL
);
CREATE POLICY "Modifier ses propres profils d'artiste" ON artists FOR UPDATE USING (
    user_id = auth.uid() OR created_by = auth.uid()
);