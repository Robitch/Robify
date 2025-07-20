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

// === MUSIC VERSIONS SYSTEM ===

export enum VersionType {
  DEMO = "demo",
  ROUGH_MIX = "rough",
  FINAL_MIX = "final",
  REMASTER = "remaster",
  REMIX = "remix",
  RADIO_EDIT = "radio",
  EXTENDED_MIX = "extended",
  LIVE = "live",
  ACOUSTIC = "acoustic",
  INSTRUMENTAL = "instrumental"
}

export interface TrackVersion {
  id: string;
  track_id: string;
  version_name: string;           // "Demo", "Final Mix", "Radio Edit"
  version_type: VersionType;      // Enum pour catégorisation
  version_number: string;         // "v1.0", "v1.1", "v2.0"
  file_url: string;              // URL du fichier audio
  duration: number | null;        // Durée spécifique à cette version
  file_size?: number;            // Taille du fichier en bytes
  quality?: string;              // "128kbps", "320kbps", "FLAC"
  is_primary: boolean | null;    // Version actuellement "live"
  is_public?: boolean;           // Visible publiquement ou privée
  version_notes: string | null;  // "Ajout guitare lead", "Nouveau mixage"
  created_at: string;
  updated_at: string;
}

// Track étendu avec versions
export interface TrackWithVersions extends Track {
  versions: TrackVersion[];
  active_version: TrackVersion;   // Version actuellement jouée
  versions_count: number;
}

// Stats par version
export interface VersionStats {
  version_id: string;
  track_id: string;
  plays: number;
  likes: number;
  downloads: number;
  skip_rate: number;
  completion_rate: number;
  created_at: string;
}

// Stats globales par track (agrégation)
export interface TrackGlobalStats {
  track_id: string;
  total_plays: number;
  total_likes: number;
  total_downloads: number;
  most_played_version_id: string;
  created_at: string;
  updated_at: string;
}

// Collaborateurs par version
export interface VersionCollaborator {
  id: string;
  track_id: string;
  version_id: string;
  user_id: string;
  role: string;                   // "Producer", "Vocalist", "Mixer", "Featured"
  created_at: string;
  user_profiles?: {
    full_name: string;
    username: string;
    avatar_url?: string | null;
  };
}

// Types pour les composants
export interface VersionUploadData {
  version_name: string;
  version_type: VersionType;
  version_notes?: string;
  is_public: boolean;
  collaborators: string[];        // User IDs
  file: {
    uri: string;
    name: string;
    type: string;
    size: number;
  };
}

export interface VersionComparison {
  version1: TrackVersion;
  version2: TrackVersion;
  stats1: VersionStats;
  stats2: VersionStats;
  differences: {
    duration_diff: number;
    quality_diff: string;
    performance_diff: {
      plays: number;
      engagement: number;
    };
  };
}