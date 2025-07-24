import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '~/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useLibraryStore } from '@/store/library';
import { useListeningTracker } from '@/hooks/useListeningTracker';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface GenreData {
  genre: string;
  count: number;
  percentage: number;
  listeningTime: number;
  color: string;
}

interface GenreBarProps {
  genre: GenreData;
  index: number;
  maxCount: number;
}

const GenreBar: React.FC<GenreBarProps> = ({ genre, index, maxCount }) => {
  const widthPercentage = (genre.count / maxCount) * 100;
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).springify()}
      className="mb-4"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <View 
            className="w-3 h-3 rounded-full mr-3"
            style={{ backgroundColor: genre.color }}
          />
          <Text className="text-foreground font-medium flex-1" numberOfLines={1}>
            {genre.genre || 'Non défini'}
          </Text>
        </View>
        <Text className="text-muted-foreground text-sm">
          {genre.count} ({genre.percentage.toFixed(1)}%)
        </Text>
      </View>
      
      <View className="bg-muted/30 h-2 rounded-full overflow-hidden">
        <Animated.View 
          className="h-full rounded-full"
          style={{ 
            backgroundColor: genre.color,
            width: `${widthPercentage}%`,
          }}
        />
      </View>
    </Animated.View>
  );
};

export const GenreChart: React.FC = () => {
  const { tracks } = useLibraryStore();
  const { formatListeningTime, getTrackListeningTime } = useListeningTracker();

  // Couleurs pour les genres
  const genreColors = [
    '#10b981', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#f59e0b', // yellow
    '#ef4444', // red
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
    '#6366f1', // indigo
  ];

  // Analyser les genres
  const genreStats = React.useMemo(() => {
    const genreMap = new Map<string, { count: number; listeningTime: number }>();
    
    tracks.forEach(track => {
      const genre = track.genre || 'Non défini';
      const existing = genreMap.get(genre) || { count: 0, listeningTime: 0 };
      const listeningTime = getTrackListeningTime(track.id);
      
      genreMap.set(genre, {
        count: existing.count + 1,
        listeningTime: existing.listeningTime + listeningTime,
      });
    });

    const totalTracks = tracks.length;
    const genreData: GenreData[] = Array.from(genreMap.entries())
      .map(([genre, data], index) => ({
        genre,
        count: data.count,
        percentage: (data.count / totalTracks) * 100,
        listeningTime: data.listeningTime,
        color: genreColors[index % genreColors.length],
      }))
      .sort((a, b) => b.count - a.count);

    return genreData;
  }, [tracks, getTrackListeningTime]);

  const maxCount = Math.max(...genreStats.map(g => g.count));
  const totalListeningTime = genreStats.reduce((sum, g) => sum + g.listeningTime, 0);

  if (genreStats.length === 0) {
    return (
      <View className="px-6 mt-6">
        <Text className="text-lg font-semibold text-foreground mb-4">
          Genres musicaux
        </Text>
        <View className="bg-muted/20 p-8 rounded-xl items-center">
          <Ionicons name="musical-notes-outline" size={48} color="#6b7280" />
          <Text className="text-muted-foreground text-center mt-2">
            Aucun genre défini dans votre bibliothèque
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="px-6 mt-6">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-foreground">
          Genres musicaux
        </Text>
        <View className="flex-row items-center">
          <Text className="text-muted-foreground text-sm mr-1">
            {genreStats.length} genres
          </Text>
          <Ionicons name="bar-chart-outline" size={16} color="#6b7280" />
        </View>
      </View>

      {/* Top 3 genres avec cercles */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="mb-6"
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        {genreStats.slice(0, 3).map((genre, index) => (
          <Animated.View
            key={genre.genre}
            entering={FadeInDown.delay(index * 150).springify()}
            className="bg-card p-4 rounded-xl border border-border mr-3 min-w-[140px]"
          >
            <View className="items-center">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: `${genre.color}20` }}
              >
                <Text 
                  className="text-lg font-bold"
                  style={{ color: genre.color }}
                >
                  #{index + 1}
                </Text>
              </View>
              <Text className="text-foreground font-semibold text-center" numberOfLines={1}>
                {genre.genre}
              </Text>
              <Text className="text-muted-foreground text-sm">
                {genre.count} morceaux
              </Text>
              <Text className="text-muted-foreground text-xs">
                {formatListeningTime(genre.listeningTime)}
              </Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Liste complète des genres */}
      <View className="bg-card p-4 rounded-xl border border-border">
        <Text className="text-foreground font-medium mb-4">
          Répartition complète
        </Text>
        
        {genreStats.map((genre, index) => (
          <GenreBar
            key={genre.genre}
            genre={genre}
            index={index}
            maxCount={maxCount}
          />
        ))}
      </View>

      {/* Statistiques générales */}
      <View className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20 mt-4">
        <View className="flex-row items-center mb-3">
          <Ionicons name="stats-chart" size={20} color="#10b981" />
          <Text className="text-primary font-medium ml-2">Statistiques</Text>
        </View>
        
        <View className="flex-row justify-between">
          <View className="flex-1">
            <Text className="text-muted-foreground text-sm">
              Genre principal
            </Text>
            <Text className="text-foreground font-semibold">
              {genreStats[0]?.genre || 'Aucun'}
            </Text>
          </View>
          
          <View className="flex-1 items-center">
            <Text className="text-muted-foreground text-sm">
              Temps total
            </Text>
            <Text className="text-foreground font-semibold">
              {formatListeningTime(totalListeningTime)}
            </Text>
          </View>
          
          <View className="flex-1 items-end">
            <Text className="text-muted-foreground text-sm">
              Diversité
            </Text>
            <Text className="text-foreground font-semibold">
              {genreStats.length} types
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};