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
import { Text } from '~/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';
import { TrackVersion, VersionType, Track } from '~/types';
import { supabase } from '~/lib/supabase';
import { useAuth } from '~/provider/AuthProvider';
import { useVersions } from '~/hooks/useVersions';
import TrackPlayer from 'react-native-track-player';
import VersionItem from './VersionItem';
import AddVersionForm from './AddVersionForm';

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

export default function VersionManagerModal({
  visible,
  onClose,
  track,
  onVersionUpdated
}: VersionManagerModalProps) {
  const { isDarkColorScheme } = useColorScheme();
  const { user } = useAuth();
  const { createVersion, loading: uploadLoading, error: uploadError } = useVersions();
  const [versions, setVersions] = useState<VersionWithCollaborators[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Charger les versions avec collaborateurs
  const loadVersions = async () => {
    setLoading(true);
    try {
      const { data: versionsData, error } = await supabase
        .from('track_versions')
        .select(`
          *,
          collaborations(
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
            is_primary: version.is_primary || false,
            collaborators: version.collaborations?.user_profiles ? [version.collaborations] : []
          };
          acc.push(newVersion);
        }

        return acc;
      }, []) || [];

      // Trier pour mettre la version par défaut en premier, puis par date de création descendante
      const sortedVersions = versionsWithCollabs.sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      console.log('Versions with collaborators:', sortedVersions.map(v => ({
        id: v.id,
        name: v.version_name,
        is_primary: v.is_primary
      })));
      setVersions(sortedVersions);
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
    } else {
      // Arrêter la musique quand la modal se ferme
      handleCloseModal();
    }
  }, [visible, track.id]);

  // Fonction pour gérer la fermeture de la modal
  const handleCloseModal = async () => {
    if (currentlyPlaying) {
      try {
        await TrackPlayer.pause();
        setCurrentlyPlaying(null);
      } catch (error) {
        console.error('Error stopping playback:', error);
      }
    }
  };

  // Jouer une version spécifique
  const playVersion = async (version: VersionWithCollaborators) => {
    try {
      setCurrentlyPlaying(version.id);

      const trackData = {
        id: version.id,
        url: version.file_url,
        title: `${track.title} (${version.version_name})`,
        artist: track.artist_name || 'Artiste inconnu',
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

  // Gérer l'upload de nouvelle version
  const handleVersionUpload = async (uploadData: any) => {
    setIsUploading(true);
    try {
      const newVersion = await createVersion(track.id, uploadData);
      if (newVersion) {
        Alert.alert(
          'Succès !',
          `La version "${uploadData.version_name}" a été créée avec succès.`,
          [{
            text: 'OK',
            onPress: () => {
              onVersionUpdated?.();
              loadVersions();
            }
          }]
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Erreur', 'Échec de l\'upload. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={async () => {
        await handleCloseModal();
        onClose();
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: isDarkColorScheme ? '#0f172a' : '#ffffff'
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDarkColorScheme ? '#1e293b' : '#e2e8f0'
          }}
        >
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">
              Gérer les versions
            </Text>
            <Text className="text-sm text-muted-foreground">
              {track.title} • {track.artist_name}
            </Text>
          </View>
          <Pressable
            onPress={async () => {
              await handleCloseModal();
              onClose();
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isDarkColorScheme ? '#1e293b' : '#f1f5f9',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Ionicons
              name="close"
              size={18}
              color={isDarkColorScheme ? '#cbd5e1' : '#475569'}
            />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-muted-foreground">Chargement des versions...</Text>
            </View>
          ) : (
            <>
              {/* Add Version Form */}
              <AddVersionForm
                trackId={track.id}
                showForm={showAddVersion}
                onToggleForm={() => setShowAddVersion(!showAddVersion)}
                onVersionCreated={loadVersions}
                isUploading={isUploading}
                onUpload={handleVersionUpload}
              />

              {/* Versions List */}
              {versions.length > 0 ? (
                <View style={{ marginTop: 20 }}>
                  <Text className="text-lg font-semibold text-foreground mb-4">
                    Versions disponibles ({versions.length})
                  </Text>
                  {versions.map((version) => (
                    <VersionItem
                      key={version.id}
                      version={version}
                      isPlaying={currentlyPlaying === version.id}
                      onPlay={playVersion}
                      onSetAsDefault={setAsDefault}
                    />
                  ))}
                </View>
              ) : (
                <View className="flex-1 justify-center items-center py-20">
                  <Ionicons
                    name="musical-notes-outline"
                    size={48}
                    color={isDarkColorScheme ? '#475569' : '#94a3b8'}
                    style={{ marginBottom: 12 }}
                  />
                  <Text className="text-lg font-medium text-foreground mb-2">
                    Aucune version trouvée
                  </Text>
                  <Text className="text-sm text-muted-foreground text-center">
                    Ajoutez la première version de ce morceau
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}