import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { FavoriteTrack, ReactionType } from '~/types/library';
import Animated, { FadeInRight } from 'react-native-reanimated';

interface FavoriteTrackItemProps {
  track: FavoriteTrack;
  onPress: () => void;
  onToggleFavorite: () => void;
  delay?: number;
}

const getReactionIcon = (type: ReactionType): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'like':
      return 'thumbs-up';
    case 'fire':
      return 'flame';
    case 'heart':
      return 'heart';
    case 'mind_blown':
      return 'flash';
    default:
      return 'heart';
  }
};

const getReactionColor = (type: ReactionType): string => {
  switch (type) {
    case 'like':
      return '#10b981';
    case 'fire':
      return '#f97316';
    case 'heart':
      return '#ef4444';
    case 'mind_blown':
      return '#8b5cf6';
    default:
      return '#ef4444';
  }
};

export const FavoriteTrackItem: React.FC<FavoriteTrackItemProps> = ({
  track,
  onPress,
  onToggleFavorite,
  delay = 0,
}) => {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <Animated.View entering={FadeInRight.delay(delay).springify()}>
      <Pressable
        onPress={onPress}
        className="bg-card p-4 rounded-xl border border-border mb-3 active:bg-muted/50"
      >
        <View className="flex-row items-center">
          {/* Artwork */}
          <View className="relative mr-4">
            <Image
              source={{ uri: track.artwork_url || 'https://via.placeholder.com/150' }}
              className="w-14 h-14 rounded-lg bg-muted"
              contentFit="cover"
            />
            <View className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
              <Ionicons
                name={getReactionIcon(track.reaction_type)}
                size={16}
                color={getReactionColor(track.reaction_type)}
              />
            </View>
          </View>

          {/* Contenu principal */}
          <View className="flex-1">
            <View className="flex-row items-start justify-between mb-1">
              <Text className="text-foreground font-semibold text-base flex-1 mr-2" numberOfLines={1}>
                {track.title}
              </Text>
              {/* <Text className="text-muted-foreground text-xs">
                {formatDate(track.favorited_at)}
              </Text> */}
            </View>

            <Text className="text-muted-foreground text-sm mb-2" numberOfLines={1}>
              {track.user_profiles?.username || 'Artiste inconnu'}
            </Text>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                {track.genre && (
                  <View className="bg-muted px-2 py-1 rounded mr-2">
                    <Text className="text-muted-foreground text-xs">
                      {Array.isArray(track.genre) ? track.genre[0] : String(track.genre)}
                    </Text>
                  </View>
                )}
                {track.duration && (
                  <Text className="text-muted-foreground text-xs">
                    {formatDuration(Number(track.duration))}
                  </Text>
                )}
              </View>

              {/* Actions */}
              <View className="flex-row items-center">
                <Pressable
                  onPress={onToggleFavorite}
                  className="w-8 h-8 items-center justify-center rounded-full bg-muted/50 mr-2"
                >
                  <Ionicons
                    name={getReactionIcon(track.reaction_type)}
                    size={16}
                    color={getReactionColor(track.reaction_type)}
                  />
                </Pressable>

                <Pressable className="w-8 h-8 items-center justify-center rounded-full bg-muted/50">
                  <Ionicons name="ellipsis-horizontal" size={16} color="#6b7280" />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};