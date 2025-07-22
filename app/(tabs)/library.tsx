import React, { useEffect } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Text } from '~/components/ui/text';
import { useLibraryStore } from '~/store/libraryStore';
import { useFavoritesStore } from '~/store/favoritesStore';
import { useOfflineStore } from '~/store/offlineStore';
import { useHistoryStore } from '~/store/historyStore';
import { LibraryStats } from '~/components/library/LibraryStats';
import { LibrarySections } from '~/components/library/LibrarySections';
import { RecentlyPlayed } from '~/components/library/RecentlyPlayed';
import { QuickActions } from '~/components/library/QuickActions';
import { UI_CONSTANTS } from '~/constants/player';

export default function LibraryScreen() {
  const {
    initializeLibrary,
    refreshLibrary,
    isLoading: libraryLoading,
    error: libraryError,
    stats,
  } = useLibraryStore();

  const {
    initializeFavorites,
    isLoading: favoritesLoading,
  } = useFavoritesStore();

  const {
    initializeOfflineStore,
    isLoading: offlineLoading,
  } = useOfflineStore();

  const {
    initializeHistory,
    isLoading: historyLoading,
  } = useHistoryStore();

  const isLoading = libraryLoading || favoritesLoading || offlineLoading || historyLoading;

  useEffect(() => {
    // Initialiser tous les stores au montage du composant
    const initializeStores = async () => {
      try {
        await Promise.all([
          initializeLibrary(),
          initializeFavorites(),
          initializeOfflineStore(),
          initializeHistory(),
        ]);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation des stores:', error);
      }
    };

    initializeStores();
  }, []);

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refreshLibrary(),
        useFavoritesStore.getState().refreshFavorites(),
        useOfflineStore.getState().refreshOfflineStore(),
        useHistoryStore.getState().refreshHistory(),
      ]);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-12 pb-6 px-6 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Ma Bibliothèque</Text>
        <Text className="text-muted-foreground mt-1">
          Découvrez votre univers musical personnel
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: UI_CONSTANTS.CONTENT_PADDING_BOTTOM,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Message d'erreur */}
        {libraryError && (
          <View className="mx-6 mt-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <Text className="text-destructive font-medium">Erreur</Text>
            <Text className="text-destructive/80 text-sm mt-1">{libraryError}</Text>
          </View>
        )}

        {/* Actions rapides */}
        <QuickActions />

        {/* Statistiques principales */}
        <LibraryStats stats={stats} isLoading={isLoading} />

        {/* Sections principales */}
        <LibrarySections isLoading={isLoading} />

        {/* Récemment écouté */}
        <RecentlyPlayed />

        {/* Espace supplémentaire pour le mini-player */}
        {/* <View className="h-6" /> */}
      </ScrollView>
    </View>
  );
}