import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '~/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useListeningTracker } from '@/hooks/useListeningTracker';
import { useLibraryStore } from '@/store/library';
import { MusicItem } from '@/components/MusicItem';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { cn } from '@/lib/utils';

type TimePeriod = 'week' | 'month' | 'year' | 'all';

interface ListeningStatsProps {
  className?: string;
}

interface TopTrackItemProps {
  track: any;
  rank: number;
  playCount: number;
  listeningTime: number;
  formatTime: (seconds: number) => string;
}

const TopTrackItem: React.FC<TopTrackItemProps> = ({
  track,
  rank,
  playCount,
  listeningTime,
  formatTime,
}) => {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#ffd700'; // gold
      case 2: return '#c0c0c0'; // silver
      case 3: return '#cd7f32'; // bronze
      default: return '#6b7280'; // gray
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return 'trophy';
      case 2: return 'medal';
      case 3: return 'medal';
      default: return 'musical-note';
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(rank * 100).springify()}
      className="flex-row items-center py-3 px-4 bg-card rounded-lg border border-border mb-2"
    >
      <View className="items-center mr-3 min-w-[32px]">
        <Ionicons 
          name={getRankIcon(rank)} 
          size={20} 
          color={getRankColor(rank)} 
        />
        <Text className="text-xs font-bold text-muted-foreground mt-1">
          #{rank}
        </Text>
      </View>
      
      <View className="flex-1">
        <Text className="text-foreground font-medium" numberOfLines={1}>
          {track.title}
        </Text>
        <Text className="text-muted-foreground text-sm" numberOfLines={1}>
          {track.artist}
        </Text>
      </View>
      
      <View className="items-end ml-3">
        <Text className="text-foreground font-semibold">
          {playCount} écoute{playCount > 1 ? 's' : ''}
        </Text>
        <Text className="text-muted-foreground text-xs">
          {formatTime(listeningTime)}
        </Text>
      </View>
    </Animated.View>
  );
};

export const ListeningStats: React.FC<ListeningStatsProps> = ({ className }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const [showTopTracks, setShowTopTracks] = useState(true);

  const {
    stats,
    recentTracks,
    formatListeningTime,
    getTrackPlayCount,
    getTrackListeningTime,
  } = useListeningTracker();

  const { tracks } = useLibraryStore();

  const periods: { key: TimePeriod; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'week', label: '7 jours', icon: 'calendar-outline' },
    { key: 'month', label: '30 jours', icon: 'calendar' },
    { key: 'year', label: 'Cette année', icon: 'calendar-clear' },
    { key: 'all', label: 'Tout temps', icon: 'infinite' },
  ];

  // Calculer les top morceaux
  const topTracks = React.useMemo(() => {
    return tracks
      .map(track => ({
        ...track,
        playCount: getTrackPlayCount(track.id),
        listeningTime: getTrackListeningTime(track.id),
      }))
      .filter(track => track.playCount > 0)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 10);
  }, [tracks, getTrackPlayCount, getTrackListeningTime]);

  // Calculer les stats par période
  const getPeriodStats = (period: TimePeriod) => {
    // Ici, on pourrait filtrer par période réelle
    // Pour l'instant, on utilise les stats globales
    switch (period) {
      case 'week':
        return {
          listens: stats.listensLast7Days || 0,
          time: stats.timeLast7Days || 0,
          tracks: Math.min(stats.uniqueTracks, stats.listensLast7Days || 0),
        };
      case 'month':
        return {
          listens: stats.listensLast30Days || 0,
          time: stats.timeLast30Days || 0,
          tracks: Math.min(stats.uniqueTracks, stats.listensLast30Days || 0),
        };
      default:
        return {
          listens: stats.totalListens,
          time: stats.totalListeningTime,
          tracks: stats.uniqueTracks,
        };
    }
  };

  const currentStats = getPeriodStats(selectedPeriod);
  const completionRate = currentStats.listens > 0 
    ? ((stats.completedListens || 0) / currentStats.listens * 100).toFixed(1)
    : '0';

  return (
    <View className={cn('space-y-6', className)}>
      {/* Sélecteur de période */}
      <View>
        <Text className="text-lg font-semibold text-foreground mb-3">
          Statistiques d'écoute
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          <View className="flex-row space-x-2">
            {periods.map((period) => (
              <TouchableOpacity
                key={period.key}
                onPress={() => setSelectedPeriod(period.key)}
                className={cn(
                  'flex-row items-center px-4 py-2 rounded-full border',
                  selectedPeriod === period.key
                    ? 'bg-primary border-primary'
                    : 'bg-card border-border'
                )}
              >
                <Ionicons
                  name={period.icon}
                  size={16}
                  color={selectedPeriod === period.key ? '#ffffff' : '#6b7280'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={cn(
                    'font-medium',
                    selectedPeriod === period.key
                      ? 'text-white'
                      : 'text-muted-foreground'
                  )}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Statistiques de la période */}
      <View className="bg-card p-4 rounded-xl border border-border">
        <Text className="text-foreground font-medium mb-4">
          Période : {periods.find(p => p.key === selectedPeriod)?.label}
        </Text>
        
        <View className="grid grid-cols-2 gap-4">
          <View className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <Text className="text-blue-600 dark:text-blue-400 text-2xl font-bold">
              {currentStats.listens.toLocaleString()}
            </Text>
            <Text className="text-blue-600/70 dark:text-blue-400/70 text-sm">
              Écoutes
            </Text>
          </View>
          
          <View className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <Text className="text-green-600 dark:text-green-400 text-2xl font-bold">
              {formatListeningTime(currentStats.time)}
            </Text>
            <Text className="text-green-600/70 dark:text-green-400/70 text-sm">
              Temps total
            </Text>
          </View>
          
          <View className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <Text className="text-purple-600 dark:text-purple-400 text-2xl font-bold">
              {currentStats.tracks}
            </Text>
            <Text className="text-purple-600/70 dark:text-purple-400/70 text-sm">
              Morceaux uniques
            </Text>
          </View>
          
          <View className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <Text className="text-orange-600 dark:text-orange-400 text-2xl font-bold">
              {completionRate}%
            </Text>
            <Text className="text-orange-600/70 dark:text-orange-400/70 text-sm">
              Complétés
            </Text>
          </View>
        </View>
      </View>

      {/* Toggle entre top morceaux et historique récent */}
      <View>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row bg-muted/30 rounded-lg p-1">
            <TouchableOpacity
              onPress={() => setShowTopTracks(true)}
              className={cn(
                'px-3 py-2 rounded-md',
                showTopTracks && 'bg-card shadow-sm'
              )}
            >
              <Text
                className={cn(
                  'font-medium text-sm',
                  showTopTracks ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                Top morceaux
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowTopTracks(false)}
              className={cn(
                'px-3 py-2 rounded-md',
                !showTopTracks && 'bg-card shadow-sm'
              )}
            >
              <Text
                className={cn(
                  'font-medium text-sm',
                  !showTopTracks ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                Historique
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-primary text-sm font-medium mr-1">
              Voir tout
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#10b981" />
          </TouchableOpacity>
        </View>

        {/* Liste des morceaux */}
        {showTopTracks ? (
          <View>
            {topTracks.length > 0 ? (
              topTracks.slice(0, 5).map((track, index) => (
                <TopTrackItem
                  key={track.id}
                  track={track}
                  rank={index + 1}
                  playCount={track.playCount}
                  listeningTime={track.listeningTime}
                  formatTime={formatListeningTime}
                />
              ))
            ) : (
              <View className="bg-muted/20 p-8 rounded-xl items-center">
                <Ionicons name="bar-chart-outline" size={48} color="#6b7280" />
                <Text className="text-muted-foreground text-center mt-2">
                  Aucun morceau écouté pour cette période
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View>
            {recentTracks.length > 0 ? (
              recentTracks.slice(0, 5).map((track, index) => (
                <Animated.View
                  key={`${track.id}-${index}`}
                  entering={FadeInDown.delay(index * 100).springify()}
                  className="mb-2"
                >
                  <MusicItem
                    item={track}
                    onPress={() => {/* Logic to play track */}}
                    compact={true}
                  />
                </Animated.View>
              ))
            ) : (
              <View className="bg-muted/20 p-8 rounded-xl items-center">
                <Ionicons name="time-outline" size={48} color="#6b7280" />
                <Text className="text-muted-foreground text-center mt-2">
                  Aucun historique d'écoute
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};