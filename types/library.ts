import { Track, Album } from '@/types';

// === TYPES POUR MA BIBLIOTHÈQUE ===

// Types de base pour les stores
export interface LibraryStats {
  totalTracks: number;
  totalFavorites: number;
  totalOfflineDownloads: number;
  totalListeningTime: number; // en secondes
  mostPlayedTrack: Track | null;
  recentlyPlayed: Track[];
  totalArtists: number;
  totalAlbums: number;
}

// === TYPES FAVORIS ===

export type ReactionType = 'like' | 'fire' | 'heart' | 'mind_blown';

export interface FavoriteTrack extends Track {
  reaction_type: ReactionType;
  favorited_at: string;
}

export interface FavoritesByType {
  like: FavoriteTrack[];
  fire: FavoriteTrack[];
  heart: FavoriteTrack[];
  mind_blown: FavoriteTrack[];
}

// === TYPES OFFLINE ===

export interface OfflineTrack extends Track {
  localPath: string;
  downloadedAt: string;
  fileSize: number;
  downloadProgress?: number;
}

export interface DownloadProgress {
  trackId: string;
  progress: number; // 0-100
  status: 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled';
  bytesDownloaded: number;
  totalBytes: number;
  error?: string;
}

export interface OfflineSettings {
  maxOfflineSize: number; // en bytes
  downloadQuality: 'standard' | 'high' | 'lossless';
  autoDownloadFavorites: boolean;
  downloadOnlyOnWifi: boolean;
  deleteOldDownloads: boolean;
  oldDownloadThresholdDays: number;
}

// === TYPES HISTORIQUE ===

export interface ListeningEntry {
  id: string;
  track_id: string;
  user_id: string;
  listened_at: string;
  duration_listened: number; // en secondes
  completed: boolean;
  track?: Track;
}

export interface ListeningStats {
  totalListeningTime: number; // en secondes
  totalTracks: number;
  averageListeningTime: number;
  completionRate: number; // pourcentage
  mostPlayedTrack: Track | null;
  favoriteArtist: string | null;
  dailyAverage: number; // minutes par jour
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];
  topGenres: GenreStats[];
  recentlyPlayed: Track[];
}

export interface WeeklyStats {
  date: string; // YYYY-MM-DD
  minutes: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  minutes: number;
}

export interface GenreStats {
  genre: string;
  minutes: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  minutes: number;
  tracksPlayed: number;
  sessionsCount: number;
}

// === TYPES POUR LES VUES ET COMPOSANTS ===

export interface LibrarySection {
  title: string;
  key: string;
  icon: string;
  count: number;
  description?: string;
  route: string;
}

export interface StatsCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

export interface LibraryFilter {
  type: 'genre' | 'artist' | 'date' | 'duration' | 'favorite' | 'offline';
  value: string;
  label: string;
}

export interface LibrarySortOption {
  key: 'title' | 'artist' | 'date' | 'duration' | 'plays' | 'favorite_date';
  label: string;
  order: 'asc' | 'desc';
}

// === TYPES POUR LES ACTIONS ===

export interface BulkAction {
  type: 'add_to_favorites' | 'remove_from_favorites' | 'download_offline' | 'remove_offline' | 'add_to_queue' | 'delete_from_history';
  trackIds: string[];
  metadata?: Record<string, any>;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'txt';
  includeMetadata: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
  sections: {
    favorites: boolean;
    history: boolean;
    stats: boolean;
    offline: boolean;
  };
}

// === TYPES POUR LES PRÉFÉRENCES ===

export interface LibraryPreferences {
  defaultView: 'list' | 'grid' | 'compact';
  defaultSort: LibrarySortOption;
  showRecommendations: boolean;
  autoRefreshInterval: number; // en minutes, 0 = désactivé
  enableNotifications: {
    newFavorites: boolean;
    downloadComplete: boolean;
    weeklyStats: boolean;
    storageAlerts: boolean;
  };
  privacy: {
    shareListeningStats: boolean;
    shareTopArtists: boolean;
    shareFavorites: boolean;
  };
}

// === TYPES POUR LES RECOMMANDATIONS ===

export interface Recommendation {
  type: 'similar_to_favorite' | 'new_from_artist' | 'trending' | 'rediscover';
  track: Track;
  reason: string;
  confidence: number; // 0-1
  createdAt: string;
}

export interface RecommendationEngine {
  basedOnFavorites: Track[];
  basedOnHistory: Track[];
  trending: Track[];
  rediscover: Track[]; // anciens morceaux non écoutés récemment
}

// === TYPES POUR LA SYNCHRONISATION ===

export interface SyncStatus {
  lastSync: string;
  isSyncing: boolean;
  errors: string[];
  pendingChanges: {
    favorites: number;
    history: number;
    downloads: number;
  };
}

export interface SyncOperation {
  type: 'upload' | 'download' | 'delete';
  resource: 'favorites' | 'history' | 'offline' | 'stats';
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// === TYPES POUR LES WIDGETS/RACCOURCIS ===

export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  action: () => void;
  badge?: number;
  color?: string;
}

export interface MiniPlayer {
  isVisible: boolean;
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  showFullPlayer: () => void;
}

// === TYPES POUR LA RECHERCHE AVANCÉE ===

export interface AdvancedSearchCriteria {
  query?: string;
  genres?: string[];
  artists?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  durationRange?: {
    min: number; // en secondes
    max: number;
  };
  onlyFavorites?: boolean;
  onlyOffline?: boolean;
  minPlayCount?: number;
  tags?: string[];
}

export interface SearchResult {
  tracks: Track[];
  totalCount: number;
  facets: {
    genres: Array<{ name: string; count: number }>;
    artists: Array<{ name: string; count: number }>;
    decades: Array<{ decade: string; count: number }>;
  };
}

// === TYPES POUR LES INSIGHTS ===

export interface ListeningInsight {
  type: 'pattern' | 'milestone' | 'recommendation' | 'trend';
  title: string;
  description: string;
  data: any;
  importance: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
  createdAt: string;
}

export interface MoodAnalysis {
  dominant: string;
  distribution: Record<string, number>;
  trend: 'more_energetic' | 'more_calm' | 'more_diverse' | 'stable';
  recommendation: string;
}

export interface GenreEvolution {
  timeline: Array<{
    period: string;
    genres: Record<string, number>;
  }>;
  emerging: string[];
  declining: string[];
  stable: string[];
}

// === TYPES UTILITAIRES ===

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  error: string | null;
  errorCode?: string;
  canRetry: boolean;
}

// === TYPES POUR LES HOOKS ===

export interface UseLibraryReturn {
  stats: LibraryStats;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseFavoritesReturn {
  favorites: FavoriteTrack[];
  favoriteIds: Set<string>;
  isFavorite: (trackId: string) => boolean;
  toggleFavorite: (trackId: string, reactionType?: ReactionType) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface UseOfflineReturn {
  offlineTracks: OfflineTrack[];
  isOffline: (trackId: string) => boolean;
  downloadTrack: (track: Track) => Promise<void>;
  removeOffline: (trackId: string) => Promise<void>;
  downloadProgress: Map<string, DownloadProgress>;
  totalSize: number;
  maxSize: number;
  isLoading: boolean;
  error: string | null;
}

export interface UseHistoryReturn {
  history: ListeningEntry[];
  stats: ListeningStats;
  recordPlay: (trackId: string, duration: number, completed: boolean) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}