import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { 
  TrackVersion, 
  TrackWithVersions,
  VersionStats,
  VersionType
} from '@/types';

interface VersionsState {
  // State
  trackVersions: Record<string, TrackVersion[]>;  // trackId -> versions[]
  activeVersions: Record<string, string>;         // trackId -> activeVersionId
  versionStats: Record<string, VersionStats>;     // versionId -> stats
  loading: Record<string, boolean>;               // trackId -> loading
  errors: Record<string, string | null>;          // trackId -> error
  
  // Actions
  loadVersions: (trackId: string) => Promise<void>;
  setActiveVersion: (trackId: string, versionId: string) => Promise<boolean>;
  addVersion: (trackId: string, version: TrackVersion) => void;
  removeVersion: (trackId: string, versionId: string) => void;
  updateVersion: (trackId: string, versionId: string, updates: Partial<TrackVersion>) => void;
  loadVersionStats: (versionId: string) => Promise<void>;
  
  // Getters
  getVersionsForTrack: (trackId: string) => TrackVersion[];
  getActiveVersion: (trackId: string) => TrackVersion | null;
  getVersionById: (trackId: string, versionId: string) => TrackVersion | null;
  getTrackWithVersions: (trackId: string) => TrackWithVersions | null;
  isLoading: (trackId: string) => boolean;
  getError: (trackId: string) => string | null;
  
  // Utils
  clearTrackData: (trackId: string) => void;
  clearAll: () => void;
}

export const useVersionsStore = create<VersionsState>()((set, get) => ({
  // === STATE ===
  trackVersions: {},
  activeVersions: {},
  versionStats: {},
  loading: {},
  errors: {},

  // === ACTIONS ===
  loadVersions: async (trackId: string) => {
    set((state) => ({
      loading: { ...state.loading, [trackId]: true },
      errors: { ...state.errors, [trackId]: null }
    }));

    try {
      const { data: versions, error } = await supabase
        .from('track_versions')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type cast version_type to VersionType enum
      const versionsArray = (versions || []).map(version => ({
        ...version,
        version_type: version.version_type as VersionType
      })) as TrackVersion[];
      
      const activeVersion = versionsArray.find(v => v.is_primary);

      set((state) => ({
        trackVersions: {
          ...state.trackVersions,
          [trackId]: versionsArray
        },
        activeVersions: {
          ...state.activeVersions,
          [trackId]: activeVersion?.id || (versionsArray[0]?.id ?? '')
        },
        loading: { ...state.loading, [trackId]: false }
      }));

    } catch (error) {
      console.error('Error loading versions:', error);
      set((state) => ({
        loading: { ...state.loading, [trackId]: false },
        errors: { 
          ...state.errors, 
          [trackId]: error instanceof Error ? error.message : 'Erreur de chargement'
        }
      }));
    }
  },

  setActiveVersion: async (trackId: string, versionId: string) => {
    const { trackVersions } = get();
    const versions = trackVersions[trackId] || [];
    const targetVersion = versions.find(v => v.id === versionId);
    
    if (!targetVersion) {
      console.error('Version not found:', versionId);
      return false;
    }

    try {
      // 1. Désactiver toutes les versions du track
      await supabase
        .from('track_versions')
        .update({ is_primary: false })
        .eq('track_id', trackId);

      // 2. Activer la version sélectionnée
      const { error } = await supabase
        .from('track_versions')
        .update({ is_primary: true })
        .eq('id', versionId);

      if (error) throw error;

      // 3. Mettre à jour l'état local
      set((state) => ({
        trackVersions: {
          ...state.trackVersions,
          [trackId]: versions.map(v => ({
            ...v,
            is_primary: v.id === versionId
          }))
        },
        activeVersions: {
          ...state.activeVersions,
          [trackId]: versionId
        }
      }));

      return true;

    } catch (error) {
      console.error('Error setting active version:', error);
      return false;
    }
  },

  addVersion: (trackId: string, version: TrackVersion) => {
    set((state) => ({
      trackVersions: {
        ...state.trackVersions,
        [trackId]: [version, ...(state.trackVersions[trackId] || [])]
      },
      // Si c'est la première version ou version primaire, la définir comme active
      activeVersions: {
        ...state.activeVersions,
        [trackId]: version.is_primary || !state.trackVersions[trackId]?.length 
          ? version.id 
          : state.activeVersions[trackId]
      }
    }));
  },

  removeVersion: (trackId: string, versionId: string) => {
    set((state) => {
      const versions = state.trackVersions[trackId] || [];
      const filteredVersions = versions.filter(v => v.id !== versionId);
      const wasActive = state.activeVersions[trackId] === versionId;
      
      return {
        trackVersions: {
          ...state.trackVersions,
          [trackId]: filteredVersions
        },
        activeVersions: {
          ...state.activeVersions,
          [trackId]: wasActive ? (filteredVersions[0]?.id || '') : state.activeVersions[trackId]
        },
        versionStats: Object.fromEntries(
          Object.entries(state.versionStats).filter(([id]) => id !== versionId)
        )
      };
    });
  },

  updateVersion: (trackId: string, versionId: string, updates: Partial<TrackVersion>) => {
    set((state) => ({
      trackVersions: {
        ...state.trackVersions,
        [trackId]: (state.trackVersions[trackId] || []).map(v => 
          v.id === versionId ? { ...v, ...updates } : v
        )
      }
    }));
  },

  loadVersionStats: async (versionId: string) => {
    try {
      // TODO: Implémenter la table version_stats
      // const { data: stats, error } = await supabase
      //   .from('version_stats')
      //   .select('*')
      //   .eq('version_id', versionId)
      //   .single();

      // if (error && error.code !== 'PGRST116') throw error;

      // Données mockées pour l'instant
      const mockStats: VersionStats = {
        version_id: versionId,
        track_id: '',
        plays: Math.floor(Math.random() * 100),
        likes: Math.floor(Math.random() * 50),
        downloads: Math.floor(Math.random() * 20),
        skip_rate: Math.random() * 0.3,
        completion_rate: 0.7 + Math.random() * 0.3,
        created_at: new Date().toISOString()
      };

      set((state) => ({
        versionStats: {
          ...state.versionStats,
          [versionId]: mockStats
        }
      }));

    } catch (error) {
      console.error('Error loading version stats:', error);
    }
  },

  // === GETTERS ===
  getVersionsForTrack: (trackId: string) => {
    return get().trackVersions[trackId] || [];
  },

  getActiveVersion: (trackId: string) => {
    const { trackVersions, activeVersions } = get();
    const versions = trackVersions[trackId] || [];
    const activeVersionId = activeVersions[trackId];
    
    return versions.find(v => v.id === activeVersionId) || versions[0] || null;
  },

  getVersionById: (trackId: string, versionId: string) => {
    const versions = get().trackVersions[trackId] || [];
    return versions.find(v => v.id === versionId) || null;
  },

  getTrackWithVersions: (trackId: string) => {
    const { trackVersions, activeVersions } = get();
    const versions = trackVersions[trackId] || [];
    const activeVersionId = activeVersions[trackId];
    const activeVersion = versions.find(v => v.id === activeVersionId) || versions[0];
    
    if (!activeVersion) return null;

    // Créer un objet TrackWithVersions basé sur la version active
    const trackWithVersions: TrackWithVersions = {
      // Propriétés de Track (héritées de la version active)
      id: trackId,
      title: '', // À remplir depuis la table tracks
      user_id: '',
      duration: activeVersion.duration,
      file_url: activeVersion.file_url,
      artwork_url: null,
      album_id: null,
      track_number: null,
      genre: null,
      release_year: null,
      description: null,
      bpm: null,
      lyrics: null,
      mood: null,
      instruments: null,
      key: null,
      is_published: true,
      created_at: activeVersion.created_at,
      updated_at: activeVersion.updated_at,
      
      // Propriétés spécifiques aux versions
      versions,
      active_version: activeVersion,
      versions_count: versions.length
    };

    return trackWithVersions;
  },

  isLoading: (trackId: string) => {
    return get().loading[trackId] || false;
  },

  getError: (trackId: string) => {
    return get().errors[trackId] || null;
  },

  // === UTILS ===
  clearTrackData: (trackId: string) => {
    set((state) => {
      const {
        [trackId]: removedVersions,
        ...restTrackVersions
      } = state.trackVersions;
      
      const {
        [trackId]: removedActive,
        ...restActiveVersions
      } = state.activeVersions;
      
      const {
        [trackId]: removedLoading,
        ...restLoading
      } = state.loading;
      
      const {
        [trackId]: removedError,
        ...restErrors
      } = state.errors;

      return {
        trackVersions: restTrackVersions,
        activeVersions: restActiveVersions,
        loading: restLoading,
        errors: restErrors
      };
    });
  },

  clearAll: () => {
    set({
      trackVersions: {},
      activeVersions: {},
      versionStats: {},
      loading: {},
      errors: {}
    });
  }
}));

// === SELECTORS UTILITAIRES ===

// Hook pour obtenir les versions d'un track spécifique
export const useTrackVersions = (trackId: string) => {
  return useVersionsStore((state) => ({
    versions: state.getVersionsForTrack(trackId),
    activeVersion: state.getActiveVersion(trackId),
    loading: state.isLoading(trackId),
    error: state.getError(trackId),
    versionsCount: state.getVersionsForTrack(trackId).length,
    
    // Actions liées à ce track
    loadVersions: () => state.loadVersions(trackId),
    setActiveVersion: (versionId: string) => state.setActiveVersion(trackId, versionId),
    addVersion: (version: TrackVersion) => state.addVersion(trackId, version),
    removeVersion: (versionId: string) => state.removeVersion(trackId, versionId),
    updateVersion: (versionId: string, updates: Partial<TrackVersion>) => 
      state.updateVersion(trackId, versionId, updates),
    clearData: () => state.clearTrackData(trackId)
  }));
};

// Hook pour obtenir les statistiques de versions
export const useVersionStats = (versionId: string) => {
  return useVersionsStore((state) => ({
    stats: state.versionStats[versionId] || null,
    loadStats: () => state.loadVersionStats(versionId)
  }));
};

// Hook pour obtenir les versions groupées par type
export const useVersionsByType = (trackId: string) => {
  return useVersionsStore((state) => {
    const versions = state.getVersionsForTrack(trackId);
    
    const groupedVersions = versions.reduce((acc, version) => {
      const type = version.version_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(version);
      return acc;
    }, {} as Record<VersionType, TrackVersion[]>);
    
    return groupedVersions;
  });
};