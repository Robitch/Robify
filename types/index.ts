export interface Track {
    id: string;
    title: string;
    user_id: string; // Changed from artist_id to user_id
    duration: number | null;
    file_url: string;
    file_path?: string;
    artwork_url?: string | null;
    album_id?: string | null;
    track_number?: number | null;
    genre?: string | string[] | null;
    release_year?: number | null;
    description?: string | null;
    bpm?: number | null;
    lyrics?: string | null;
    mood?: string[] | null;
    instruments?: string[] | null;
    key?: string | null;
    is_published?: boolean | null;
    created_at: string;
    updated_at: string;
    rating?: number;
    user_profiles?: { // Changed from artists to user_profiles
        full_name: string;
        username: string;
    };
    album?: Album; // Relation avec album
    // Legacy support
    url?: string;
    artwork?: string;
}

export type AlbumType = 'album' | 'ep' | 'single' | string;

export interface Album {
    id: string;
    title: string;
    description?: string | null;
    artwork_url?: string | null;
    release_date?: string | null;
    release_year?: number | null;
    user_id: string;
    album_type: AlbumType;
    is_public: boolean | null;
    created_at: string;
    updated_at: string;
    user_profiles?: {
        full_name: string;
        username: string;
    };
    tracks?: Track[];
    tracks_count?: number;
}

// Artist interface removed - using UserProfile directly from auth types

export interface Playlist {
    id: string;
    name: string;
    user_id: string;
    created_at: string;
}

export interface PlaylistTrack {
    playlist_id: string;
    track_id: string;
    position: number;
}

export type TrackWithPlaylist = Track & { playlist?: string[] }