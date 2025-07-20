import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  ScrollView, 
  Pressable, 
  Alert,
  Animated,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';
import { cn } from '~/lib/utils';
import { TrackVersion, VersionType, Track } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/provider/AuthProvider';
import TrackPlayer from 'react-native-track-player';

interface VersionManagerModalProps {
  visible: boolean;
  onClose: () => void;
  track: Track;
  onVersionUpdated?: () => void;
}

interface VersionWithCollaborators extends TrackVersion {
  collaborators?: {
    user_profiles: {
      username: string;
      avatar_url?: string | null;
    };
  }[];
}

const VERSION_TYPE_COLORS = {
  [VersionType.DEMO]: '#f59e0b',
  [VersionType.ROUGH_MIX]: '#8b5cf6',
  [VersionType.FINAL_MIX]: '#10b981',
  [VersionType.REMASTER]: '#06b6d4',
  [VersionType.REMIX]: '#ec4899',
  [VersionType.RADIO_EDIT]: '#f97316',
  [VersionType.EXTENDED_MIX]: '#3b82f6',
  [VersionType.LIVE]: '#ef4444',
  [VersionType.ACOUSTIC]: '#84cc16',
  [VersionType.INSTRUMENTAL]: '#6366f1',
};

const VERSION_TYPE_ICONS = {
  [VersionType.DEMO]: 'create-outline',
  [VersionType.ROUGH_MIX]: 'build-outline',
  [VersionType.FINAL_MIX]: 'checkmark-circle-outline',
  [VersionType.REMASTER]: 'diamond-outline',
  [VersionType.REMIX]: 'shuffle-outline',
  [VersionType.RADIO_EDIT]: 'radio-outline',
  [VersionType.EXTENDED_MIX]: 'time-outline',
  [VersionType.LIVE]: 'mic-outline',
  [VersionType.ACOUSTIC]: 'musical-note-outline',
  [VersionType.INSTRUMENTAL]: 'piano-outline',
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '--';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function VersionManagerModal({
  visible,
  onClose,
  track,
  onVersionUpdated
}: VersionManagerModalProps) {
  const { isDarkColorScheme } = useColorScheme();
  const { user } = useAuth();
  const [versions, setVersions] = useState<VersionWithCollaborators[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  // Charger les versions avec collaborateurs
  const loadVersions = async () => {
    setLoading(true);
    try {
      const { data: versionsData, error } = await supabase
        .from('track_versions')
        .select(`
          *,
          collaborations!inner(
            user_profiles(
              username,
              avatar_url
            )
          )
        `)
        .eq('track_id', track.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Grouper les collaborateurs par version
      const versionsWithCollabs = versionsData?.reduce((acc: VersionWithCollaborators[], version: any) => {
        const existingVersion = acc.find(v => v.id === version.id);
        
        if (existingVersion) {
          // Ajouter le collaborateur à la version existante
          if (version.collaborations?.user_profiles) {
            existingVersion.collaborators = existingVersion.collaborators || [];
            existingVersion.collaborators.push(version.collaborations);
          }
        } else {
          // Créer une nouvelle version
          const newVersion: VersionWithCollaborators = {
            ...version,
            version_type: version.version_type as VersionType,
            collaborators: version.collaborations?.user_profiles ? [version.collaborations] : []
          };
          acc.push(newVersion);
        }
        
        return acc;
      }, []) || [];

      setVersions(versionsWithCollabs);
    } catch (error) {
      console.error('Error loading versions:', error);
      Alert.alert('Erreur', 'Impossible de charger les versions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadVersions();
    }
  }, [visible, track.id]);

  // Jouer une version spécifique
  const playVersion = async (version: VersionWithCollaborators) => {
    try {
      setCurrentlyPlaying(version.id);
      
      const trackData = {
        id: `${track.id}_${version.id}`,
        url: version.file_url,
        title: `${track.title} (${version.version_name})`,
        artist: track.user_profiles?.username || 'Artiste inconnu',
        artwork: track.artwork_url || undefined,
        duration: version.duration || 0,
      };

      await TrackPlayer.reset();
      await TrackPlayer.add(trackData);
      await TrackPlayer.play();
      
    } catch (error) {
      console.error('Error playing version:', error);
      Alert.alert('Erreur', 'Impossible de lire cette version');
      setCurrentlyPlaying(null);
    }
  };

  // Définir comme version par défaut
  const setAsDefault = async (version: VersionWithCollaborators) => {
    try {
      // Désactiver toutes les versions comme primaires
      await supabase
        .from('track_versions')
        .update({ is_primary: false })
        .eq('track_id', track.id);

      // Activer la version sélectionnée comme primaire
      const { error } = await supabase
        .from('track_versions')
        .update({ is_primary: true })
        .eq('id', version.id);

      if (error) throw error;

      // Mettre à jour l'état local
      setVersions(prev => prev.map(v => ({
        ...v,
        is_primary: v.id === version.id
      })));

      onVersionUpdated?.();
      Alert.alert('Succès', `"${version.version_name}" est maintenant la version par défaut`);
      
    } catch (error) {
      console.error('Error setting default version:', error);
      Alert.alert('Erreur', 'Impossible de définir cette version par défaut');
    }
  };

  const renderVersionItem = (version: VersionWithCollaborators) => {
    const typeColor = VERSION_TYPE_COLORS[version.version_type] || '#6b7280';
    const typeIcon = VERSION_TYPE_ICONS[version.version_type] || 'disc-outline';
    const isPlaying = currentlyPlaying === version.id;
    const isPrimary = version.is_primary;

    return (
      <View
        key={version.id}
        style={{
          marginBottom: 16,
          borderRadius: 12,
          borderWidth: isPrimary ? 2 : 1,
          borderColor: isPrimary ? typeColor : (isDarkColorScheme ? '#374151' : '#e5e7eb'),
          backgroundColor: isDarkColorScheme ? '#1f2937' : '#ffffff',
          overflow: 'hidden'
        }}
      >
        {/* Header avec badge "par défaut" */}
        {isPrimary && (
          <View
            style={{
              backgroundColor: typeColor,
              paddingHorizontal: 12,
              paddingVertical: 4,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Ionicons name="star" size={14} color="#ffffff" style={{ marginRight: 4 }} />
            <Text className="text-white text-xs font-medium">VERSION PAR DÉFAUT</Text>
          </View>
        )}

        <View className="p-4">
          {/* En-tête de version */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: `${typeColor}20`,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}
              >
                <Ionicons
                  name={typeIcon as any}
                  size={20}
                  color={typeColor}
                />
              </View>
              
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  {version.version_name}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {version.version_number} • {formatDate(version.created_at)}
                </Text>
              </View>
            </View>

            {/* Boutons d'action */}
            <View className="flex-row items-center gap-2">
              {/* Bouton lecture */}
              <Pressable
                onPress={() => playVersion(version)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isPlaying ? typeColor : (isDarkColorScheme ? '#374151' : '#f3f4f6'),
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={16}
                  color={isPlaying ? '#ffffff' : (isDarkColorScheme ? '#9ca3af' : '#6b7280')}
                />
              </Pressable>

              {/* Bouton définir par défaut */}
              {!isPrimary && (
                <Pressable
                  onPress={() => setAsDefault(version)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: isDarkColorScheme ? '#374151' : '#f3f4f6'
                  }}
                >
                  <Text className="text-xs font-medium text-foreground">
                    Par défaut
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Informations détaillées */}
          <View className="space-y-2">
            {version.version_notes && (
              <Text className="text-sm text-muted-foreground">
                {version.version_notes}
              </Text>
            )}

            {/* Métadonnées */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-4">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={14} color={isDarkColorScheme ? '#9ca3af' : '#6b7280'} />
                  <Text className="text-xs text-muted-foreground ml-1">
                    {formatDuration(version.duration)}
                  </Text>
                </View>
                
                <View className="flex-row items-center">
                  <Ionicons name="download-outline" size={14} color={isDarkColorScheme ? '#9ca3af' : '#6b7280'} />
                  <Text className="text-xs text-muted-foreground ml-1">
                    {formatFileSize(version.file_size)}
                  </Text>
                </View>

                {version.quality && (
                  <View className="flex-row items-center">
                    <Ionicons name="musical-notes-outline" size={14} color={isDarkColorScheme ? '#9ca3af' : '#6b7280'} />
                    <Text className="text-xs text-muted-foreground ml-1">
                      {version.quality}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center">
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: version.is_public ? '#10b981' : '#6b7280',
                    marginRight: 4
                  }}
                />
                <Text className="text-xs text-muted-foreground">
                  {version.is_public ? 'Public' : 'Privé'}
                </Text>
              </View>
            </View>

            {/* Collaborateurs */}
            {version.collaborators && version.collaborators.length > 0 && (
              <View className="mt-2">
                <Text className="text-xs font-medium text-muted-foreground mb-1">
                  Collaborateurs :
                </Text>
                <View className="flex-row flex-wrap gap-1">
                  {version.collaborators.map((collab, index) => (
                    <View
                      key={index}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        backgroundColor: isDarkColorScheme ? '#374151' : '#f3f4f6'
                      }}
                    >
                      <Text className="text-xs text-foreground">
                        @{collab.user_profiles.username}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">
              Gestion des versions
            </Text>
            <Text className="text-sm text-muted-foreground">
              {track.title}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="p-2 -mr-2"
          >
            <Ionicons 
              name="close" 
              size={24} 
              color={isDarkColorScheme ? '#9ca3af' : '#6b7280'} 
            />
          </Pressable>
        </View>

        <ScrollView 
          className="flex-1 p-4"
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View className="flex-1 items-center justify-center py-8">
              <Text className="text-muted-foreground">
                Chargement des versions...
              </Text>
            </View>
          ) : versions.length === 0 ? (
            <View className="flex-1 items-center justify-center py-8">
              <Ionicons 
                name="musical-notes-outline" 
                size={48} 
                color={isDarkColorScheme ? '#374151' : '#d1d5db'} 
              />
              <Text className="text-muted-foreground mt-4 text-center">
                Aucune version disponible pour ce morceau
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-sm font-medium text-muted-foreground mb-4">
                {versions.length} version{versions.length > 1 ? 's' : ''} disponible{versions.length > 1 ? 's' : ''}
              </Text>
              
              {versions.map(renderVersionItem)}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}