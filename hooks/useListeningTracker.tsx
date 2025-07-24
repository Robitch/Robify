import { useEffect, useRef, useCallback } from 'react';
import { useHistoryStore } from '~/store/historyStore';
import { Track } from '@/types';
import { ListeningStats } from '~/types/library';

export interface UseListeningTrackerReturn {
  // Actions de tracking
  startTracking: (track: Track) => void;
  updateProgress: (currentTime: number, duration: number) => void;
  completeTracking: (completed?: boolean) => Promise<void>;
  pauseTracking: () => void;
  resumeTracking: () => void;
  
  // État actuel
  currentTrack: Track | null;
  isTracking: boolean;
  currentProgress: number;
  
  // Statistiques
  stats: ListeningStats;
  refreshStats: () => Promise<void>;
  
  // Historique récent
  recentTracks: Track[];
  
  // Utilitaires
  formatListeningTime: (seconds: number) => string;
  getTrackPlayCount: (trackId: string) => number;
  getTrackListeningTime: (trackId: string) => number;
}

export const useListeningTracker = (): UseListeningTrackerReturn => {
  const {
    currentSession,
    stats,
    recentTracks,
    startListeningSession,
    updateListeningProgress,
    completeListeningSession,
    calculateStats,
    getTrackPlayCount,
    getTrackListeningTime,
  } = useHistoryStore();

  const currentTrackRef = useRef<Track | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  // État actuel
  const currentTrack = currentTrackRef.current;
  const isTracking = currentSession.trackId !== null && !isPausedRef.current;
  const currentProgress = currentSession.lastProgressUpdate;

  // Démarrer le tracking d'un nouveau morceau
  const startTracking = useCallback((track: Track) => {
    // Arrêter le tracking précédent s'il y en a un
    if (currentTrackRef.current && currentSession.trackId) {
      completeListeningSession(
        currentSession.trackId,
        currentSession.lastProgressUpdate,
        false // Non complété car interrompu
      );
    }

    // Démarrer le nouveau tracking
    currentTrackRef.current = track;
    isPausedRef.current = false;
    startListeningSession(track);

    console.log('🎵 Tracking started for:', track.title);
  }, [currentSession, startListeningSession, completeListeningSession]);

  // Mettre à jour la progression
  const updateProgress = useCallback((currentTime: number, duration: number) => {
    if (currentSession.trackId && !isPausedRef.current) {
      updateListeningProgress(currentSession.trackId, currentTime, duration);
    }
  }, [currentSession.trackId, updateListeningProgress]);

  // Compléter le tracking
  const completeTracking = useCallback(async (completed: boolean = true) => {
    if (currentSession.trackId && currentTrackRef.current) {
      const duration = currentTrackRef.current.duration || currentSession.lastProgressUpdate;
      
      await completeListeningSession(
        currentSession.trackId,
        duration,
        completed
      );

      console.log('✅ Tracking completed for:', currentTrackRef.current.title, { completed });
    }

    // Nettoyer les références
    currentTrackRef.current = null;
    isPausedRef.current = false;
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, [currentSession, completeListeningSession]);

  // Pauser le tracking
  const pauseTracking = useCallback(() => {
    isPausedRef.current = true;
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    console.log('⏸️ Tracking paused');
  }, []);

  // Reprendre le tracking
  const resumeTracking = useCallback(() => {
    isPausedRef.current = false;
    console.log('▶️ Tracking resumed');
  }, []);

  // Rafraîchir les statistiques
  const refreshStats = useCallback(async () => {
    await calculateStats();
  }, [calculateStats]);

  // Utilitaires
  const formatListeningTime = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }, []);

  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      // Compléter le tracking en cours s'il y en a un
      if (currentSession.trackId && currentTrackRef.current) {
        completeListeningSession(
          currentSession.trackId,
          currentSession.lastProgressUpdate,
          false // Non complété car composant détruit
        );
      }
    };
  }, []);

  // Auto-pause/resume basé sur l'état de l'application
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        pauseTracking();
      } else if (nextAppState === 'active' && currentSession.trackId) {
        resumeTracking();
      }
    };

    // Note: Dans une vraie app, vous utiliseriez AppState de React Native
    // AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      // AppState.removeEventListener('change', handleAppStateChange);
    };
  }, [currentSession.trackId, pauseTracking, resumeTracking]);

  return {
    // Actions de tracking
    startTracking,
    updateProgress,
    completeTracking,
    pauseTracking,
    resumeTracking,
    
    // État actuel
    currentTrack,
    isTracking,
    currentProgress,
    
    // Statistiques
    stats,
    refreshStats,
    
    // Historique récent
    recentTracks,
    
    // Utilitaires
    formatListeningTime,
    getTrackPlayCount,
    getTrackListeningTime,
  };
};