import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { LibraryStats as LibraryStatsType } from '~/types/library';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface LibraryStatsProps {
  stats: LibraryStatsType;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  onPress?: () => void;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = '#10b981',
  onPress,
  delay = 0,
}) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <Pressable
        onPress={onPress}
        className={`bg-card p-4 rounded-xl border border-border ${
          onPress ? 'active:bg-muted/50' : ''
        }`}
        disabled={!onPress}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text className="text-foreground font-medium ml-3 flex-1" numberOfLines={1}>
              {title}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-2xl font-bold text-foreground mb-1">
            {typeof value === 'number' && value >= 1000
              ? `${(value / 1000).toFixed(1)}k`
              : value}
          </Text>
          {subtitle && (
            <Text className="text-muted-foreground text-sm" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const LoadingSkeleton = () => (
  <View className="px-6 mt-6">
    <Text className="text-lg font-semibold text-foreground mb-4">Statistiques</Text>
    <View className="flex-row flex-wrap justify-between">
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} className="w-[48%] mb-4">
          <View className="bg-muted/30 h-24 rounded-xl animate-pulse" />
        </View>
      ))}
    </View>
  </View>
);

export const LibraryStats: React.FC<LibraryStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  const statsData = [
    {
      title: 'Total Morceaux',
      value: stats.totalTracks,
      subtitle: `${stats.totalArtists} artistes`,
      icon: 'musical-notes' as const,
      color: '#10b981',
    },
    {
      title: 'Favoris',
      value: stats.totalFavorites,
      subtitle: 'Morceaux aimés',
      icon: 'heart' as const,
      color: '#ef4444',
    },
    {
      title: 'Temps d\'écoute',
      value: formatDuration(stats.totalListeningTime),
      subtitle: 'Total écouté',
      icon: 'time' as const,
      color: '#8b5cf6',
    },
    {
      title: 'Hors ligne',
      value: stats.totalOfflineDownloads,
      subtitle: 'Téléchargés',
      icon: 'cloud-download' as const,
      color: '#06b6d4',
    },
  ];

  return (
    <View className="px-6 mt-6">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-foreground">Statistiques</Text>
        <Pressable className="flex-row items-center">
          <Text className="text-primary text-sm font-medium mr-1">Voir plus</Text>
          <Ionicons name="chevron-forward" size={16} color="#10b981" />
        </Pressable>
      </View>

      <View className="flex-row flex-wrap justify-between">
        {statsData.map((stat, index) => (
          <View key={stat.title} className="w-[48%] mb-4">
            <StatCard
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              color={stat.color}
              delay={index * 100}
            />
          </View>
        ))}
      </View>

      {/* Morceau le plus écouté */}
      {stats.mostPlayedTrack && (
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20 mt-2">
            <View className="flex-row items-center mb-2">
              <Ionicons name="trophy" size={20} color="#10b981" />
              <Text className="text-primary font-medium ml-2">Morceau favori</Text>
            </View>
            <Text className="text-foreground font-semibold" numberOfLines={1}>
              {stats.mostPlayedTrack.title}
            </Text>
            <Text className="text-muted-foreground text-sm" numberOfLines={1}>
              {stats.mostPlayedTrack.user_profiles?.username}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};