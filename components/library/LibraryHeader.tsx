import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuth } from '@/provider/AuthProvider';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useOfflineStore } from '@/store/offlineStore';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function LibraryHeader() {
  const { user, profile } = useAuth();
  const { favoriteTracks } = useFavoritesStore();
  const { offlineTracks } = useOfflineStore();

  // Calculer des stats rapides
  const totalFavorites = favoriteTracks.length;
  const totalDownloads = offlineTracks.length;

  return (
    <Animated.View 
      entering={FadeInDown.springify()}
      className="px-6 pt-4 pb-6"
    >
      {/* Header principal */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-1">
          <Text className="text-3xl font-bold text-foreground mb-1">
            Ma Bibliothèque
          </Text>
          <Text className="text-muted-foreground">
            Bonjour {profile?.username || user?.email?.split('@')[0] || 'Musicien'} 👋
          </Text>
        </View>

        {/* Avatar */}
        <Pressable className="w-12 h-12 rounded-full overflow-hidden bg-muted">
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              className="w-full h-full"
              contentFit="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons 
                name="person" 
                size={24} 
                className="text-muted-foreground" 
              />
            </View>
          )}
        </Pressable>
      </View>

      {/* Stats rapides */}
      <View className="flex-row justify-between bg-card p-4 rounded-2xl border border-border">
        <View className="items-center flex-1">
          <View className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg items-center justify-center mb-2">
            <Ionicons name="heart" size={16} color="#ef4444" />
          </View>
          <Text className="text-foreground font-bold text-lg">
            {totalFavorites}
          </Text>
          <Text className="text-muted-foreground text-xs">
            Favoris
          </Text>
        </View>

        <View className="w-px bg-border mx-4" />

        <View className="items-center flex-1">
          <View className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg items-center justify-center mb-2">
            <Ionicons name="download" size={16} color="#10b981" />
          </View>
          <Text className="text-foreground font-bold text-lg">
            {totalDownloads}
          </Text>
          <Text className="text-muted-foreground text-xs">
            Offline
          </Text>
        </View>

        <View className="w-px bg-border mx-4" />

        <View className="items-center flex-1">
          <View className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg items-center justify-center mb-2">
            <Ionicons name="musical-notes" size={16} color="#3b82f6" />
          </View>
          <Text className="text-foreground font-bold text-lg">
            {totalFavorites + totalDownloads}
          </Text>
          <Text className="text-muted-foreground text-xs">
            Total
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}