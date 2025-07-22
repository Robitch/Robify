import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Text } from '~/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useFavoritesStore } from '~/store/favoritesStore';
import { useOfflineStore } from '~/store/offlineStore';
import { useLibraryStore } from '~/store/libraryStore';
import { useHistoryStore } from '~/store/historyStore';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface QuickActionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  badge?: number;
  delay?: number;
}

const QuickAction: React.FC<QuickActionProps> = ({
  title,
  icon,
  color,
  onPress,
  badge,
  delay = 0,
}) => {
  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()}>
      <Pressable
        onPress={onPress}
        className="bg-card p-3 rounded-xl border border-border mr-4 min-w-[100px] items-center active:bg-muted/50"
      >
        <View className="relative mb-2">
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Ionicons name={icon} size={24} color={color} />
          </View>
          {badge !== undefined && badge > 0 && (
            <View className="absolute -top-1 -right-1 bg-primary rounded-full min-w-[18px] h-[18px] items-center justify-center">
              <Text className="text-primary-foreground text-xs font-bold">
                {badge > 99 ? '99+' : badge}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-foreground text-sm font-medium text-center" numberOfLines={1}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export const QuickActions: React.FC = () => {
  const { refreshLibrary } = useLibraryStore();
  const { refreshFavorites, favoriteTracks } = useFavoritesStore();
  const { processDownloadQueue, downloadQueue, activeDownloads } = useOfflineStore();

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        refreshLibrary(),
        refreshFavorites(),
        useOfflineStore.getState().refreshOfflineStore(),
        useHistoryStore.getState().refreshHistory(),
      ]);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    }
  };

  const handleProcessDownloads = async () => {
    if (downloadQueue.length > 0) {
      await processDownloadQueue();
    }
  };

  const quickActions = [
    {
      title: 'Actualiser',
      icon: 'refresh' as const,
      color: '#10b981',
      onPress: handleRefreshAll,
    },
    {
      title: 'Favoris',
      icon: 'heart' as const,
      color: '#ef4444',
      onPress: () => router.push('/library/favorites' as any),
      badge: favoriteTracks.length,
    },
    {
      title: 'Télécharger',
      icon: 'download' as const,
      color: '#06b6d4',
      onPress: handleProcessDownloads,
      badge: downloadQueue.length + activeDownloads.size,
    },
    {
      title: 'Rechercher',
      icon: 'search' as const,
      color: '#8b5cf6',
      onPress: () => router.push('/library/search' as any),
    },
    {
      title: 'Statistiques',
      icon: 'analytics' as const,
      color: '#f59e0b',
      onPress: () => router.push('/library/stats' as any),
    },
  ];

  return (
    <View className="mt-6">
      <View className="px-6 mb-4">
        <Text className="text-lg font-semibold text-foreground">Actions rapides</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingRight: 40,
        }}
      >
        {quickActions.map((action, index) => (
          <QuickAction
            key={action.title}
            title={action.title}
            icon={action.icon}
            color={action.color}
            onPress={action.onPress}
            badge={action.badge}
            delay={index * 100}
          />
        ))}
      </ScrollView>
    </View>
  );
};