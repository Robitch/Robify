import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useFavoritesStore } from '~/store/favoritesStore';
import { useOfflineStore } from '~/store/offlineStore';
import { useHistoryStore } from '~/store/historyStore';
import { router } from 'expo-router';
import Animated, { FadeInRight } from 'react-native-reanimated';

interface LibrarySectionsProps {
  isLoading: boolean;
}

interface SectionItemProps {
  title: string;
  description: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
  delay?: number;
}

const SectionItem: React.FC<SectionItemProps> = ({
  title,
  description,
  count,
  icon,
  color,
  route,
  delay = 0,
}) => {
  const handlePress = () => {
    router.push(route as any);
  };

  return (
    <Animated.View entering={FadeInRight.delay(delay).springify()}>
      <Pressable
        onPress={handlePress}
        className="bg-card p-4 rounded-xl border border-border mb-4 active:bg-muted/50"
      >
        <View className="flex-row items-center">
          {/* Icône */}
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: `${color}20` }}
          >
            <Ionicons name={icon} size={24} color={color} />
          </View>

          {/* Contenu principal */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-foreground font-semibold text-base">
                {title}
              </Text>
              <View className="flex-row items-center">
                {count > 0 && (
                  <View 
                    className="px-2 py-1 rounded-full mr-2"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Text 
                      className="text-xs font-medium"
                      style={{ color }}
                    >
                      {count}
                    </Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </View>
            </View>
            <Text className="text-muted-foreground text-sm">
              {description}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const LoadingSkeleton = () => (
  <View className="px-6 mt-6">
    <Text className="text-lg font-semibold text-foreground mb-4">Mes Sections</Text>
    {Array.from({ length: 4 }).map((_, index) => (
      <View key={index} className="bg-muted/30 h-16 rounded-xl mb-4 animate-pulse" />
    ))}
  </View>
);

export const LibrarySections: React.FC<LibrarySectionsProps> = ({ isLoading }) => {
  const { favoriteTracks } = useFavoritesStore();
  const { offlineTracks } = useOfflineStore();
  const { listeningHistory, stats } = useHistoryStore();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const sections = [
    {
      title: 'Favoris',
      description: 'Vos morceaux aimés et préférés',
      count: favoriteTracks.length,
      icon: 'heart' as const,
      color: '#ef4444',
      route: '/library/favorites',
    },
    {
      title: 'Téléchargements',
      description: 'Musique disponible hors ligne',
      count: offlineTracks.length,
      icon: 'cloud-download' as const,
      color: '#06b6d4',
      route: '/library/offline',
    },
    {
      title: 'Historique',
      description: 'Vos écoutes récentes et statistiques',
      count: listeningHistory.length,
      icon: 'time' as const,
      color: '#8b5cf6',
      route: '/library/history',
    },
    {
      title: 'Statistiques',
      description: 'Analyse détaillée de votre écoute',
      count: stats.totalTracks,
      icon: 'analytics' as const,
      color: '#f59e0b',
      route: '/library/stats',
    },
  ];

  return (
    <View className="px-6 mt-6">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-foreground">Mes Sections</Text>
      </View>

      {sections.map((section, index) => (
        <SectionItem
          key={section.title}
          title={section.title}
          description={section.description}
          count={section.count}
          icon={section.icon}
          color={section.color}
          route={section.route}
          delay={index * 100}
        />
      ))}
    </View>
  );
};