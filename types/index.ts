export interface Track {
    id: string;
    title: string;
    artist_id: string;
    duration: number;
    file_url: string;
    artwork_url?: string;
    created_at: string;
    updated_at: string;
    artists?: {
        name: string;
    };
}

export interface Artist {
    id: string;
    name: string;
    bio?: string;
    image_url?: string;
    created_at: string;
}

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