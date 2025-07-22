import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Text } from '~/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useHistoryStore } from '~/store/historyStore';
import { usePlayerStore } from '~/store/playerStore';
import { Track } from '~/types';
import Animated, { FadeInLeft } from 'react-native-reanimated';

interface TrackItemProps {
  track: Track;
  onPress: () => void;
  delay?: number;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, onPress, delay = 0 }) => {
  return (
    <Animated.View entering={FadeInLeft.delay(delay).springify()}>
      <Pressable
        onPress={onPress}
        className="bg-card p-3 rounded-xl border border-border mr-4 w-40 active:bg-muted/50"
      >
        {/* Artwork */}
        <View className="mb-3">
          <Image
            source={{ uri: track.artwork_url || 'https://via.placeholder.com/150' }}
            className="w-full h-24 rounded-lg bg-muted"
            contentFit="cover"
          />
          <View className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
            <Ionicons name="play" size={12} color="white" />
          </View>
        </View>

        {/* Info */}
        <Text className="text-foreground font-medium text-sm mb-1" numberOfLines={1}>
          {track.title}
        </Text>
        <Text className="text-muted-foreground text-xs" numberOfLines={1}>
          {track.user_profiles?.username}
        </Text>
        
        {/* Duration */}
        {track.duration && (
          <Text className="text-muted-foreground text-xs mt-1">
            {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

const LoadingSkeleton = () => (
  <View className="mt-6">
    <View className="px-6 mb-4">
      <Text className="text-lg font-semibold text-foreground">Récemment écouté</Text>
    </View>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingRight: 40,
      }}
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} className="bg-muted/30 w-40 h-32 rounded-xl mr-4 animate-pulse" />
      ))}
    </ScrollView>
  </View>
);

export const RecentlyPlayed: React.FC = () => {
  const { stats, isLoading } = useHistoryStore();
  const { playTrack } = usePlayerStore();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const recentTracks = stats.recentlyPlayed.slice(0, 10);

  if (recentTracks.length === 0) {
    return (
      <View className="mt-6 px-6">
        <Text className="text-lg font-semibold text-foreground mb-4">Récemment écouté</Text>
        <View className="bg-card p-6 rounded-xl border border-border items-center">
          <Ionicons name="musical-notes-outline" size={48} color="#6b7280" />
          <Text className="text-muted-foreground text-center mt-3">
            Aucune écoute récente
          </Text>
          <Text className="text-muted-foreground text-sm text-center mt-1">
            Écoutez de la musique pour voir vos morceaux récents ici
          </Text>
        </View>
      </View>
    );
  }

  const handleTrackPress = async (track: Track) => {
    try {
      await playTrack({
        id: track.id,
        title: track.title,
        artist: track.user_profiles?.username || 'Artiste inconnu',
        file_url: track.file_url,
        artwork: track.artwork_url,
      });
    } catch (error) {
      console.error('Erreur lors de la lecture:', error);
    }
  };

  return (
    <View className="mt-6">
      <View className="px-6 mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-foreground">Récemment écouté</Text>
        {recentTracks.length > 5 && (
          <Pressable className="flex-row items-center">
            <Text className="text-primary text-sm font-medium mr-1">Voir tout</Text>
            <Ionicons name="chevron-forward" size={16} color="#10b981" />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingRight: 40,
        }}
      >
        {recentTracks.map((track, index) => (
          <TrackItem
            key={`${track.id}-${index}`}
            track={track}
            onPress={() => handleTrackPress(track)}
            delay={index * 100}
          />
        ))}
      </ScrollView>
    </View>
  );
};