import { useEffect, useRef } from 'react';
import { useActiveTrack, useIsPlaying, useProgress } from 'react-native-track-player';
import { useListeningTracker } from './useListeningTracker';
import { Track } from '@/types';

export const usePlayerWithTracking = () => {
  const activeTrack = useActiveTrack();
  const { playing } = useIsPlaying();
  const progress = useProgress();
  
  const {
    startTracking,
    updateProgress,
    completeTracking,
    pauseTracking,
    resumeTracking,
    currentTrack,
    isTracking,
  } = useListeningTracker();

  const lastActiveTrackRef = useRef<string | null>(null);
  const lastPlayingStateRef = useRef<boolean>(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Détecter le changement de morceau
  useEffect(() => {
    if (activeTrack?.id && activeTrack.id !== lastActiveTrackRef.current) {
      // Convertir le track TrackPlayer en Track standard
      const track: Track = {
        id: activeTrack.id,
        title: activeTrack.title || 'Titre inconnu',
        artist: activeTrack.artist || 'Artiste inconnu',
        file_url: activeTrack.url || '',
        artwork_url: activeTrack.artwork || null,
        duration: activeTrack.duration || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: '', // Sera récupéré si nécessaire
        genre: null,
        mood: null,
        album_id: null,
        description: null,
        play_count: 0,
        is_public: true,
        user_profiles: null,
        albums: null,
        reactions: null,
      };

      startTracking(track);
      lastActiveTrackRef.current = activeTrack.id;
      
      console.log('🎵 Nouveau morceau détecté:', track.title);
      console.log('🎵 Tracking started for track ID:', track.id);
    }
  }, [activeTrack?.id, startTracking]);

  // Détecter les changements d'état de lecture
  useEffect(() => {
    if (playing !== lastPlayingStateRef.current) {
      if (playing) {
        resumeTracking();
        console.log('▶️ Lecture reprise');
      } else {
        pauseTracking();
        console.log('⏸️ Lecture pausée');
      }
      lastPlayingStateRef.current = playing;
    }
  }, [playing, pauseTracking, resumeTracking]);

  // Mettre à jour la progression pendant la lecture
  useEffect(() => {
    if (playing && activeTrack?.id && progress.position > 0) {
      updateProgress(progress.position, progress.duration);
      
      // Mettre à jour toutes les 5 secondes pour éviter trop d'appels
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      progressIntervalRef.current = setInterval(() => {
        if (playing) {
          updateProgress(progress.position, progress.duration);
        }
      }, 5000);
    } else if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [playing, progress.position, progress.duration, activeTrack?.id, updateProgress]);

  // Compléter automatiquement si on atteint la fin
  useEffect(() => {
    if (activeTrack?.duration && progress.position >= activeTrack.duration - 5) {
      // 5 secondes avant la fin = considéré comme complété
      completeTracking(true);
      console.log('✅ Morceau complété automatiquement');
    }
  }, [progress.position, activeTrack?.duration, completeTracking]);

  // Nettoyage à la destruction
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (isTracking) {
        completeTracking(false); // Non complété car composant détruit
      }
    };
  }, [isTracking, completeTracking]);

  return {
    activeTrack,
    playing,
    progress,
    currentTrack,
    isTracking,
    // Actions de tracking exposées si nécessaire
    completeCurrentTracking: () => completeTracking(true),
    pauseCurrentTracking: pauseTracking,
    resumeCurrentTracking: resumeTracking,
  };
};