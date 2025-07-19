-- Schema for Robify collaborative music app
-- This file contains the SQL schema for Supabase

-- Create custom types
CREATE TYPE user_role AS ENUM ('artist', 'listener', 'admin');

-- User profiles table (extends Supabase auth.users)
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
    
    -- Constraints
    CONSTRAINT username_length CHECK (char_length(username) >= 3),
    CONSTRAINT full_name_length CHECK (char_length(full_name) >= 2)
);

-- Invitation codes table
CREATE TABLE invitation_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    used_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT code_length CHECK (char_length(code) >= 6)
);

-- Friendships table (for the friend network)
CREATE TABLE friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    addressee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    
    -- Ensure users can't be friends with themselves
    CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id),
    -- Ensure unique friendship pairs
    CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id)
);

-- Artists table (for artist-specific information)
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

-- Albums table
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

-- Tracks table
CREATE TABLE tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    duration INTEGER, -- in seconds
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

-- Track versions table (for multiple versions of the same track)
CREATE TABLE track_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    version_name TEXT NOT NULL, -- e.g., "Demo", "Final", "Acoustic", "Remix"
    file_url TEXT NOT NULL,
    duration INTEGER, -- in seconds
    version_notes TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Playlists table
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

-- Playlist tracks table (many-to-many relationship)
CREATE TABLE playlist_tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    
    -- Ensure unique position per playlist
    CONSTRAINT unique_playlist_position UNIQUE (playlist_id, position)
);

-- Comments table (for track feedback)
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp_seconds INTEGER, -- for timestamp-based comments
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- for replies
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Reactions table (likes, fire, etc.)
CREATE TABLE reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    reaction_type TEXT CHECK (reaction_type IN ('like', 'fire', 'heart', 'mind_blown')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    
    -- Ensure one reaction per user per track
    CONSTRAINT unique_user_track_reaction UNIQUE (user_id, track_id, reaction_type)
);

-- Collaborations table (for multi-artist projects)
CREATE TABLE collaborations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- e.g., "producer", "vocalist", "guitarist"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    
    -- Ensure unique collaboration per track/artist
    CONSTRAINT unique_collaboration UNIQUE (track_id, artist_id)
);

-- Listening history table
CREATE TABLE listening_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    listened_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    duration_listened INTEGER, -- in seconds
    completed BOOLEAN DEFAULT FALSE
);

-- Row Level Security (RLS) policies
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

-- User profiles policies
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Invitation codes policies
CREATE POLICY "Users can view unused invitation codes" ON invitation_codes FOR SELECT USING (NOT is_used);
CREATE POLICY "Users can create invitation codes" ON invitation_codes FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update invitation codes they created" ON invitation_codes FOR UPDATE USING (auth.uid() = created_by);

-- Friendships policies
CREATE POLICY "Users can view their friendships" ON friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can create friendship requests" ON friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update friendships they're part of" ON friendships FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Artists policies
CREATE POLICY "Users can view all artists" ON artists FOR SELECT USING (true);
CREATE POLICY "Users can create their artist profile" ON artists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their artist profile" ON artists FOR UPDATE USING (auth.uid() = user_id);

-- Albums policies
CREATE POLICY "Users can view published albums" ON albums FOR SELECT USING (is_published = true OR EXISTS (SELECT 1 FROM artists WHERE artists.id = albums.artist_id AND artists.user_id = auth.uid()));
CREATE POLICY "Artists can create albums" ON albums FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM artists WHERE artists.id = artist_id AND artists.user_id = auth.uid()));
CREATE POLICY "Artists can update their albums" ON albums FOR UPDATE USING (EXISTS (SELECT 1 FROM artists WHERE artists.id = albums.artist_id AND artists.user_id = auth.uid()));

-- Tracks policies
CREATE POLICY "Users can view published tracks" ON tracks FOR SELECT USING (is_published = true OR EXISTS (SELECT 1 FROM artists WHERE artists.id = tracks.artist_id AND artists.user_id = auth.uid()));
CREATE POLICY "Artists can create tracks" ON tracks FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM artists WHERE artists.id = artist_id AND artists.user_id = auth.uid()));
CREATE POLICY "Artists can update their tracks" ON tracks FOR UPDATE USING (EXISTS (SELECT 1 FROM artists WHERE artists.id = tracks.artist_id AND artists.user_id = auth.uid()));

-- Track versions policies
CREATE POLICY "Users can view track versions" ON track_versions FOR SELECT USING (EXISTS (SELECT 1 FROM tracks WHERE tracks.id = track_versions.track_id AND (tracks.is_published = true OR EXISTS (SELECT 1 FROM artists WHERE artists.id = tracks.artist_id AND artists.user_id = auth.uid()))));
CREATE POLICY "Artists can create track versions" ON track_versions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM tracks JOIN artists ON tracks.artist_id = artists.id WHERE tracks.id = track_id AND artists.user_id = auth.uid()));
CREATE POLICY "Artists can update their track versions" ON track_versions FOR UPDATE USING (EXISTS (SELECT 1 FROM tracks JOIN artists ON tracks.artist_id = artists.id WHERE tracks.id = track_versions.track_id AND artists.user_id = auth.uid()));

-- Playlists policies
CREATE POLICY "Users can view public playlists and their own" ON playlists FOR SELECT USING (is_public = true OR creator_id = auth.uid());
CREATE POLICY "Users can create playlists" ON playlists FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their playlists" ON playlists FOR UPDATE USING (auth.uid() = creator_id);

-- Other policies for comments, reactions, etc.
CREATE POLICY "Users can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their comments" ON comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view reactions" ON reactions FOR SELECT USING (true);
CREATE POLICY "Users can create reactions" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their reactions" ON reactions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view listening history" ON listening_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create listening history" ON listening_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_track_versions_updated_at BEFORE UPDATE ON track_versions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample invitation codes
INSERT INTO invitation_codes (code, created_by, expires_at) VALUES 
('MUSIC2024', null, NOW() + INTERVAL '30 days'),
('ROBIFY01', null, NOW() + INTERVAL '30 days'),
('FRIENDS', null, NOW() + INTERVAL '30 days');