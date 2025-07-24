import React, { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFavoritesStore } from '~/store/favoritesStore';
import { usePlayerStore } from '~/store/playerStore';
import MusicItem from '~/components/MusicItem';
import { ReactionType, FavoriteTrack } from '~/types/library';
import { UI_CONSTANTS } from '~/constants/player';
import Animated, { FadeInDown } from 'react-native-reanimated';

type FilterType = 'all' | ReactionType;

export default function FavoritesScreen() {
  const {
    favoriteTracks,
    favoritesByType,
    isLoading,
    error,
    refreshFavorites,
    toggleFavorite,
  } = useFavoritesStore();

  const { playTrack } = usePlayerStore();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [filteredTracks, setFilteredTracks] = useState<FavoriteTrack[]>([]);

  useEffect(() => {
    refreshFavorites();
  }, []);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredTracks(favoriteTracks);
    } else {
      setFilteredTracks(favoritesByType[activeFilter] || []);
    }
  }, [activeFilter, favoriteTracks, favoritesByType]);

  const handleTrackPress = async (track: FavoriteTrack) => {
    try {
      await playTrack({
        id: track.id,
        title: track.title,
        artist: track.user_profiles?.username || 'Artiste inconnu',
        file_url: track.file_url,
        artwork: track.artwork_url ?? undefined,
      });
    } catch (error) {
      console.error('Erreur lors de la lecture:', error);
    }
  };

  const handleToggleFavorite = async (trackId: string, currentReaction: ReactionType) => {
    try {
      await toggleFavorite(trackId, currentReaction);
    } catch (error) {
      console.error('Erreur lors de la modification du favori:', error);
    }
  };

  const filters: { key: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
    { key: 'all', label: 'Tous', icon: 'heart-outline', color: '#6b7280' },
    { key: 'like', label: 'J\'aime', icon: 'thumbs-up', color: '#10b981' },
    { key: 'fire', label: 'Feu', icon: 'flame', color: '#f97316' },
    { key: 'heart', label: 'Cœur', icon: 'heart', color: '#ef4444' },
    { key: 'mind_blown', label: 'Explosé', icon: 'flash', color: '#8b5cf6' },
  ];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-12 pb-4 px-6 border-b border-border">
        <View className="flex-row items-center mb-4">
          <Pressable
            onPress={() => router.back()}
            className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-muted/50"
          >
            <Ionicons name="chevron-back" size={24} color="#6b7280" />
          </Pressable>
          <Text className="text-2xl font-bold text-foreground flex-1">Favoris</Text>
        </View>

        {/* Statistiques rapides */}
        <View className="flex-row items-center justify-between">
          <Text className="text-muted-foreground">
            {String(filteredTracks.length)} morceau{filteredTracks.length > 1 ? 'x' : ''}
          </Text>
          <Pressable className="flex-row items-center">
            <Ionicons name="shuffle" size={20} color="#10b981" />
            <Text className="text-primary ml-2 font-medium">Lecture aléatoire</Text>
          </Pressable>
        </View>
      </View>

      {/* Filtres */}
      <View className="py-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingRight: 40,
          }}
        >
          {filters.map((filter, index) => (
            <Animated.View
              key={filter.key}
              entering={FadeInDown.delay(index * 100).springify()}
            >
              <Pressable
                onPress={() => setActiveFilter(filter.key)}
                className={`flex-row items-center px-4 py-2 rounded-full mr-3 border ${activeFilter === filter.key
                  ? 'bg-primary border-primary'
                  : 'bg-card border-border'
                  }`}
              >
                <Ionicons
                  name={filter.icon}
                  size={16}
                  color={activeFilter === filter.key ? '#ffffff' : filter.color}
                />
                <Text
                  className={`ml-2 text-sm font-medium ${activeFilter === filter.key ? 'text-primary-foreground' : 'text-foreground'
                    }`}
                >
                  {filter.label}
                </Text>
                {filter.key !== 'all' && (
                  <Text
                    className={`ml-2 text-xs ${activeFilter === filter.key ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}
                  >
                    {String(favoritesByType[filter.key]?.length || 0)}
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* Message d'erreur */}
      {error && (
        <View className="mx-6 mb-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <Text className="text-destructive font-medium">Erreur</Text>
          <Text className="text-destructive/80 text-sm mt-1">{error}</Text>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: UI_CONSTANTS.CONTENT_PADDING_BOTTOM,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshFavorites}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Liste des favoris */}
        {filteredTracks.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 py-12">
            <Ionicons name="heart-outline" size={64} color="#6b7280" />
            <Text className="text-muted-foreground text-lg font-medium mt-4 text-center">
              {activeFilter === 'all' ? 'Aucun favori' : `Aucun favori de type "${filters.find(f => f.key === activeFilter)?.label}"`}
            </Text>
            <Text className="text-muted-foreground text-sm text-center mt-2">
              {activeFilter === 'all'
                ? 'Ajoutez des morceaux à vos favoris pour les retrouver ici'
                : 'Changez de filtre ou ajoutez des morceaux de ce type'
              }
            </Text>
          </View>
        ) : (
          <View className="px-6">
            {filteredTracks.map((track, index) => (
              <View key={track.id} className="mb-3">
                <MusicItem
                  item={track}
                  onRemoveMusic={() => void 0}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}