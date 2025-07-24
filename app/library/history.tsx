import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { useHistoryStore } from '@/store/historyStore';
import { cn } from '@/lib/utils';
import { TestTrackingButton } from '@/components/TestTrackingButton';

type TimeFilter = 'today' | 'week' | 'month' | 'all';
type SortBy = 'recent' | 'name' | 'artist' | 'playCount';

export default function HistoryScreen() {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [refreshing, setRefreshing] = useState(false);

  const { 
    stats, 
    listeningHistory, 
    initializeHistory, 
    isLoading 
  } = useHistoryStore();

  useEffect(() => {
    initializeHistory();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeHistory();
    setRefreshing(false);
  };

  // Formater le temps d'écoute
  const formatListeningTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  const timeFilters: { key: TimeFilter; label: string }[] = [
    { key: 'today', label: "Aujourd'hui" },
    { key: 'week', label: 'Cette semaine' },
    { key: 'month', label: 'Ce mois' },
    { key: 'all', label: 'Tout' },
  ];

  const sortOptions: { key: SortBy; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'recent', label: 'Récent', icon: 'time-outline' },
    { key: 'name', label: 'Nom', icon: 'text-outline' },
    { key: 'artist', label: 'Artiste', icon: 'person-outline' },
    { key: 'playCount', label: 'Écoutes', icon: 'play-outline' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      {/* En-tête */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2"
        >
          <Ionicons name="arrow-back" size={24} className="text-gray-900 dark:text-white" />
        </TouchableOpacity>
        
        <Text className="text-xl font-bold text-gray-900 dark:text-white">
          Historique d'écoute
        </Text>
        
        <TouchableOpacity
          onPress={handleRefresh}
          className="p-2 -mr-2"
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            className={cn(
              "text-gray-900 dark:text-white",
              refreshing && "opacity-50"
            )} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Statistiques rapides */}
        <View className="p-4 bg-gray-50 dark:bg-gray-800 m-4 rounded-xl">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Statistiques
          </Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600 dark:text-gray-400">
              Morceaux écoutés
            </Text>
            <Text className="font-medium text-gray-900 dark:text-white">
              {stats.totalListens || 0}
            </Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600 dark:text-gray-400">
              Morceaux uniques
            </Text>
            <Text className="font-medium text-gray-900 dark:text-white">
              {stats.uniqueTracks || 0}
            </Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600 dark:text-gray-400">
              Temps total
            </Text>
            <Text className="font-medium text-gray-900 dark:text-white">
              {formatListeningTime(stats.totalListeningTime || 0)}
            </Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-400">
              Temps moyen/jour
            </Text>
            <Text className="font-medium text-gray-900 dark:text-white">
              {formatListeningTime((stats.dailyAverageMinutes || 0) * 60)}
            </Text>
          </View>
        </View>

        {/* Bouton de test - TEMPORAIRE */}
        <TestTrackingButton />

        {/* Filtres de temps */}
        <View className="px-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Période
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {timeFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  onPress={() => setTimeFilter(filter.key)}
                  className={cn(
                    "px-4 py-2 rounded-full border",
                    timeFilter === filter.key
                      ? "bg-blue-500 border-blue-500"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  )}
                >
                  <Text
                    className={cn(
                      "font-medium",
                      timeFilter === filter.key
                        ? "text-white"
                        : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Options de tri */}
        <View className="px-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Trier par
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setSortBy(option.key)}
                  className={cn(
                    "flex-row items-center px-3 py-2 rounded-full border",
                    sortBy === option.key
                      ? "bg-blue-500 border-blue-500"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  )}
                >
                  <Ionicons
                    name={option.icon}
                    size={16}
                    className={cn(
                      "mr-2",
                      sortBy === option.key
                        ? "text-white"
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  />
                  <Text
                    className={cn(
                      "font-medium",
                      sortBy === option.key
                        ? "text-white"
                        : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Historique d'écoute */}
        <View className="px-4 pb-20">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              Historique récent ({listeningHistory.length})
            </Text>
          </View>

          {isLoading ? (
            <View className="items-center py-12">
              <Ionicons 
                name="reload-outline" 
                size={48} 
                className="text-gray-400 dark:text-gray-600 mb-4" 
              />
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                Chargement de l'historique...
              </Text>
            </View>
          ) : listeningHistory.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons 
                name="musical-notes-outline" 
                size={64} 
                className="text-gray-400 dark:text-gray-600 mb-4" 
              />
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                Aucun historique d'écoute disponible
              </Text>
              <Text className="text-gray-400 dark:text-gray-500 text-center text-sm mt-2">
                Commencez à écouter de la musique pour voir vos statistiques ici
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {listeningHistory.slice(0, 20).map((entry, index) => (
                <View key={entry.id || index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900 dark:text-white" numberOfLines={1}>
                        {entry.track_id || entry.trackId || 'Track inconnu'}
                      </Text>
                      <Text className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        Écouté le {new Date(entry.listened_at || entry.listenedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    <View className="items-end ml-3">
                      <Text className="text-sm text-gray-500 dark:text-gray-400">
                        {formatListeningTime(entry.duration_listened || entry.durationListened || 0)}
                      </Text>
                      {(entry.completed) && (
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="checkmark-circle" size={14} className="text-green-500 mr-1" />
                          <Text className="text-xs text-green-500">Complété</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}