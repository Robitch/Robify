import { create } from 'zustand';
import * as FileSystem from 'expo-file-system';
import { Track } from '@/types';
import { supabase } from '@/lib/supabase';
import { OfflineTrack, DownloadProgress, OfflineSettings } from '~/types/library';

interface OfflineStore {
  // État
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  offlineTracks: OfflineTrack[];
  offlineTrackIds: Set<string>;
  downloadQueue: string[];
  activeDownloads: Map<string, DownloadProgress>;
  totalOfflineSize: number;
  availableSpace: number;
  settings: OfflineSettings;
  
  // Actions principales
  initializeOfflineStore: () => Promise<void>;
  refreshOfflineStore: () => Promise<void>;
  
  // Actions de téléchargement
  downloadTrack: (track: Track, quality?: 'standard' | 'high' | 'lossless') => Promise<void>;
  pauseDownload: (trackId: string) => void;
  resumeDownload: (trackId: string) => Promise<void>;
  cancelDownload: (trackId: string) => Promise<void>;
  removeFromOffline: (trackId: string) => Promise<void>;
  
  // Actions de queue
  addToDownloadQueue: (trackId: string) => void;
  removeFromDownloadQueue: (trackId: string) => void;
  processDownloadQueue: () => Promise<void>;
  clearDownloadQueue: () => void;
  
  // Actions de requête
  isOffline: (trackId: string) => boolean;
  isDownloading: (trackId: string) => boolean;
  getDownloadProgress: (trackId: string) => DownloadProgress | undefined;
  getOfflineTrack: (trackId: string) => OfflineTrack | undefined;
  getOfflineSize: () => Promise<number>;
  canDownloadMore: (trackSize?: number) => boolean;
  
  // Actions de maintenance
  cleanupOfflineFiles: () => Promise<void>;
  validateOfflineFiles: () => Promise<void>;
  syncWithSupabase: () => Promise<void>;
  updateSettings: (newSettings: Partial<OfflineSettings>) => Promise<void>;
  
  // Utilitaires
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Dossier de stockage offline
const OFFLINE_DIRECTORY = `${FileSystem.documentDirectory}offline/`;

// Paramètres par défaut
const DEFAULT_SETTINGS: OfflineSettings = {
  maxOfflineSize: 2 * 1024 * 1024 * 1024, // 2GB en bytes
  downloadQuality: 'standard',
  autoDownloadFavorites: false,
  downloadOnlyOnWifi: true,
  deleteOldDownloads: true,
  oldDownloadThresholdDays: 30,
};

export const useOfflineStore = create<OfflineStore>((set, get) => ({
  // État initial
  isInitialized: false,
  isLoading: false,
  error: null,
  offlineTracks: [],
  offlineTrackIds: new Set(),
  downloadQueue: [],
  activeDownloads: new Map(),
  totalOfflineSize: 0,
  availableSpace: 0,
  settings: DEFAULT_SETTINGS,

  // Actions principales
  initializeOfflineStore: async () => {
    if (get().isInitialized) return;
    
    set({ isLoading: true, error: null });
    try {
      // Créer le dossier offline s'il n'existe pas
      const dirInfo = await FileSystem.getInfoAsync(OFFLINE_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(OFFLINE_DIRECTORY, { intermediates: true });
      }

      // Charger les paramètres sauvegardés
      const settingsPath = `${FileSystem.documentDirectory}offline_settings.json`;
      try {
        const savedSettings = await FileSystem.readAsStringAsync(settingsPath);
        const settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
        set({ settings });
      } catch (error) {
        // Utiliser les paramètres par défaut
      }

      // Synchroniser avec Supabase et valider les fichiers locaux
      await get().syncWithSupabase();
      await get().validateOfflineFiles();
      await get().getOfflineSize();

      set({ isInitialized: true });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'initialisation du mode offline',
      });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshOfflineStore: async () => {
    await get().syncWithSupabase();
    await get().validateOfflineFiles();
    await get().getOfflineSize();
  },

  // Actions de téléchargement
  downloadTrack: async (track: Track) => {
    const { offlineTrackIds, activeDownloads } = get();
    
    // Vérifier si déjà téléchargé ou en cours
    if (offlineTrackIds.has(track.id) || activeDownloads.has(track.id)) {
      return;
    }

    // Estimer la taille du fichier et vérifier la limite
    const estimatedSize = (track.duration || 180) * 1000 * 128 / 8; // Estimation pour 128kbps
    if (!get().canDownloadMore(estimatedSize)) {
      set({ error: 'Espace de stockage offline insuffisant' });
      return;
    }

    const localPath = `${OFFLINE_DIRECTORY}${track.id}.mp3`;
    
    // Initialiser le progress de téléchargement
    const downloadProgress: DownloadProgress = {
      trackId: track.id,
      progress: 0,
      status: 'downloading',
      bytesDownloaded: 0,
      totalBytes: estimatedSize,
    };

    set({ 
      activeDownloads: new Map([...get().activeDownloads, [track.id, downloadProgress]]) 
    });

    try {
      // Créer le downloadResumable avec callback de progression
      const downloadResumable = FileSystem.createDownloadResumable(
        track.file_url,
        localPath,
        {},
        (downloadProgressEvent) => {
          const progress = (downloadProgressEvent.totalBytesWritten / downloadProgressEvent.totalBytesExpectedToWrite) * 100;
          
          const updatedProgress: DownloadProgress = {
            ...downloadProgress,
            progress: Math.round(progress),
            bytesDownloaded: downloadProgressEvent.totalBytesWritten,
            totalBytes: downloadProgressEvent.totalBytesExpectedToWrite,
          };

          set({
            activeDownloads: new Map([...get().activeDownloads, [track.id, updatedProgress]])
          });
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        // Téléchargement réussi
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        
        const offlineTrack: OfflineTrack = {
          ...track,
          localPath: result.uri,
          downloadedAt: new Date().toISOString(),
          fileSize: fileInfo.size || 0,
        };

        // Sauvegarder dans Supabase
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('downloads')
              .insert({
                user_id: user.id,
                track_id: track.id,
                local_path: result.uri,
                file_size: fileInfo.size || 0,
              });
          }
        } catch (dbError) {
          console.error('Erreur sauvegarde Supabase:', dbError);
        }

        set({
          offlineTracks: [...get().offlineTracks, offlineTrack],
          offlineTrackIds: new Set([...get().offlineTrackIds, track.id]),
          activeDownloads: new Map([...Array.from(get().activeDownloads)].filter(([id]) => id !== track.id)),
        });

        // Mettre à jour la taille totale
        await get().getOfflineSize();
      }

    } catch (error) {
      // Marquer le téléchargement comme échoué
      const failedProgress: DownloadProgress = {
        ...downloadProgress,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur de téléchargement',
      };

      set({
        activeDownloads: new Map([...get().activeDownloads, [track.id, failedProgress]])
      });

      // Nettoyer le fichier partiel
      try {
        await FileSystem.deleteAsync(localPath, { idempotent: true });
      } catch (cleanupError) {
        console.error('Erreur lors du nettoyage:', cleanupError);
      }
    }
  },

  pauseDownload: (trackId: string) => {
    const { activeDownloads } = get();
    const download = activeDownloads.get(trackId);
    
    if (download && download.status === 'downloading') {
      set({
        activeDownloads: new Map([
          ...activeDownloads, 
          [trackId, { ...download, status: 'paused' }]
        ])
      });
    }
  },

  resumeDownload: async (trackId: string) => {
    // Pour simplifier, on relance le téléchargement depuis le début
    // Dans une version plus avancée, on pourrait utiliser downloadResumable.resumeAsync()
    const { offlineTracks } = get();
    const track = offlineTracks.find(t => t.id === trackId);
    
    if (track) {
      await get().downloadTrack(track);
    }
  },

  cancelDownload: async (trackId: string) => {
    const { activeDownloads } = get();
    const download = activeDownloads.get(trackId);
    
    if (download) {
      // Marquer comme annulé
      set({
        activeDownloads: new Map([
          ...Array.from(activeDownloads).filter(([id]) => id !== trackId)
        ])
      });

      // Nettoyer le fichier partiel
      const localPath = `${OFFLINE_DIRECTORY}${trackId}.mp3`;
      try {
        await FileSystem.deleteAsync(localPath, { idempotent: true });
      } catch (error) {
        console.error('Erreur lors de l\'annulation:', error);
      }
    }
  },

  removeFromOffline: async (trackId: string) => {
    const { offlineTracks } = get();
    const track = offlineTracks.find(t => t.id === trackId);
    
    if (track) {
      try {
        // Supprimer de Supabase d'abord
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('downloads')
            .delete()
            .eq('user_id', user.id)
            .eq('track_id', trackId);
        }

        // Supprimer le fichier local
        await FileSystem.deleteAsync(track.localPath, { idempotent: true });
        
        // Mettre à jour l'état
        set({
          offlineTracks: offlineTracks.filter(t => t.id !== trackId),
          offlineTrackIds: new Set([...get().offlineTrackIds].filter(id => id !== trackId)),
        });

        // Mettre à jour la taille totale
        await get().getOfflineSize();
        
      } catch (error) {
        set({ error: `Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}` });
      }
    }
  },

  // Actions de queue
  addToDownloadQueue: (trackId: string) => {
    const { downloadQueue } = get();
    if (!downloadQueue.includes(trackId)) {
      set({ downloadQueue: [...downloadQueue, trackId] });
    }
  },

  removeFromDownloadQueue: (trackId: string) => {
    set({ 
      downloadQueue: get().downloadQueue.filter(id => id !== trackId) 
    });
  },

  processDownloadQueue: async () => {
    const { downloadQueue } = get();
    
    for (const trackId of downloadQueue) {
      // Charger les données du track depuis Supabase
      const { data: track } = await supabase
        .from('tracks')
        .select(`
          *,
          user_profiles(username)
        `)
        .eq('id', trackId)
        .single();

      if (track) {
        await get().downloadTrack(track as Track);
        get().removeFromDownloadQueue(trackId);
      }
    }
  },

  clearDownloadQueue: () => {
    set({ downloadQueue: [] });
  },

  // Actions de requête
  isOffline: (trackId: string) => {
    return get().offlineTrackIds.has(trackId);
  },

  isDownloading: (trackId: string) => {
    const download = get().activeDownloads.get(trackId);
    return download ? download.status === 'downloading' : false;
  },

  getDownloadProgress: (trackId: string) => {
    return get().activeDownloads.get(trackId);
  },

  getOfflineTrack: (trackId: string) => {
    return get().offlineTracks.find(track => track.id === trackId);
  },

  getOfflineSize: async () => {
    const { offlineTracks } = get();
    let totalSize = 0;

    for (const track of offlineTracks) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(track.localPath);
        if (fileInfo.exists) {
          totalSize += fileInfo.size || 0;
        }
      } catch (error) {
        console.error(`Erreur lors de la vérification de ${track.localPath}:`, error);
      }
    }

    set({ totalOfflineSize: totalSize });
    return totalSize;
  },

  canDownloadMore: (trackSize: number = 0) => {
    const { totalOfflineSize, settings } = get();
    return (totalOfflineSize + trackSize) <= settings.maxOfflineSize;
  },

  // Actions de maintenance
  cleanupOfflineFiles: async () => {
    try {
      const dirInfo = await FileSystem.readDirectoryAsync(OFFLINE_DIRECTORY);
      const { offlineTrackIds } = get();

      for (const fileName of dirInfo) {
        const trackId = fileName.replace('.mp3', '');
        if (!offlineTrackIds.has(trackId)) {
          // Fichier orphelin, le supprimer
          await FileSystem.deleteAsync(`${OFFLINE_DIRECTORY}${fileName}`, { idempotent: true });
        }
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
    }
  },

  validateOfflineFiles: async () => {
    const { offlineTracks } = get();
    const validTracks: OfflineTrack[] = [];
    const validTrackIds = new Set<string>();

    for (const track of offlineTracks) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(track.localPath);
        if (fileInfo.exists) {
          validTracks.push(track);
          validTrackIds.add(track.id);
        }
      } catch (error) {
        console.error(`Fichier manquant: ${track.localPath}`);
      }
    }

    set({
      offlineTracks: validTracks,
      offlineTrackIds: validTrackIds,
    });
  },

  // Synchronisation avec Supabase
  syncWithSupabase: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('downloads')
        .select(`
          *,
          tracks (
            *,
            user_profiles(username),
            albums (title)
          )
        `)
        .eq('user_id', user.id)
        .order('downloaded_at', { ascending: false });

      if (error) throw error;

      const supabaseOfflineTracks: OfflineTrack[] = [];
      const supabaseOfflineIds = new Set<string>();

      for (const download of data || []) {
        if (download.tracks) {
          const offlineTrack: OfflineTrack = {
            ...download.tracks as Track,
            localPath: download.local_path,
            downloadedAt: download.downloaded_at,
            fileSize: download.file_size || 0,
          };
          supabaseOfflineTracks.push(offlineTrack);
          supabaseOfflineIds.add(download.track_id);
        }
      }

      set({
        offlineTracks: supabaseOfflineTracks,
        offlineTrackIds: supabaseOfflineIds,
      });

    } catch (error) {
      console.error('Erreur sync Supabase:', error);
    }
  },

  // Mise à jour des paramètres
  updateSettings: async (newSettings: Partial<OfflineSettings>) => {
    try {
      const updatedSettings = { ...get().settings, ...newSettings };
      
      // Sauvegarder localement
      const settingsPath = `${FileSystem.documentDirectory}offline_settings.json`;
      await FileSystem.writeAsStringAsync(settingsPath, JSON.stringify(updatedSettings));
      
      set({ settings: updatedSettings });
      
      // Si le nettoyage automatique est activé, l'exécuter
      if (updatedSettings.deleteOldDownloads) {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - updatedSettings.oldDownloadThresholdDays);
        
        const { offlineTracks } = get();
        const tracksToDelete = offlineTracks.filter(track => 
          new Date(track.downloadedAt) < thresholdDate
        );

        for (const track of tracksToDelete) {
          await get().removeFromOffline(track.id);
        }
      }
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des paramètres',
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
}));