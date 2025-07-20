import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TrackPlayer, { State, usePlaybackState, useProgress } from 'react-native-track-player';
import { useColorScheme } from '~/lib/useColorScheme';
import { supabase } from '~/lib/supabase';
import { TrackVersion } from '~/types';
import { VERSION_TYPE_COLORS, VERSION_TYPE_ICONS } from '~/constants/version-types';
import { formatDate } from '~/lib/utils';

interface VersionWithCollaborators extends TrackVersion {
  collaborators?: {
    user_profiles: {
      username: string;
      avatar_url?: string | null;
    };
  }[];
}

interface VersionItemProps {
  version: VersionWithCollaborators;
  isPlaying: boolean;
  onPlay: (version: VersionWithCollaborators) => void;
  onSetAsDefault: (version: VersionWithCollaborators) => void;
}

export default function VersionItem({ 
  version, 
  isPlaying, 
  onPlay, 
  onSetAsDefault 
}: VersionItemProps) {
  const { isDarkColorScheme } = useColorScheme();
  const playbackState = usePlaybackState();
  const progress = useProgress();
  
  const typeColor = VERSION_TYPE_COLORS[version.version_type] || '#6b7280';
  const typeIcon = VERSION_TYPE_ICONS[version.version_type] || 'disc-outline';
  const isPrimary = Boolean(version.is_primary);
  
  // État de lecture spécifique à cette version
  const isCurrentlyPlaying = isPlaying && playbackState.state === State.Playing;
  const isPaused = isPlaying && playbackState.state === State.Paused;

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        // Si cette version est en cours de lecture
        if (isCurrentlyPlaying) {
          await TrackPlayer.pause();
        } else if (isPaused) {
          await TrackPlayer.play();
        } else {
          // C'est une autre version qui joue, changer de track
          onPlay(version);
        }
      } else {
        // Aucune version de cette track ne joue, démarrer la lecture
        onPlay(version);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      Alert.alert('Erreur', 'Impossible de contrôler la lecture');
    }
  };

  const getPlayButtonIcon = () => {
    if (isCurrentlyPlaying) return "pause";
    if (isPaused && isPlaying) return "play";
    return "play";
  };

  const getPlayButtonColor = () => {
    if (isCurrentlyPlaying || isPaused) return '#ffffff';
    return isDarkColorScheme ? '#9ca3af' : '#6b7280';
  };

  const getPlayButtonBackground = () => {
    if (isCurrentlyPlaying || isPaused) return typeColor;
    return isDarkColorScheme ? '#374151' : '#f3f4f6';
  };

  // Calcul du pourcentage de progression pour cette version
  const progressPercentage = isPlaying && progress.duration > 0 
    ? (progress.position / progress.duration) * 100 
    : 0;

  return (
    <View
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
            {/* Bouton lecture/pause */}
            <Pressable
              onPress={handlePlayPause}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: getPlayButtonBackground(),
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Ionicons
                name={getPlayButtonIcon()}
                size={16}
                color={getPlayButtonColor()}
              />
            </Pressable>

            {/* Bouton définir par défaut */}
            {!isPrimary && (
              <Pressable
                onPress={() => onSetAsDefault(version)}
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

        {/* Barre de progression */}
        {isPlaying && (
          <View className="mb-3">
            <View
              style={{
                height: 3,
                backgroundColor: isDarkColorScheme ? '#374151' : '#e5e7eb',
                borderRadius: 1.5,
                overflow: 'hidden'
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${progressPercentage}%`,
                  backgroundColor: typeColor,
                  borderRadius: 1.5
                }}
              />
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-xs text-muted-foreground">
                {Math.floor(progress.position / 60)}:{String(Math.floor(progress.position % 60)).padStart(2, '0')}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {Math.floor(progress.duration / 60)}:{String(Math.floor(progress.duration % 60)).padStart(2, '0')}
              </Text>
            </View>
          </View>
        )}

        {/* Notes de version */}
        {version.version_notes && (
          <View className="mb-3">
            <Text className="text-sm text-muted-foreground">
              {version.version_notes}
            </Text>
          </View>
        )}

        {/* Collaborateurs */}
        {version.collaborators && version.collaborators.length > 0 && (
          <View>
            <Text className="text-xs font-medium text-muted-foreground mb-2">
              Collaborateurs
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {version.collaborators.map((collab: any, index: number) => (
                <View
                  key={index}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: `${typeColor}15`,
                    borderWidth: 1,
                    borderColor: `${typeColor}30`
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: typeColor }}
                  >
                    @{collab.user_profiles?.username || 'Inconnu'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}