import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useOfflineStore } from '@/store/offlineStore';
import { useLibraryStore } from '@/store/libraryStore';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface QuickActionCard {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
  color: string;
  route: string;
}

export default function QuickAccessGrid() {
  const { favoriteTracks } = useFavoritesStore();
  const { offlineTracks, totalOfflineSize } = useOfflineStore();
  const { stats } = useLibraryStore();

  // Formater la taille des téléchargements
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Formater le temps d'écoute
  const formatListeningTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const quickActions: QuickActionCard[] = [
    {
      id: 'favorites',
      title: 'Favoris',
      subtitle: `${favoriteTracks.length} morceaux`,
      icon: 'heart',
      count: favoriteTracks.length,
      color: '#ef4444',
      route: '/library/favorites'
    },
    {
      id: 'downloads',
      title: 'Téléchargements',
      subtitle: formatFileSize(totalOfflineSize),
      icon: 'download',
      count: offlineTracks.length,
      color: '#10b981',
      route: '/library/downloads'
    },
    {
      id: 'history',
      title: 'Historique',
      subtitle: formatListeningTime(stats.totalListeningTime),
      icon: 'time',
      count: stats.recentlyPlayed.length,
      color: '#3b82f6',
      route: '/library/history'
    },
    {
      id: 'recents',
      title: 'Récemment joués',
      subtitle: `${stats.recentlyPlayed.length} derniers`,
      icon: 'play-circle',
      count: stats.recentlyPlayed.length,
      color: '#8b5cf6',
      route: '/library/recently-played'
    }
  ];

  const handleCardPress = (action: QuickActionCard) => {
    router.push(action.route as any);
  };

  return (
    <View className="px-6 mb-6">
      <Text className="text-xl font-bold text-foreground mb-4">
        Accès rapide
      </Text>
      
      <View className="flex-row flex-wrap justify-between">
        {quickActions.map((action, index) => (
          <Animated.View
            key={action.id}
            entering={FadeInDown.delay(index * 100).springify()}
            className="w-[48%] mb-4"
          >
            <Pressable
              onPress={() => handleCardPress(action)}
              className="bg-card rounded-2xl p-4 border border-border active:bg-muted/50"
            >
              {/* Header avec icône et compteur */}
              <View className="flex-row items-center justify-between mb-3">
                <View
                  style={{ backgroundColor: action.color + '20' }}
                  className="w-12 h-12 rounded-xl items-center justify-center"
                >
                  <Ionicons
                    name={action.icon}
                    size={24}
                    color={action.color}
                  />
                </View>
                
                {action.count > 0 && (
                  <View
                    style={{ backgroundColor: action.color }}
                    className="px-2 py-1 rounded-full min-w-[24px] items-center"
                  >
                    <Text className="text-white text-xs font-bold">
                      {action.count > 99 ? '99+' : action.count}
                    </Text>
                  </View>
                )}
              </View>

              {/* Contenu */}
              <Text className="text-foreground font-semibold text-base mb-1">
                {action.title}
              </Text>
              <Text className="text-muted-foreground text-sm">
                {action.subtitle}
              </Text>

              {/* Indicateur de progression pour les téléchargements */}
              {action.id === 'downloads' && totalOfflineSize > 0 && (
                <View className="mt-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs text-muted-foreground">Espace utilisé</Text>
                    <Text className="text-xs text-muted-foreground">
                      {Math.round((totalOfflineSize / (1024 * 1024 * 1024)) * 100)}% de 1GB
                    </Text>
                  </View>
                  <View className="h-1 bg-muted rounded-full overflow-hidden">
                    <View
                      style={{
                        width: `${Math.min((totalOfflineSize / (1024 * 1024 * 1024)) * 100, 100)}%`,
                        backgroundColor: action.color
                      }}
                      className="h-full rounded-full"
                    />
                  </View>
                </View>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}