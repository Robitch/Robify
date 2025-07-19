export interface Track {
    id: string;
    title: string;
    user_id: string; // Changed from artist_id to user_id
    duration: number | null;
    file_url: string;
    file_path?: string;
    artwork_url?: string | null;
    album_id?: string | null;
    genre?: string | string[] | null;
    release_year?: number | null;
    description?: string | null;
    uploaded_by?: string;
    bpm?: number | null;
    created_at: string;
    updated_at: string;
    rating?: number;
    user_profiles?: { // Changed from artists to user_profiles
        full_name: string;
        username: string;
    };
    // Legacy support
    url?: string;
    artwork?: string;
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