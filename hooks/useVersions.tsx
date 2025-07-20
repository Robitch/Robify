import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrackVersion, 
  VersionType, 
  VersionUploadData, 
  VersionStats,
  VersionComparison,
  VersionCollaborator
} from '@/types';
import { useAuth } from '@/provider/AuthProvider';

export interface UseVersionsResult {
  versions: TrackVersion[];
  activeVersion: TrackVersion | null;
  stats: VersionStats[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadVersions: (trackId: string) => Promise<void>;
  createVersion: (trackId: string, data: VersionUploadData) => Promise<TrackVersion | null>;
  setActiveVersion: (trackId: string, versionId: string) => Promise<boolean>;
  deleteVersion: (versionId: string) => Promise<boolean>;
  toggleVersionVisibility: (versionId: string, isPublic: boolean) => Promise<boolean>;
  compareVersions: (versionId1: string, versionId2: string) => Promise<VersionComparison | null>;
  
  // Getters
  getVersionsByType: (type: VersionType) => TrackVersion[];
  getVersionHistory: () => TrackVersion[];
  getPublicVersions: () => TrackVersion[];
}

export const useVersions = (trackId?: string): UseVersionsResult => {
  const { user } = useAuth();
  const [versions, setVersions] = useState<TrackVersion[]>([]);
  const [activeVersion, setActiveVersionState] = useState<TrackVersion | null>(null);
  const [stats, setStats] = useState<VersionStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === LOAD VERSIONS ===
  const loadVersions = useCallback(async (targetTrackId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: versionsData, error: versionsError } = await supabase
        .from('track_versions')
        .select('*')
        .eq('track_id', targetTrackId)
        .order('created_at', { ascending: false });

      if (versionsError) throw versionsError;

      // Type cast version_type to VersionType enum
      const typedVersions = (versionsData || []).map(version => ({
        ...version,
        version_type: version.version_type as VersionType
      })) as TrackVersion[];

      setVersions(typedVersions);
      
      // Définir la version active
      const primary = typedVersions.find(v => v.is_primary) || typedVersions[0];
      setActiveVersionState(primary || null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      console.error('Error loading versions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // === CREATE NEW VERSION ===
  const createVersion = useCallback(async (
    targetTrackId: string, 
    data: VersionUploadData
  ): Promise<TrackVersion | null> => {
    if (!user) {
      setError('Utilisateur non connecté');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload du fichier audio
      const fileExt = data.file.name.split('.').pop();
      const fileName = `${Date.now()}_${data.version_type}.${fileExt}`;
      const filePath = `audio/versions/${fileName}`;

      const fileBlob = {
        uri: data.file.uri,
        type: data.file.type,
        name: data.file.name,
      };

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, fileBlob as any, {
          contentType: data.file.type
        });

      if (uploadError) throw uploadError;

      // 2. Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      // 3. Générer le numéro de version automatiquement
      const existingVersions = await supabase
        .from('track_versions')
        .select('version_name')
        .eq('track_id', targetTrackId)
        .order('created_at', { ascending: false });

      const versionCount = existingVersions.data?.length || 0;

      // 4. Créer l'enregistrement de version (nouveau schéma)
      const versionPayload = {
        track_id: targetTrackId,
        version_name: data.version_name,
        version_type: data.version_type,
        version_number: `v${versionCount + 1}.0`,
        file_url: publicUrl,
        duration: null, // TODO: Extraire la durée
        file_size: data.file.size,
        quality: '320kbps', // Valeur par défaut
        is_primary: versions.length === 0, // Première version = primaire
        is_public: data.is_public,
        version_notes: data.version_notes || 'Nouvelle version',
      };

      const { data: newVersion, error: versionError } = await supabase
        .from('track_versions')
        .insert(versionPayload)
        .select()
        .single();

      if (versionError) throw versionError;

      // Type cast the new version
      const typedNewVersion = {
        ...newVersion,
        version_type: newVersion.version_type as VersionType
      } as TrackVersion;

      // 5. Ajouter les collaborateurs spécifiques à cette version
      if (data.collaborators.length > 0) {
        const collaboratorsPayload = data.collaborators.map(userId => ({
          track_id: targetTrackId,
          version_id: typedNewVersion.id, // NOUVEAU: lié à la version spécifique
          user_id: userId,
          role: 'Artist', // Rôle par défaut
        }));

        await supabase
          .from('collaborations')
          .insert(collaboratorsPayload);
      }

      // 6. Mettre à jour l'état local
      setVersions(prev => [typedNewVersion, ...prev]);
      
      if (typedNewVersion.is_primary) {
        setActiveVersionState(typedNewVersion);
      }

      return typedNewVersion;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      console.error('Error creating version:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, versions.length]);

  // === SET ACTIVE VERSION ===
  const setActiveVersion = useCallback(async (
    targetTrackId: string, 
    versionId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Désactiver toutes les versions actuelles
      await supabase
        .from('track_versions')
        .update({ is_primary: false })
        .eq('track_id', targetTrackId);

      // 2. Activer la version sélectionnée
      const { error } = await supabase
        .from('track_versions')
        .update({ is_primary: true })
        .eq('id', versionId);

      if (error) throw error;

      // 3. Mettre à jour l'état local
      setVersions(prev => prev.map(v => ({
        ...v,
        is_primary: v.id === versionId
      })));

      const newActive = versions.find(v => v.id === versionId);
      setActiveVersionState(newActive || null);

      return true;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'activation');
      console.error('Error setting active version:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [versions]);

  // === DELETE VERSION ===
  const deleteVersion = useCallback(async (versionId: string): Promise<boolean> => {
    const versionToDelete = versions.find(v => v.id === versionId);
    
    if (!versionToDelete) {
      setError('Version non trouvée');
      return false;
    }

    if (versionToDelete.is_primary && versions.length > 1) {
      setError('Impossible de supprimer la version active. Activez une autre version d\'abord.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Supprimer le fichier du storage
      const filePathFromUrl = versionToDelete.file_url.split('/').pop();
      if (filePathFromUrl) {
        await supabase.storage
          .from('files')
          .remove([`audio/versions/${filePathFromUrl}`]);
      }

      // 2. Supprimer les collaborations liées à cette version spécifique
      await supabase
        .from('collaborations')
        .delete()
        .eq('version_id', versionId);

      // 3. Supprimer la version
      const { error } = await supabase
        .from('track_versions')
        .delete()
        .eq('id', versionId);

      if (error) throw error;

      // 4. Mettre à jour l'état local
      setVersions(prev => prev.filter(v => v.id !== versionId));
      
      if (versionToDelete.is_primary) {
        setActiveVersionState(null);
      }

      return true;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      console.error('Error deleting version:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [versions]);

  // === TOGGLE VERSION VISIBILITY ===
  const toggleVersionVisibility = useCallback(async (
    versionId: string, 
    isPublic: boolean
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('track_versions')
        .update({ is_public: isPublic })
        .eq('id', versionId);

      if (error) throw error;

      setVersions(prev => prev.map(v => 
        v.id === versionId ? { ...v, is_public: isPublic } : v
      ));

      return true;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      console.error('Error toggling visibility:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // === COMPARE VERSIONS ===
  const compareVersions = useCallback(async (
    versionId1: string, 
    versionId2: string
  ): Promise<VersionComparison | null> => {
    // TODO: Implémenter la comparaison détaillée
    setError('Comparaison non encore implémentée');
    return null;
  }, []);

  // === GETTERS ===
  const getVersionsByType = useCallback((type: VersionType) => {
    return versions.filter(v => v.version_type === type);
  }, [versions]);

  const getVersionHistory = useCallback(() => {
    return [...versions].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [versions]);

  const getPublicVersions = useCallback(() => {
    return versions.filter(v => v.is_public !== false);
  }, [versions]);

  // Auto-load versions si trackId fourni
  useEffect(() => {
    if (trackId) {
      loadVersions(trackId);
    }
  }, [trackId, loadVersions]);

  return {
    versions,
    activeVersion,
    stats,
    loading,
    error,
    
    loadVersions,
    createVersion,
    setActiveVersion,
    deleteVersion,
    toggleVersionVisibility,
    compareVersions,
    
    getVersionsByType,
    getVersionHistory,
    getPublicVersions,
  };
};

// === UTILITIES ===

function generateNextVersionNumber(latestVersion: string, versionType: VersionType): string {
  const versionRegex = /v(\d+)\.(\d+)/;
  const match = latestVersion.match(versionRegex);
  
  if (!match) return 'v1.0';
  
  let major = parseInt(match[1]);
  let minor = parseInt(match[2]);
  
  // Logique de versioning selon le type
  switch (versionType) {
    case VersionType.DEMO:
    case VersionType.ROUGH_MIX:
      minor++;
      break;
    case VersionType.FINAL_MIX:
    case VersionType.REMASTER:
      major++;
      minor = 0;
      break;
    case VersionType.REMIX:
    case VersionType.EXTENDED_MIX:
      minor++;
      break;
    default:
      minor++;
  }
  
  return `v${major}.${minor}`;
}