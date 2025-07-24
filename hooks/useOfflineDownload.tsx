import { useEffect, useState } from 'react';
import * as Network from 'expo-network';
import { useOfflineStore } from '~/store/offlineStore';
import { Track } from '@/types';
import { DownloadProgress } from '~/types/library';

export interface UseOfflineDownloadReturn {
  // États
  isOnline: boolean;
  isWifiOnly: boolean;
  canDownload: boolean;

  // Actions de téléchargement
  downloadTrack: (track: Track, quality?: 'standard' | 'high' | 'lossless') => Promise<void>;
  pauseDownload: (trackId: string) => void;
  resumeDownload: (trackId: string) => Promise<void>;
  cancelDownload: (trackId: string) => Promise<void>;
  deleteDownload: (trackId: string) => Promise<void>;

  // États des téléchargements
  isTrackDownloaded: (trackId: string) => boolean;
  isTrackDownloading: (trackId: string) => boolean;
  getDownloadProgress: (trackId: string) => DownloadProgress | null;

  // Gestion de l'espace
  totalSize: number;
  availableSpace: number;
  maxSize: number;
  usedPercentage: number;
  canDownloadMore: (estimatedSize?: number) => boolean;

  // Gestion de la queue
  downloadQueue: string[];
  addToQueue: (trackId: string) => void;
  removeFromQueue: (trackId: string) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;

  // Utilitaires
  formatSize: (bytes: number) => string;
  estimateTrackSize: (track: Track) => number;
}

export const useOfflineDownload = (): UseOfflineDownloadReturn => {
  const [isOnline, setIsOnline] = useState(true);
  const [networkType, setNetworkType] = useState<Network.NetworkStateType>(Network.NetworkStateType.WIFI);

  const {
    offlineTrackIds,
    activeDownloads,
    downloadQueue,
    totalOfflineSize,
    availableSpace,
    settings,
    downloadTrack: storeDownloadTrack,
    pauseDownload: storePauseDownload,
    resumeDownload: storeResumeDownload,
    cancelDownload: storeCancelDownload,
    removeFromOffline,
    isOffline,
    isDownloading,
    getDownloadProgress: storeGetDownloadProgress,
    addToDownloadQueue,
    removeFromDownloadQueue,
    processDownloadQueue,
    clearDownloadQueue,
    canDownloadMore: storeCanDownloadMore,
  } = useOfflineStore();

  // Surveillance de la connectivité réseau
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkNetworkStatus = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        setIsOnline(networkState.isConnected || false);
        setNetworkType(networkState.type || Network.NetworkStateType.UNKNOWN);
      } catch (error) {
        console.error('Erreur vérification réseau:', error);
        setIsOnline(false);
      }
    };

    // Vérification initiale
    checkNetworkStatus();

    // Vérification périodique (toutes les 10 secondes)
    interval = setInterval(checkNetworkStatus, 10000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  // Détermine si on peut télécharger selon les paramètres
  const isWifiOnly = settings.downloadOnlyOnWifi;
  const canDownload = isOnline && (!isWifiOnly || networkType === Network.NetworkStateType.WIFI);

  // Actions de téléchargement avec vérifications
  const downloadTrack = async (track: Track, quality: 'standard' | 'high' | 'lossless' = 'standard') => {
    if (!canDownload) {
      throw new Error(
        !isOnline
          ? 'Connexion Internet requise pour télécharger'
          : 'Connexion Wi-Fi requise selon vos paramètres'
      );
    }

    if (isOffline(track.id)) {
      throw new Error('Ce morceau est déjà téléchargé');
    }

    if (isDownloading(track.id)) {
      throw new Error('Ce morceau est déjà en cours de téléchargement');
    }

    const estimatedSize = estimateTrackSize(track);
    if (!storeCanDownloadMore(estimatedSize)) {
      throw new Error('Espace de stockage insuffisant');
    }

    await storeDownloadTrack(track, quality);
  };

  const pauseDownload = (trackId: string) => {
    if (!isDownloading(trackId)) {
      throw new Error('Aucun téléchargement en cours pour ce morceau');
    }
    storePauseDownload(trackId);
  };

  const resumeDownload = async (trackId: string) => {
    if (!canDownload) {
      throw new Error(
        !isOnline
          ? 'Connexion Internet requise pour reprendre le téléchargement'
          : 'Connexion Wi-Fi requise selon vos paramètres'
      );
    }
    await storeResumeDownload(trackId);
  };

  const cancelDownload = async (trackId: string) => {
    await storeCancelDownload(trackId);
  };

  const deleteDownload = async (trackId: string) => {
    if (!isOffline(trackId)) {
      throw new Error('Ce morceau n\'est pas téléchargé');
    }
    await removeFromOffline(trackId);
  };

  // États des téléchargements
  const isTrackDownloaded = (trackId: string) => isOffline(trackId);
  const isTrackDownloading = (trackId: string) => isDownloading(trackId);
  const getDownloadProgress = (trackId: string): DownloadProgress | null => {
    return storeGetDownloadProgress(trackId) || null;
  };

  // Gestion de l'espace
  const maxSize = settings.maxOfflineSize;
  const usedPercentage = Math.round((totalOfflineSize / maxSize) * 100);

  const canDownloadMoreSpace = (estimatedSize: number = 0) => {
    return storeCanDownloadMore(estimatedSize);
  };

  // Gestion de la queue avec vérifications
  const addToQueue = (trackId: string) => {
    if (isOffline(trackId)) {
      throw new Error('Ce morceau est déjà téléchargé');
    }
    if (downloadQueue.includes(trackId)) {
      throw new Error('Ce morceau est déjà dans la queue');
    }
    addToDownloadQueue(trackId);
  };

  const removeFromQueue = (trackId: string) => {
    removeFromDownloadQueue(trackId);
  };

  const processQueue = async () => {
    if (!canDownload) {
      throw new Error(
        !isOnline
          ? 'Connexion Internet requise pour traiter la queue'
          : 'Connexion Wi-Fi requise selon vos paramètres'
      );
    }
    await processDownloadQueue();
  };

  const clearQueue = () => {
    clearDownloadQueue();
  };

  // Utilitaires
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const estimateTrackSize = (track: Track): number => {
    // Estimation basée sur la durée et la qualité
    const duration = track.duration || 180; // Durée par défaut de 3 minutes

    // Tailles estimées en bytes par seconde selon la qualité
    const qualityBitrates = {
      standard: 128, // 128 kbps
      high: 320,     // 320 kbps
      lossless: 1411 // 1411 kbps (16-bit/44.1kHz)
    };

    const bitrate = qualityBitrates[settings.downloadQuality];
    return Math.round((duration * bitrate * 1000) / 8); // Convert kbps to bytes
  };

  return {
    // États
    isOnline,
    isWifiOnly,
    canDownload,

    // Actions de téléchargement
    downloadTrack,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    deleteDownload,

    // États des téléchargements
    isTrackDownloaded,
    isTrackDownloading,
    getDownloadProgress,

    // Gestion de l'espace
    totalSize: totalOfflineSize,
    availableSpace,
    maxSize,
    usedPercentage,
    canDownloadMore: canDownloadMoreSpace,

    // Gestion de la queue
    downloadQueue,
    addToQueue,
    removeFromQueue,
    processQueue,
    clearQueue,

    // Utilitaires
    formatSize,
    estimateTrackSize,
  };
};