import { create } from 'zustand';
import TrackPlayer, { 
  Track as RNTPTrack, 
  State, 
  Event,
  RepeatMode,
  Capability
} from 'react-native-track-player';
import { 
  Track, 
  TrackVersion, 
  TrackWithVersions 
} from '@/types';
import { useVersionsStore } from './versionsStore';

interface EnhancedPlayerState {
  // State
  currentTrack: Track | null;
  currentVersion: TrackVersion | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: Track[];
  currentIndex: number;
  repeatMode: RepeatMode;
  isShuffling: boolean;
  buffering: boolean;
  
  // Version-specific state
  availableVersions: TrackVersion[];
  versionSwitching: boolean;
  
  // Actions
  initializePlayer: () => Promise<void>;
  playTrack: (track: Track, versionId?: string) => Promise<void>;
  playTrackWithVersion: (track: Track, version: TrackVersion) => Promise<void>;
  switchToVersion: (versionId: string) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  setQueue: (tracks: Track[], startIndex?: number) => Promise<void>;
  addToQueue: (track: Track) => Promise<void>;
  removeFromQueue: (index: number) => Promise<void>;
  setRepeatMode: (mode: RepeatMode) => Promise<void>;
  toggleShuffle: () => Promise<void>;
  
  // Version management
  loadTrackVersions: (trackId: string) => Promise<void>;
  getActiveVersion: (trackId: string) => TrackVersion | null;
  
  // Utils
  reset: () => Promise<void>;
  getCurrentTrackWithVersions: () => TrackWithVersions | null;
}

export const useEnhancedPlayerStore = create<EnhancedPlayerState>()((set, get) => ({
  // === STATE ===
  currentTrack: null,
  currentVersion: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  queue: [],
  currentIndex: 0,
  repeatMode: RepeatMode.Off,
  isShuffling: false,
  buffering: false,
  
  availableVersions: [],
  versionSwitching: false,

  // === ACTIONS ===
  
  initializePlayer: async () => {
    try {
      await TrackPlayer.setupPlayer({
        waitForBuffer: true,
      });
      
      await TrackPlayer.updateOptions({
        stopWithApp: false,
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
          Capability.Stop,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
        progressUpdateEventInterval: 1,
      });
      
      console.log('✅ Enhanced Player initialized');
    } catch (error) {
      console.error('❌ Player initialization failed:', error);
    }
  },

  playTrack: async (track: Track, versionId?: string) => {
    const { loadTrackVersions, getActiveVersion } = get();
    
    try {
      // 1. Charger les versions du track
      await loadTrackVersions(track.id);
      
      // 2. Déterminer la version à jouer
      let targetVersion: TrackVersion | null = null;
      
      if (versionId) {
        // Version spécifique demandée
        const versionsStore = useVersionsStore.getState();
        targetVersion = versionsStore.getVersionById(track.id, versionId);
      } else {
        // Version active par défaut
        targetVersion = getActiveVersion(track.id);
      }
      
      if (!targetVersion) {
        console.error('No version found for track:', track.id);
        return;
      }
      
      // 3. Jouer avec la version sélectionnée
      await get().playTrackWithVersion(track, targetVersion);
      
    } catch (error) {
      console.error('Error playing track:', error);
    }
  },

  playTrackWithVersion: async (track: Track, version: TrackVersion) => {
    try {
      // Créer l'objet Track pour react-native-track-player
      const trackPlayerTrack: RNTPTrack = {
        id: `${track.id}_${version.id}`,
        url: version.file_url,
        title: track.title,
        artist: track.user_profiles?.username || 'Unknown Artist',
        artwork: track.artwork_url || undefined,
        duration: version.duration || track.duration || 0,
        // Métadonnées additionnelles
        album: track.album?.title,
        genre: Array.isArray(track.genre) ? track.genre.join(', ') : track.genre || undefined,
        // Données personnalisées pour retrouver track et version
        trackId: track.id,
        versionId: version.id,
        versionName: version.version_name,
        versionType: version.version_type,
      };

      // Arrêter la lecture actuelle et ajouter le nouveau track
      await TrackPlayer.reset();
      await TrackPlayer.add(trackPlayerTrack);
      await TrackPlayer.play();

      // Mettre à jour l'état
      set({
        currentTrack: track,
        currentVersion: version,
        isPlaying: true,
        position: 0,
        duration: version.duration || track.duration || 0,
        buffering: false,
        versionSwitching: false
      });

      console.log('🎵 Playing:', track.title, 'Version:', version.version_name);
      
    } catch (error) {
      console.error('Error playing track with version:', error);
      set({ versionSwitching: false, buffering: false });
    }
  },

  switchToVersion: async (versionId: string) => {
    const { currentTrack, position } = get();
    
    if (!currentTrack) {
      console.error('No current track to switch version');
      return;
    }

    set({ versionSwitching: true });
    
    try {
      // Récupérer la nouvelle version
      const versionsStore = useVersionsStore.getState();
      const newVersion = versionsStore.getVersionById(currentTrack.id, versionId);
      
      if (!newVersion) {
        console.error('Version not found:', versionId);
        return;
      }

      // Sauvegarder la position actuelle
      const currentPosition = await TrackPlayer.getPosition();
      
      // Changer de version
      await get().playTrackWithVersion(currentTrack, newVersion);
      
      // Reprendre à la même position si possible
      if (currentPosition > 0 && newVersion.duration && currentPosition < newVersion.duration) {
        await TrackPlayer.seekTo(currentPosition);
        set({ position: currentPosition });
      }
      
    } catch (error) {
      console.error('Error switching version:', error);
    } finally {
      set({ versionSwitching: false });
    }
  },

  togglePlayPause: async () => {
    try {
      const state = await TrackPlayer.getState();
      
      if (state === State.Playing) {
        await TrackPlayer.pause();
        set({ isPlaying: false });
      } else {
        await TrackPlayer.play();
        set({ isPlaying: true });
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  },

  seekTo: async (position: number) => {
    try {
      await TrackPlayer.seekTo(position);
      set({ position });
    } catch (error) {
      console.error('Error seeking:', error);
    }
  },

  skipToNext: async () => {
    try {
      await TrackPlayer.skipToNext();
      // TODO: Gérer le passage au track suivant avec versions
    } catch (error) {
      console.error('Error skipping to next:', error);
    }
  },

  skipToPrevious: async () => {
    try {
      await TrackPlayer.skipToPrevious();
      // TODO: Gérer le passage au track précédent avec versions
    } catch (error) {
      console.error('Error skipping to previous:', error);
    }
  },

  setQueue: async (tracks: Track[], startIndex = 0) => {
    try {
      // TODO: Implémenter la queue avec gestion des versions
      set({ 
        queue: tracks, 
        currentIndex: startIndex 
      });
    } catch (error) {
      console.error('Error setting queue:', error);
    }
  },

  addToQueue: async (track: Track) => {
    set((state) => ({
      queue: [...state.queue, track]
    }));
  },

  removeFromQueue: async (index: number) => {
    set((state) => ({
      queue: state.queue.filter((_, i) => i !== index)
    }));
  },

  setRepeatMode: async (mode: RepeatMode) => {
    try {
      await TrackPlayer.setRepeatMode(mode);
      set({ repeatMode: mode });
    } catch (error) {
      console.error('Error setting repeat mode:', error);
    }
  },

  toggleShuffle: async () => {
    const { isShuffling } = get();
    set({ isShuffling: !isShuffling });
    // TODO: Implémenter la logique de shuffle
  },

  // === VERSION MANAGEMENT ===
  
  loadTrackVersions: async (trackId: string) => {
    try {
      const versionsStore = useVersionsStore.getState();
      await versionsStore.loadVersions(trackId);
      
      const versions = versionsStore.getVersionsForTrack(trackId);
      set({ availableVersions: versions });
      
    } catch (error) {
      console.error('Error loading track versions:', error);
    }
  },

  getActiveVersion: (trackId: string) => {
    const versionsStore = useVersionsStore.getState();
    return versionsStore.getActiveVersion(trackId);
  },

  // === UTILS ===
  
  reset: async () => {
    try {
      await TrackPlayer.reset();
      set({
        currentTrack: null,
        currentVersion: null,
        isPlaying: false,
        position: 0,
        duration: 0,
        queue: [],
        currentIndex: 0,
        availableVersions: [],
        versionSwitching: false,
        buffering: false
      });
    } catch (error) {
      console.error('Error resetting player:', error);
    }
  },

  getCurrentTrackWithVersions: () => {
    const { currentTrack, availableVersions, currentVersion } = get();
    
    if (!currentTrack || !currentVersion) {
      return null;
    }

    const trackWithVersions: TrackWithVersions = {
      ...currentTrack,
      versions: availableVersions,
      active_version: currentVersion,
      versions_count: availableVersions.length
    };

    return trackWithVersions;
  }
}));

// === EVENT LISTENERS ===

// Configuration des événements TrackPlayer
export const setupPlayerEventListeners = () => {
  TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
    const { state } = event;
    useEnhancedPlayerStore.setState({ 
      isPlaying: state === State.Playing,
      buffering: state === State.Buffering || state === State.Loading
    });
  });

  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
    const { position, duration } = event;
    useEnhancedPlayerStore.setState({ 
      position, 
      duration: duration || 0 
    });
  });

  TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (event) => {
    if (event.nextTrack !== null) {
      try {
        const track = await TrackPlayer.getTrack(event.nextTrack);
        if (track) {
          // TODO: Gérer le changement de track avec versions
          console.log('Track changed:', track.title);
        }
      } catch (error) {
        console.error('Error handling track change:', error);
      }
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
    useEnhancedPlayerStore.setState({ 
      isPlaying: false,
      position: 0
    });
  });
};

// === SELECTORS UTILITAIRES ===

// Hook pour l'état du player avec versions
export const usePlayerWithVersions = () => {
  return useEnhancedPlayerStore((state) => ({
    // État du player
    currentTrack: state.currentTrack,
    currentVersion: state.currentVersion,
    isPlaying: state.isPlaying,
    position: state.position,
    duration: state.duration,
    buffering: state.buffering,
    
    // Versions
    availableVersions: state.availableVersions,
    versionSwitching: state.versionSwitching,
    
    // Actions principales
    playTrack: state.playTrack,
    switchToVersion: state.switchToVersion,
    togglePlayPause: state.togglePlayPause,
    seekTo: state.seekTo,
    
    // Getters
    getCurrentTrackWithVersions: state.getCurrentTrackWithVersions
  }));
};

// Hook pour les contrôles de lecture
export const usePlayerControls = () => {
  return useEnhancedPlayerStore((state) => ({
    isPlaying: state.isPlaying,
    repeatMode: state.repeatMode,
    isShuffling: state.isShuffling,
    
    togglePlayPause: state.togglePlayPause,
    skipToNext: state.skipToNext,
    skipToPrevious: state.skipToPrevious,
    setRepeatMode: state.setRepeatMode,
    toggleShuffle: state.toggleShuffle,
    seekTo: state.seekTo
  }));
};

// Hook pour la gestion de la queue
export const usePlayerQueue = () => {
  return useEnhancedPlayerStore((state) => ({
    queue: state.queue,
    currentIndex: state.currentIndex,
    
    setQueue: state.setQueue,
    addToQueue: state.addToQueue,
    removeFromQueue: state.removeFromQueue
  }));
};