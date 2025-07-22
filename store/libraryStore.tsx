import { create } from 'zustand';
import { Track, Album, TrackVersion } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/provider/AuthProvider';

interface LibraryStats {
  totalTracks: number;
  totalFavorites: number;
  totalOfflineDownloads: number;
  totalListeningTime: number; // en secondes
  mostPlayedTrack: Track | null;
  recentlyPlayed: Track[];
  totalArtists: number;
  totalAlbums: number;
}

interface LibraryStore {
  // État
  isLoading: boolean;
  error: string | null;
  stats: LibraryStats;
  allTracks: Track[];
  allAlbums: Album[];
  searchQuery: string;
  filteredTracks: Track[];
  sortBy: 'title' | 'artist' | 'date' | 'duration';
  sortOrder: 'asc' | 'desc';

  // Actions principales
  initializeLibrary: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
  searchTracks: (query: string) => void;
  sortTracks: (by: LibraryStore['sortBy'], order: LibraryStore['sortOrder']) => void;

  // Actions de données
  loadAllTracks: () => Promise<void>;
  loadAllAlbums: () => Promise<void>;
  calculateStats: () => Promise<void>;

  // Utilitaires
  getTrackById: (trackId: string) => Track | undefined;
  getAlbumById: (albumId: string) => Album | undefined;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const initialStats: LibraryStats = {
  totalTracks: 0,
  totalFavorites: 0,
  totalOfflineDownloads: 0,
  totalListeningTime: 0,
  mostPlayedTrack: null,
  recentlyPlayed: [],
  totalArtists: 0,
  totalAlbums: 0,
};

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  // État initial
  isLoading: false,
  error: null,
  stats: initialStats,
  allTracks: [],
  allAlbums: [],
  searchQuery: '',
  filteredTracks: [],
  sortBy: 'date',
  sortOrder: 'desc',

  // Actions principales
  initializeLibrary: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().loadAllTracks(),
        get().loadAllAlbums(),
        get().calculateStats(),
      ]);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors de l\'initialisation de la bibliothèque' });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshLibrary: async () => {
    await get().initializeLibrary();
  },

  searchTracks: (query: string) => {
    set({ searchQuery: query });
    const { allTracks } = get();

    if (!query.trim()) {
      set({ filteredTracks: allTracks });
      return;
    }

    const filtered = allTracks.filter(track =>
      track.title.toLowerCase().includes(query.toLowerCase()) ||
      track.user_profiles?.username.toLowerCase().includes(query.toLowerCase()) ||
      track.genre?.toString().toLowerCase().includes(query.toLowerCase()) ||
      track.mood?.join(' ').toLowerCase().includes(query.toLowerCase())
    );

    set({ filteredTracks: filtered });
  },

  sortTracks: (by: LibraryStore['sortBy'], order: LibraryStore['sortOrder']) => {
    set({ sortBy: by, sortOrder: order });
    const { filteredTracks } = get();

    const sorted = [...filteredTracks].sort((a, b) => {
      let comparison = 0;

      switch (by) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'artist':
          comparison = (a.user_profiles?.username || '').localeCompare(b.user_profiles?.username || '');
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    set({ filteredTracks: sorted });
  },

  // Actions de données
  loadAllTracks: async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select(`
          *,
          user_profiles(username),
          albums(title)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tracks = data as Track[];
      set({
        allTracks: tracks,
        filteredTracks: tracks
      });

      // Appliquer le tri actuel
      const { sortBy, sortOrder } = get();
      get().sortTracks(sortBy, sortOrder);

    } catch (error) {
      throw new Error(`Erreur lors du chargement des morceaux: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  },

  loadAllAlbums: async () => {
    try {
      const { data, error } = await supabase
        .from('albums')
        .select(`
          *,
          user_profiles(username)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ allAlbums: data as Album[] });
    } catch (error) {
      throw new Error(`Erreur lors du chargement des albums: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  },

  calculateStats: async () => {
    try {
      const { allTracks, allAlbums } = get();

      // Stats de base depuis les données déjà chargées
      const totalTracks = allTracks.length;
      const totalAlbums = allAlbums.length;

      // Calculer le nombre d'artistes uniques
      const uniqueArtists = new Set(allTracks.map(track => track.user_id));
      const totalArtists = uniqueArtists.size;

      // Obtenir l'utilisateur actuel pour les stats personnalisées
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({
          stats: {
            totalTracks,
            totalAlbums,
            totalArtists,
            totalFavorites: 0,
            totalOfflineDownloads: 0,
            totalListeningTime: 0,
            mostPlayedTrack: null,
            recentlyPlayed: [],
          }
        });
        return;
      }

      // Compter les favoris (utiliser reaction_type = 'heart' pour les favoris)
      const { count: favoritesCount } = await supabase
        .from('reactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('reaction_type', 'heart');

      // Calculer le temps d'écoute total
      const { data: historyData } = await supabase
        .from('listening_history')
        .select('duration_listened')
        .eq('user_id', user.id);

      const totalListeningTime = historyData?.reduce((sum, entry) => sum + (entry.duration_listened || 0), 0) || 0;

      // Obtenir les morceaux récemment écoutés (derniers 10)
      const { data: recentData } = await supabase
        .from('listening_history')
        .select(`
          tracks (
            *,
            user_profiles(username)
          )
        `)
        .eq('user_id', user.id)
        .order('listened_at', { ascending: false })
        .limit(10);

      const recentlyPlayed = recentData?.map(entry => entry.tracks).filter(Boolean) as Track[] || [];

      // Trouver le morceau le plus écouté
      const { data: mostPlayedData } = await supabase
        .from('listening_history')
        .select(`
          track_id,
          tracks (
            *,
            user_profiles(username)
          )
        `)
        .eq('user_id', user.id);

      let mostPlayedTrack: Track | null = null;
      if (mostPlayedData && mostPlayedData.length > 0) {
        // Compter les écoutes par morceau
        const trackCounts = mostPlayedData.reduce((acc, entry) => {
          acc[entry.track_id] = (acc[entry.track_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Trouver le morceau avec le plus d'écoutes
        const mostPlayedTrackId = Object.keys(trackCounts).reduce((a, b) =>
          trackCounts[a] > trackCounts[b] ? a : b
        );

        mostPlayedTrack = mostPlayedData.find(entry => entry.track_id === mostPlayedTrackId)?.tracks as Track || null;
      }

      set({
        stats: {
          totalTracks,
          totalAlbums,
          totalArtists,
          totalFavorites: favoritesCount || 0,
          totalOfflineDownloads: 0, // Sera calculé par l'offlineStore
          totalListeningTime,
          mostPlayedTrack,
          recentlyPlayed,
        }
      });

    } catch (error) {
      throw new Error(`Erreur lors du calcul des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  },

  // Utilitaires
  getTrackById: (trackId: string) => {
    const { allTracks } = get();
    return allTracks.find(track => track.id === trackId);
  },

  getAlbumById: (albumId: string) => {
    const { allAlbums } = get();
    return allAlbums.find(album => album.id === albumId);
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));