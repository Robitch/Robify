import { create } from 'zustand';
import { Track } from '@/types';
import { supabase } from '@/lib/supabase';
import { 
  ListeningEntry, 
  ListeningStats, 
  WeeklyStats, 
  MonthlyStats, 
  GenreStats,
  DailyStats 
} from '~/types/library';

interface HistoryStore {
  // État
  isLoading: boolean;
  error: string | null;
  listeningHistory: ListeningEntry[];
  stats: ListeningStats;
  recentTracks: Track[];
  
  // Session en cours pour le tracking
  currentSession: {
    trackId: string | null;
    startTime: Date | null;
    lastProgressUpdate: number;
  };
  
  // Filtres et pagination
  dateRange: 'day' | 'week' | 'month' | 'year' | 'all';
  currentPage: number;
  itemsPerPage: number;
  hasMoreHistory: boolean;
  
  // Actions principales
  initializeHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  
  // Actions de tracking
  startListeningSession: (track: Track) => void;
  updateListeningProgress: (trackId: string, currentTime: number, duration: number) => void;
  completeListeningSession: (trackId: string, totalDuration: number, completed: boolean) => Promise<void>;
  
  // Actions d'enregistrement
  recordListening: (trackId: string, durationListened: number, completed: boolean) => Promise<void>;
  bulkRecordListening: (entries: Omit<ListeningEntry, 'id' | 'user_id'>[]) => Promise<void>;
  
  // Actions de requête
  getHistoryByDateRange: (range: HistoryStore['dateRange']) => Promise<void>;
  getHistoryPage: (page: number) => Promise<void>;
  searchHistory: (query: string) => ListeningEntry[];
  getTrackPlayCount: (trackId: string) => number;
  getTrackListeningTime: (trackId: string) => number;
  
  // Actions de statistiques
  calculateStats: () => Promise<void>;
  getStatsForPeriod: (startDate: Date, endDate: Date) => Promise<Partial<ListeningStats>>;
  exportHistory: (format: 'json' | 'csv') => Promise<string>;
  
  // Actions de maintenance
  cleanupOldHistory: (olderThanDays: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  
  // Utilitaires
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setDateRange: (range: HistoryStore['dateRange']) => void;
}

const initialStats: ListeningStats = {
  totalListeningTime: 0,
  totalTracks: 0,
  averageListeningTime: 0,
  completionRate: 0,
  mostPlayedTrack: null,
  favoriteArtist: null,
  dailyAverage: 0,
  weeklyStats: [],
  monthlyStats: [],
  topGenres: [],
  recentlyPlayed: [],
};

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  // État initial
  isLoading: false,
  error: null,
  listeningHistory: [],
  stats: initialStats,
  recentTracks: [],
  currentSession: {
    trackId: null,
    startTime: null,
    lastProgressUpdate: 0,
  },
  dateRange: 'all',
  currentPage: 1,
  itemsPerPage: 50,
  hasMoreHistory: true,

  // Actions principales
  initializeHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().getHistoryByDateRange('all'),
        get().calculateStats(),
      ]);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'initialisation de l\'historique'
      });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshHistory: async () => {
    const { dateRange } = get();
    await Promise.all([
      get().getHistoryByDateRange(dateRange),
      get().calculateStats(),
    ]);
  },

  // Actions de tracking
  startListeningSession: (track: Track) => {
    const now = new Date();
    set({
      currentSession: {
        trackId: track.id,
        startTime: now,
        lastProgressUpdate: 0,
      }
    });

    // Ajouter immédiatement aux récemment joués (même si pas terminé)
    const { recentTracks } = get();
    const updatedRecent = [
      track,
      ...recentTracks.filter(t => t.id !== track.id)
    ].slice(0, 50); // Garder seulement les 50 plus récents

    set({ recentTracks: updatedRecent });
  },

  updateListeningProgress: (trackId: string, currentTime: number, duration: number) => {
    const { currentSession } = get();
    
    if (currentSession.trackId === trackId) {
      set({
        currentSession: {
          ...currentSession,
          lastProgressUpdate: currentTime,
        }
      });

      // Auto-compléter si on atteint 80% de la durée
      if (currentTime >= duration * 0.8) {
        get().completeListeningSession(trackId, duration, true);
      }
    }
  },

  completeListeningSession: async (trackId: string, totalDuration: number, completed: boolean) => {
    const { currentSession } = get();
    
    if (currentSession.trackId === trackId && currentSession.startTime) {
      const listenedDuration = Math.min(
        currentSession.lastProgressUpdate,
        totalDuration
      );

      // Ne compter que si écouté au moins 30 secondes
      if (listenedDuration >= 30) {
        await get().recordListening(trackId, listenedDuration, completed);
      }

      // Réinitialiser la session
      set({
        currentSession: {
          trackId: null,
          startTime: null,
          lastProgressUpdate: 0,
        }
      });
    }
  },

  // Actions d'enregistrement
  recordListening: async (trackId: string, durationListened: number, completed: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('listening_history')
        .insert({
          user_id: user.id,
          track_id: trackId,
          duration_listened: durationListened,
          completed,
          listened_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Ne pas rafraîchir tout l'historique, juste ajouter localement
      // L'historique sera rafraîchi lors de la prochaine initialisation
      
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement d\'écoute:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement'
      });
    }
  },

  bulkRecordListening: async (entries: Omit<ListeningEntry, 'id' | 'user_id'>[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const insertData = entries.map(entry => ({
        ...entry,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from('listening_history')
        .insert(insertData);

      if (error) throw error;

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement groupé'
      });
    }
  },

  // Actions de requête
  getHistoryByDateRange: async (range: HistoryStore['dateRange']) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let startDate: Date | null = null;
      const now = new Date();

      switch (range) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        case 'all':
        default:
          startDate = null;
          break;
      }

      let query = supabase
        .from('listening_history')
        .select('*')
        .eq('user_id', user.id)
        .order('listened_at', { ascending: false })
        .limit(get().itemsPerPage);

      if (startDate) {
        query = query.gte('listened_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const listeningHistory = data as ListeningEntry[];
      
      // Pour l'instant, on n'a pas de données de tracks liées
      // On créera des tracks fictives basées sur les track_id
      const recentTracks: Track[] = [];

      set({
        listeningHistory,
        recentTracks,
        dateRange: range,
        currentPage: 1,
        hasMoreHistory: listeningHistory.length === get().itemsPerPage,
      });

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement de l\'historique'
      });
    }
  },

  getHistoryPage: async (page: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const offset = (page - 1) * get().itemsPerPage;

      let query = supabase
        .from('listening_history')
        .select(`
          *,
          tracks (
            *,
            user_profiles!tracks_user_id_fkey (
              username
            )
          )
        `)
        .eq('user_id', user.id)
        .order('listened_at', { ascending: false })
        .range(offset, offset + get().itemsPerPage - 1);

      // Appliquer le filtre de date si nécessaire
      const { dateRange } = get();
      if (dateRange !== 'all') {
        let startDate: Date;
        const now = new Date();

        switch (dateRange) {
          case 'day':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        }

        query = query.gte('listened_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const newHistory = data as ListeningEntry[];
      
      set({
        listeningHistory: page === 1 ? newHistory : [...get().listeningHistory, ...newHistory],
        currentPage: page,
        hasMoreHistory: newHistory.length === get().itemsPerPage,
      });

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement de la page'
      });
    }
  },

  searchHistory: (query: string) => {
    const { listeningHistory } = get();
    
    if (!query.trim()) {
      return listeningHistory;
    }

    return listeningHistory.filter(entry => 
      entry.track?.title.toLowerCase().includes(query.toLowerCase()) ||
      entry.track?.user_profiles?.username.toLowerCase().includes(query.toLowerCase())
    );
  },

  getTrackPlayCount: (trackId: string) => {
    const { listeningHistory } = get();
    return listeningHistory.filter(entry => entry.track_id === trackId).length;
  },

  getTrackListeningTime: (trackId: string) => {
    const { listeningHistory } = get();
    return listeningHistory
      .filter(entry => entry.track_id === trackId)
      .reduce((total, entry) => total + entry.duration_listened, 0);
  },

  // Actions de statistiques
  calculateStats: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtenir les données d'historique pour les statistiques
      const { data: historyData, error } = await supabase
        .from('listening_history')
        .select(`
          *,
          tracks (
            *,
            user_profiles!tracks_user_id_fkey (
              username
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const history = historyData as ListeningEntry[];
      
      // Calculs des statistiques
      const totalListeningTime = history.reduce((sum, entry) => sum + entry.duration_listened, 0);
      const totalTracks = new Set(history.map(entry => entry.track_id)).size;
      const completedListening = history.filter(entry => entry.completed).length;
      const completionRate = history.length > 0 ? (completedListening / history.length) * 100 : 0;
      const averageListeningTime = history.length > 0 ? totalListeningTime / history.length : 0;

      // Morceau le plus écouté
      const trackCounts = history.reduce((acc, entry) => {
        acc[entry.track_id] = (acc[entry.track_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostPlayedTrackId = Object.keys(trackCounts).reduce((a, b) => 
        trackCounts[a] > trackCounts[b] ? a : b, ''
      );
      
      const mostPlayedTrack = history.find(entry => entry.track_id === mostPlayedTrackId)?.track || null;

      // Artiste favori
      const artistCounts = history.reduce((acc, entry) => {
        const artist = entry.track?.user_profiles?.username;
        if (artist) {
          acc[artist] = (acc[artist] || 0) + entry.duration_listened;
        }
        return acc;
      }, {} as Record<string, number>);

      const favoriteArtist = Object.keys(artistCounts).reduce((a, b) => 
        artistCounts[a] > artistCounts[b] ? a : b, ''
      ) || null;

      // Statistiques par semaine (dernières 12 semaines)
      const weeklyStats = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekHistory = history.filter(entry => {
          const entryDate = new Date(entry.listened_at);
          return entryDate >= weekStart && entryDate <= weekEnd;
        });

        const weekMinutes = weekHistory.reduce((sum, entry) => sum + entry.duration_listened, 0) / 60;
        
        weeklyStats.push({
          date: weekStart.toISOString().split('T')[0],
          minutes: Math.round(weekMinutes),
        });
      }

      // Genres préférés
      const genreCounts = history.reduce((acc, entry) => {
        const genres = entry.track?.genre;
        if (genres) {
          const genreArray = Array.isArray(genres) ? genres : [genres];
          genreArray.forEach(genre => {
            acc[genre] = (acc[genre] || 0) + entry.duration_listened;
          });
        }
        return acc;
      }, {} as Record<string, number>);

      const topGenres = Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([genre, seconds]) => ({
          genre,
          minutes: Math.round(seconds / 60),
        }));

      // Morceaux récemment écoutés (derniers 20)
      const recentlyPlayed = history
        .slice(0, 20)
        .map(entry => entry.track)
        .filter(Boolean) as Track[];

      // Moyenne quotidienne (derniers 30 jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentHistory = history.filter(entry => 
        new Date(entry.listened_at) >= thirtyDaysAgo
      );
      
      const recentListeningTime = recentHistory.reduce((sum, entry) => sum + entry.duration_listened, 0);
      const dailyAverage = Math.round((recentListeningTime / 30) / 60); // minutes par jour

      set({
        stats: {
          totalListeningTime,
          totalTracks,
          averageListeningTime,
          completionRate,
          mostPlayedTrack,
          favoriteArtist,
          dailyAverage,
          weeklyStats,
          monthlyStats: [], // À implémenter si nécessaire
          topGenres,
          recentlyPlayed,
        }
      });

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du calcul des statistiques'
      });
    }
  },

  getStatsForPeriod: async (startDate: Date, endDate: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const { data, error } = await supabase
        .from('listening_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('listened_at', startDate.toISOString())
        .lte('listened_at', endDate.toISOString());

      if (error) throw error;

      const totalListeningTime = data.reduce((sum, entry) => sum + entry.duration_listened, 0);
      const totalTracks = new Set(data.map(entry => entry.track_id)).size;
      const completedCount = data.filter(entry => entry.completed).length;
      const completionRate = data.length > 0 ? (completedCount / data.length) * 100 : 0;

      return {
        totalListeningTime,
        totalTracks,
        completionRate,
      };

    } catch (error) {
      console.error('Erreur lors du calcul des statistiques de période:', error);
      return {};
    }
  },

  exportHistory: async (format: 'json' | 'csv') => {
    const { listeningHistory } = get();
    
    if (format === 'json') {
      return JSON.stringify(listeningHistory, null, 2);
    } else {
      // Format CSV
      const headers = ['Date', 'Titre', 'Artiste', 'Durée écoutée', 'Complété'];
      const rows = listeningHistory.map(entry => [
        new Date(entry.listened_at).toLocaleString(),
        entry.track?.title || '',
        entry.track?.user_profiles?.username || '',
        `${Math.round(entry.duration_listened / 60)} min`,
        entry.completed ? 'Oui' : 'Non',
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  },

  // Actions de maintenance
  cleanupOldHistory: async (olderThanDays: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { error } = await supabase
        .from('listening_history')
        .delete()
        .eq('user_id', user.id)
        .lt('listened_at', cutoffDate.toISOString());

      if (error) throw error;

      await get().refreshHistory();

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du nettoyage'
      });
    }
  },

  clearHistory: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('listening_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      set({
        listeningHistory: [],
        recentTracks: [],
        stats: initialStats,
      });

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression'
      });
    }
  },

  // Utilitaires
  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setDateRange: (range: HistoryStore['dateRange']) => {
    set({ dateRange: range });
    get().getHistoryByDateRange(range);
  },
}));