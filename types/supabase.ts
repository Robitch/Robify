export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      albums: {
        Row: {
          album_type: string
          artwork_url: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          release_date: string | null
          release_year: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          album_type?: string
          artwork_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          release_date?: string | null
          release_year?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          album_type?: string
          artwork_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          release_date?: string | null
          release_year?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      collaborations: {
        Row: {
          user_id: string | null
          created_at: string
          id: string
          role: string
          track_id: string | null
          version_id: string | null
        }
        Insert: {
          user_id?: string | null
          created_at?: string
          id?: string
          role: string
          track_id?: string | null
          version_id?: string | null
        }
        Update: {
          user_id?: string | null
          created_at?: string
          id?: string
          role?: string
          track_id?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborations_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborations_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "track_versions"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          timestamp_seconds: number | null
          track_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          timestamp_seconds?: number | null
          track_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          timestamp_seconds?: number | null
          track_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      invitation_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_used: boolean | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_codes_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      listening_history: {
        Row: {
          completed: boolean | null
          duration_listened: number | null
          id: string
          listened_at: string
          track_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          duration_listened?: number | null
          id?: string
          listened_at?: string
          track_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          duration_listened?: number | null
          id?: string
          listened_at?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listening_history_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listening_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      playlist_tracks: {
        Row: {
          added_at: string
          added_by: string | null
          id: string
          playlist_id: string
          position: number
          track_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          id?: string
          playlist_id: string
          position: number
          track_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          id?: string
          playlist_id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          }
        ]
      }
      playlists: {
        Row: {
          cover_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_collaborative: boolean | null
          is_public: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_collaborative?: boolean | null
          is_public?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_collaborative?: boolean | null
          is_public?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      track_versions: {
        Row: {
          created_at: string
          duration: number | null
          file_url: string
          id: string
          is_primary: boolean | null
          track_id: string
          updated_at: string
          version_name: string
          version_notes: string | null
          version_type: string
          version_number: string
          file_size: number | null
          quality: string | null
          is_public: boolean | null
        }
        Insert: {
          created_at?: string
          duration?: number | null
          file_url: string
          id?: string
          is_primary?: boolean | null
          track_id: string
          updated_at?: string
          version_name: string
          version_notes?: string | null
          version_type: string
          version_number: string
          file_size?: number | null
          quality?: string | null
          is_public?: boolean | null
        }
        Update: {
          created_at?: string
          duration?: number | null
          file_url?: string
          id?: string
          is_primary?: boolean | null
          track_id?: string
          updated_at?: string
          version_name?: string
          version_notes?: string | null
          version_type?: string
          version_number?: string
          file_size?: number | null
          quality?: string | null
          is_public?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "track_versions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          }
        ]
      }
      tracks: {
        Row: {
          album_id: string | null
          artwork_url: string | null
          bpm: number | null
          created_at: string
          duration: number | null
          file_url: string
          genre: string[] | null
          id: string
          instruments: string[] | null
          is_published: boolean | null
          key: string | null
          lyrics: string | null
          mood: string[] | null
          title: string
          track_number: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          album_id?: string | null
          artwork_url?: string | null
          bpm?: number | null
          created_at?: string
          duration?: number | null
          file_url: string
          genre?: string[] | null
          id?: string
          instruments?: string[] | null
          is_published?: boolean | null
          key?: string | null
          lyrics?: string | null
          mood?: string[] | null
          title: string
          track_number?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          album_id?: string | null
          artwork_url?: string | null
          bpm?: number | null
          created_at?: string
          duration?: number | null
          file_url?: string
          genre?: string[] | null
          id?: string
          instruments?: string[] | null
          is_published?: boolean | null
          key?: string | null
          lyrics?: string | null
          mood?: string[] | null
          title?: string
          track_number?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          id: string
          instagram: string | null
          is_verified: boolean | null
          location: string | null
          spotify: string | null
          twitter: string | null
          updated_at: string
          username: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          id: string
          instagram?: string | null
          is_verified?: boolean | null
          location?: string | null
          spotify?: string | null
          twitter?: string | null
          updated_at?: string
          username: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          location?: string | null
          spotify?: string | null
          twitter?: string | null
          updated_at?: string
          username?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}