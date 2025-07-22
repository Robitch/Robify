// import React, { useEffect, useState } from 'react';
// import { View, ScrollView, RefreshControl, Pressable, Alert } from 'react-native';
// import { Text } from '~/components/ui/text';
// import { router } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { useOfflineStore } from '~/store/offlineStore';
// import { useOfflineDownload } from '~/hooks/useOfflineDownload';
// import { usePlayerStore } from '~/store/playerStore';
// import MusicItem from '~/components/MusicItem';
// import { UI_CONSTANTS } from '~/constants/player';
// import Animated, { FadeInDown } from 'react-native-reanimated';
// import { OfflineTrack } from '~/types/library';

// type SortType = 'date' | 'name' | 'size' | 'artist';
// type SortOrder = 'asc' | 'desc';

// export default function DownloadsScreen() {
//   const {
//     offlineTracks,
//     isLoading,
//     error,
//     totalOfflineSize,
//     settings,
//     refreshOfflineStore,
//     initializeOfflineStore,
//     removeFromOffline,
//   } = useOfflineStore();

//   const {
//     formatSize,
//     usedPercentage,
//     maxSize,
//     canDownload,
//     isOnline,
//     isWifiOnly,
//   } = useOfflineDownload();

//   const { playTrack } = usePlayerStore();

//   const [sortType, setSortType] = useState<SortType>('date');
//   const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
//   const [sortedTracks, setSortedTracks] = useState<OfflineTrack[]>([]);

//   // Initialiser le store au montage
//   useEffect(() => {
//     initializeOfflineStore();
//   }, []);

//   // Trier les morceaux selon les critères
//   useEffect(() => {
//     const sorted = [...offlineTracks].sort((a, b) => {
//       let aValue: any, bValue: any;

//       switch (sortType) {
//         case 'date':
//           aValue = new Date(a.downloadedAt);
//           bValue = new Date(b.downloadedAt);
//           break;
//         case 'name':
//           aValue = a.title.toLowerCase();
//           bValue = b.title.toLowerCase();
//           break;
//         case 'size':
//           aValue = a.fileSize;
//           bValue = b.fileSize;
//           break;
//         case 'artist':
//           aValue = (a.user_profiles?.username || '').toLowerCase();
//           bValue = (b.user_profiles?.username || '').toLowerCase();
//           break;
//         default:
//           return 0;
//       }

//       if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
//       if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
//       return 0;
//     });

//     setSortedTracks(sorted);
//   }, [offlineTracks, sortType, sortOrder]);

//   const handleTrackPress = async (track: OfflineTrack) => {
//     try {
//       await playTrack({
//         id: track.id,
//         title: track.title,
//         artist: track.user_profiles?.username || 'Artiste inconnu',
//         file_url: track.localPath, // Utiliser le fichier local
//         artwork: track.artwork_url ?? undefined,
//       });
//     } catch (error) {
//       console.error('Erreur lors de la lecture:', error);
//       Alert.alert('Erreur', 'Impossible de lire ce morceau');
//     }
//   };

//   const handleRemoveTrack = async (trackId: string) => {
//     const track = offlineTracks.find(t => t.id === trackId);
//     if (!track) return;

//     Alert.alert(
//       'Supprimer le téléchargement',
//       `Voulez-vous supprimer "${track.title}" de vos téléchargements ?`,
//       [
//         { text: 'Annuler', style: 'cancel' },
//         { 
//           text: 'Supprimer', 
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await removeFromOffline(trackId);
//             } catch (error) {
//               Alert.alert('Erreur', 'Impossible de supprimer ce téléchargement');
//             }
//           }
//         }
//       ]
//     );
//   };

//   const handleSortChange = (newSortType: SortType) => {
//     if (sortType === newSortType) {
//       setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
//     } else {
//       setSortType(newSortType);
//       setSortOrder('desc');
//     }
//   };

//   const sortOptions = [
//     { key: 'date' as SortType, label: 'Date', icon: 'calendar-outline' },
//     { key: 'name' as SortType, label: 'Nom', icon: 'text-outline' },
//     { key: 'size' as SortType, label: 'Taille', icon: 'resize-outline' },
//     { key: 'artist' as SortType, label: 'Artiste', icon: 'person-outline' },
//   ];

//   // Statistiques de connectivité
//   const getConnectionStatus = () => {
//     if (!isOnline) return { text: 'Hors ligne', color: '#ef4444', icon: 'wifi-off' };
//     if (isWifiOnly && !canDownload) return { text: 'Données mobiles', color: '#f97316', icon: 'cellular-outline' };
//     if (canDownload) return { text: 'Wi-Fi', color: '#10b981', icon: 'wifi' };
//     return { text: 'Connecté', color: '#3b82f6', icon: 'wifi' };
//   };

//   const connectionStatus = getConnectionStatus();

//   return (
//     <View className="flex-1 bg-background">
//       {/* Header */}
//       <View className="pt-12 pb-4 px-6 border-b border-border">
//         <View className="flex-row items-center mb-4">
//           <Pressable
//             onPress={() => router.back()}
//             className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-muted/50"
//           >
//             <Ionicons name="chevron-back" size={24} color="#6b7280" />
//           </Pressable>
//           <Text className="text-2xl font-bold text-foreground flex-1">Téléchargements</Text>

//           {/* Statut de connexion */}
//           <View className="flex-row items-center">
//             <Ionicons 
//               name={connectionStatus.icon as keyof typeof Ionicons.glyphMap} 
//               size={16} 
//               color={connectionStatus.color} 
//             />
//             <Text className="ml-1 text-xs" style={{ color: connectionStatus.color }}>
//               {connectionStatus.text}
//             </Text>
//           </View>
//         </View>

//         {/* Indicateur d'espace utilisé */}
//         <View className="mb-4">
//           <View className="flex-row items-center justify-between mb-2">
//             <Text className="text-muted-foreground text-sm">
//               Espace utilisé: {formatSize(totalOfflineSize)} / {formatSize(maxSize)}
//             </Text>
//             <Text className="text-muted-foreground text-sm">
//               {usedPercentage}%
//             </Text>
//           </View>

//           {/* Barre de progression */}
//           <View className="h-2 bg-muted rounded-full overflow-hidden">
//             <View 
//               className="h-full rounded-full"
//               style={{ 
//                 width: `${Math.min(usedPercentage, 100)}%`,
//                 backgroundColor: usedPercentage > 90 ? '#ef4444' : usedPercentage > 70 ? '#f97316' : '#10b981'
//               }}
//             />
//           </View>
//         </View>

//         {/* Statistiques rapides */}
//         <View className="flex-row items-center justify-between">
//           <Text className="text-muted-foreground">
//             {String(sortedTracks.length)} morceau{sortedTracks.length > 1 ? 'x' : ''} téléchargé{sortedTracks.length > 1 ? 's' : ''}
//           </Text>

//           {/* Mode offline */}
//           {!isOnline && (
//             <View className="flex-row items-center">
//               <Ionicons name="download" size={16} color="#10b981" />
//               <Text className="text-primary ml-1 text-sm font-medium">Mode offline</Text>
//             </View>
//           )}
//         </View>
//       </View>

//       {/* Options de tri */}
//       <View className="py-4">
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={{
//             paddingHorizontal: 24,
//             paddingRight: 40,
//           }}
//         >
//           {sortOptions.map((option, index) => {
//             const isActive = sortType === option.key;
//             return (
//               <Animated.View
//                 key={option.key}
//                 entering={FadeInDown.delay(index * 100).springify()}
//               >
//                 <Pressable
//                   onPress={() => handleSortChange(option.key)}
//                   className={`flex-row items-center px-4 py-2 rounded-full mr-3 border ${
//                     isActive
//                       ? 'bg-primary border-primary'
//                       : 'bg-card border-border'
//                   }`}
//                 >
//                   <Ionicons
//                     name={option.icon as keyof typeof Ionicons.glyphMap}
//                     size={16}
//                     color={isActive ? '#ffffff' : '#6b7280'}
//                   />
//                   <Text
//                     className={`ml-2 text-sm font-medium ${
//                       isActive ? 'text-primary-foreground' : 'text-foreground'
//                     }`}
//                   >
//                     {option.label}
//                   </Text>
//                   {isActive && (
//                     <Ionicons
//                       name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'}
//                       size={14}
//                       color="#ffffff"
//                       style={{ marginLeft: 4 }}
//                     />
//                   )}
//                 </Pressable>
//               </Animated.View>
//             );
//           })}
//         </ScrollView>
//       </View>

//       {/* Message d'erreur */}
//       {error && (
//         <View className="mx-6 mb-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
//           <Text className="text-destructive font-medium">Erreur</Text>
//           <Text className="text-destructive/80 text-sm mt-1">{error}</Text>
//         </View>
//       )}

//       <ScrollView
//         className="flex-1"
//         contentContainerStyle={{
//           paddingBottom: UI_CONSTANTS.CONTENT_PADDING_BOTTOM,
//         }}
//         refreshControl={
//           <RefreshControl
//             refreshing={isLoading}
//             onRefresh={refreshOfflineStore}
//             tintColor="#10b981"
//             colors={['#10b981']}
//           />
//         }
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Liste des téléchargements */}
//         {sortedTracks.length === 0 ? (
//           <View className="flex-1 items-center justify-center px-6 py-12">
//             <Ionicons name="download-outline" size={64} color="#6b7280" />
//             <Text className="text-muted-foreground text-lg font-medium mt-4 text-center">
//               Aucun téléchargement
//             </Text>
//             <Text className="text-muted-foreground text-sm text-center mt-2">
//               Les morceaux que vous téléchargez apparaîtront ici
//             </Text>

//             {/* Conseils selon le statut de connexion */}
//             {!isOnline ? (
//               <View className="mt-6 p-4 bg-muted/50 rounded-lg">
//                 <Text className="text-muted-foreground text-xs text-center">
//                   💡 Vous êtes en mode offline. Connectez-vous pour télécharger de nouveaux morceaux.
//                 </Text>
//               </View>
//             ) : isWifiOnly && !canDownload ? (
//               <View className="mt-6 p-4 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
//                 <Text className="text-orange-700 dark:text-orange-300 text-xs text-center">
//                   💡 Téléchargement limité au Wi-Fi selon vos paramètres.
//                 </Text>
//               </View>
//             ) : (
//               <View className="mt-6 p-4 bg-muted/50 rounded-lg">
//                 <Text className="text-muted-foreground text-xs text-center">
//                   💡 Appuyez sur l'icône de téléchargement sur vos morceaux préférés.
//                 </Text>
//               </View>
//             )}
//           </View>
//         ) : (
//           <View className="px-6">
//             {sortedTracks.map((track, index) => (
//               <View key={track.id} className="mb-3">
//                 <MusicItem
//                   item={track}
//                   onRemoveMusic={() => handleRemoveTrack(track.id)}
//                   showArtwork={true}
//                   compact={false}
//                 />

//                 {/* Informations supplémentaires pour les téléchargements */}
//                 <View className="flex-row items-center justify-between mt-2 px-4">
//                   <View className="flex-row items-center">
//                     <Ionicons name="download" size={12} color="#10b981" />
//                     <Text className="text-xs text-muted-foreground ml-1">
//                       {new Date(track.downloadedAt).toLocaleDateString('fr-FR', {
//                         day: 'numeric',
//                         month: 'short',
//                         hour: '2-digit',
//                         minute: '2-digit'
//                       })}
//                     </Text>
//                   </View>

//                   <Text className="text-xs text-muted-foreground">
//                     {formatSize(track.fileSize)}
//                   </Text>
//                 </View>
//               </View>
//             ))}
//           </View>
//         )}
//       </ScrollView>
//     </View>
//   );
// }

// Blank template for the Downloads screen with just a text header
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';

export default function DownloadsScreen() {
  return (
    <View className="flex-1 bg-background">
      <Text className="text-2xl font-bold text-foreground">Téléchargements</Text>
    </View>
  );
}