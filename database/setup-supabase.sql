-- Configuration complète de Supabase pour Robify
-- Copiez et collez ce script dans le SQL Editor de Supabase

-- 1. Créer les types personnalisés
CREATE TYPE user_role AS ENUM ('artist', 'listener', 'admin');

-- 2. Table des profils utilisateurs (étend auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'listener',
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    instagram TEXT,
    twitter TEXT,
    spotify TEXT,
    location TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    
    -- Contraintes
    CONSTRAINT username_length CHECK (char_length(username) >= 3),
    CONSTRAINT full_name_length CHECK (char_length(full_name) >= 2)
);

-- 3. Table des codes d'invitation
CREATE TABLE invitation_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    used_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    
    CONSTRAINT code_length CHECK (char_length(code) >= 6)
);

-- 4. Table des amitiés
CREATE TABLE friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    addressee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    
    CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id),
    CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id)
);

-- 5. Table des artistes
CREATE TABLE artists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bio TEXT,
    genre TEXT[],
    verified BOOLEAN DEFAULT FALSE,
    monthly_listeners INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 6. Table des albums
CREATE TABLE albums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    release_date DATE,
    is_ep BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 7. Table des pistes
CREATE TABLE tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    duration INTEGER,
    artwork_url TEXT,
    lyrics TEXT,
    genre TEXT[],
    mood TEXT[],
    instruments TEXT[],
    bpm INTEGER,
    key TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 8. Table des versions de pistes
CREATE TABLE track_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    version_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    duration INTEGER,
    version_notes TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 9. Table des playlists
CREATE TABLE playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_collaborative BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 10. Table des pistes dans les playlists
CREATE TABLE playlist_tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    
    CONSTRAINT unique_playlist_position UNIQUE (playlist_id, position)
);

-- 11. Table des commentaires
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp_seconds INTEGER,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 12. Table des réactions
CREATE TABLE reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    reaction_type TEXT CHECK (reaction_type IN ('like', 'fire', 'heart', 'mind_blown')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    
    CONSTRAINT unique_user_track_reaction UNIQUE (user_id, track_id, reaction_type)
);

-- 13. Table des collaborations
CREATE TABLE collaborations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    
    CONSTRAINT unique_collaboration UNIQUE (track_id, artist_id)
);

-- 14. Table de l'historique d'écoute
CREATE TABLE listening_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    listened_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    duration_listened INTEGER,
    completed BOOLEAN DEFAULT FALSE
);

-- 15. Activer Row Level Security sur toutes les tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_history ENABLE ROW LEVEL SECURITY;

-- 16. Créer les politiques de sécurité essentielles
-- Profils utilisateurs
CREATE POLICY "Tout le monde peut voir les profils" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Utilisateurs peuvent mettre à jour leur profil" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Utilisateurs peuvent créer leur profil" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Codes d'invitation
CREATE POLICY "Voir les codes d'invitation non utilisés" ON invitation_codes FOR SELECT USING (NOT is_used);
CREATE POLICY "Créer des codes d'invitation" ON invitation_codes FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Mettre à jour les codes d'invitation créés" ON invitation_codes FOR UPDATE USING (auth.uid() = created_by);

-- Artistes
CREATE POLICY "Voir tous les artistes" ON artists FOR SELECT USING (true);
CREATE POLICY "Créer son profil d'artiste" ON artists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Mettre à jour son profil d'artiste" ON artists FOR UPDATE USING (auth.uid() = user_id);

-- Pistes
CREATE POLICY "Voir les pistes publiées" ON tracks FOR SELECT USING (
    is_published = true OR 
    EXISTS (SELECT 1 FROM artists WHERE artists.id = tracks.artist_id AND artists.user_id = auth.uid())
);
CREATE POLICY "Artistes peuvent créer des pistes" ON tracks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM artists WHERE artists.id = artist_id AND artists.user_id = auth.uid())
);
CREATE POLICY "Artistes peuvent mettre à jour leurs pistes" ON tracks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM artists WHERE artists.id = tracks.artist_id AND artists.user_id = auth.uid())
);

-- Playlists
CREATE POLICY "Voir les playlists publiques et les siennes" ON playlists FOR SELECT USING (
    is_public = true OR creator_id = auth.uid()
);
CREATE POLICY "Créer des playlists" ON playlists FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Mettre à jour ses playlists" ON playlists FOR UPDATE USING (auth.uid() = creator_id);

-- Commentaires
CREATE POLICY "Voir les commentaires" ON comments FOR SELECT USING (true);
CREATE POLICY "Créer des commentaires" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Mettre à jour ses commentaires" ON comments FOR UPDATE USING (auth.uid() = user_id);

-- Réactions
CREATE POLICY "Voir les réactions" ON reactions FOR SELECT USING (true);
CREATE POLICY "Créer des réactions" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Mettre à jour ses réactions" ON reactions FOR UPDATE USING (auth.uid() = user_id);

-- 17. Créer une fonction pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 18. Créer les triggers pour updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_track_versions_updated_at BEFORE UPDATE ON track_versions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 19. Créer quelques codes d'invitation de test
INSERT INTO invitation_codes (code, created_by, expires_at) VALUES 
('ROBIFY2024', null, NOW() + INTERVAL '30 days'),
('MUSIC123', null, NOW() + INTERVAL '30 days'),
('FRIENDS01', null, NOW() + INTERVAL '30 days'),
('TESTCODE', null, NOW() + INTERVAL '30 days');

-- 20. Créer le bucket de storage pour les fichiers
-- Cette commande doit être exécutée dans le Storage > Buckets
-- INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', true);