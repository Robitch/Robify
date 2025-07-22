import React, { useState, useCallback } from 'react';
import { Pressable, Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '~/components/ui/text';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import { useOfflineDownload } from '~/hooks/useOfflineDownload';
import { Track } from '@/types';
import { DownloadProgress } from '~/types/library';

interface DownloadButtonProps {
  track: Track;
  size?: number;
  variant?: 'default' | 'mini' | 'large';
  showProgress?: boolean;
  showSize?: boolean;
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: string) => void;
}

export default function DownloadButton({ 
  track, 
  size = 24, 
  variant = 'default',
  showProgress = true,
  showSize = false,
  onDownloadStart,
  onDownloadComplete,
  onDownloadError
}: DownloadButtonProps) {
  const {
    isTrackDownloaded,
    isTrackDownloading,
    getDownloadProgress,
    downloadTrack,
    cancelDownload,
    deleteDownload,
    pauseDownload,
    resumeDownload,
    canDownload,
    isOnline,
    isWifiOnly,
    formatSize,
    estimateTrackSize,
  } = useOfflineDownload();

  const [isPressed, setIsPressed] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  // Valeurs animées
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const progressScale = useSharedValue(0);

  // États du téléchargement
  const isDownloaded = isTrackDownloaded(track.id);
  const isDownloading = isTrackDownloading(track.id);
  const downloadProgress = getDownloadProgress(track.id);
  const estimatedSize = estimateTrackSize(track);

  // Tailles selon la variante
  const getSize = () => {
    switch (variant) {
      case 'mini': return size * 0.8;
      case 'large': return size * 1.5;
      default: return size;
    }
  };

  // Animation principale
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
      opacity: opacity.value,
    };
  });

  // Animation de la barre de progression
  const progressStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: progressScale.value }],
    };
  });

  // Animation de téléchargement
  const animateDownload = useCallback(() => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 15, stiffness: 800 }),
      withSpring(1, { damping: 20, stiffness: 600 })
    );

    rotation.value = withSequence(
      withSpring(-10, { damping: 15, stiffness: 600 }),
      withSpring(10, { damping: 15, stiffness: 600 }),
      withSpring(0, { damping: 20, stiffness: 800 })
    );

    // Animer la progression
    if (downloadProgress) {
      progressScale.value = withSpring(downloadProgress.progress / 100, { damping: 20, stiffness: 600 });
    }
  }, [downloadProgress]);

  // Animation de suppression
  const animateDelete = useCallback(() => {
    scale.value = withSequence(
      withSpring(0.8, { damping: 20, stiffness: 600 }),
      withSpring(1, { damping: 25, stiffness: 800 })
    );

    opacity.value = withSequence(
      withSpring(0.5, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 20, stiffness: 600 })
    );
  }, []);

  // Gestion du téléchargement
  const handleDownload = async () => {
    if (isDownloaded) {
      // Afficher les options pour les fichiers déjà téléchargés
      setShowOptions(true);
      return;
    }

    if (isDownloading) {
      // Annuler le téléchargement en cours
      Alert.alert(
        'Annuler le téléchargement',
        'Voulez-vous annuler le téléchargement de ce morceau ?',
        [
          { text: 'Non', style: 'cancel' },
          { 
            text: 'Oui', 
            style: 'destructive',
            onPress: async () => {
              try {
                await cancelDownload(track.id);
              } catch (error) {
                onDownloadError?.(error instanceof Error ? error.message : 'Erreur lors de l\'annulation');
              }
            }
          }
        ]
      );
      return;
    }

    // Vérifications avant téléchargement
    if (!isOnline) {
      Alert.alert('Pas de connexion', 'Une connexion Internet est requise pour télécharger.');
      return;
    }

    if (isWifiOnly && !canDownload) {
      Alert.alert(
        'Wi-Fi requis', 
        'Vos paramètres nécessitent une connexion Wi-Fi pour télécharger. Voulez-vous modifier ce paramètre ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Paramètres', onPress: () => {/* TODO: Ouvrir les paramètres */} }
        ]
      );
      return;
    }

    try {
      setIsPressed(true);
      animateDownload();
      onDownloadStart?.();
      
      await downloadTrack(track);
      onDownloadComplete?.();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du téléchargement';
      Alert.alert('Erreur de téléchargement', errorMessage);
      onDownloadError?.(errorMessage);
    } finally {
      setIsPressed(false);
    }
  };

  // Supprimer le téléchargement
  const handleDelete = async () => {
    Alert.alert(
      'Supprimer le téléchargement',
      `Voulez-vous supprimer "${track.title}" de vos téléchargements ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              animateDelete();
              await deleteDownload(track.id);
              setShowOptions(false);
            } catch (error) {
              Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la suppression');
            }
          }
        }
      ]
    );
  };

  // Icône selon l'état
  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    if (isDownloading) {
      return 'pause-circle';
    }
    if (isDownloaded) {
      return 'checkmark-circle';
    }
    return 'download-outline';
  };

  // Couleur selon l'état
  const getColor = (): string => {
    if (isDownloading) {
      return '#f97316'; // orange
    }
    if (isDownloaded) {
      return '#10b981'; // vert
    }
    if (!canDownload) {
      return '#64748b'; // gris
    }
    return '#3b82f6'; // bleu
  };

  const iconName = getIcon();
  const iconColor = getColor();

  return (
    <View className="relative">
      {/* Bouton principal */}
      <Pressable
        onPress={handleDownload}
        onLongPress={() => isDownloaded && setShowOptions(true)}
        disabled={!canDownload && !isDownloaded && !isDownloading}
        className={`
          relative justify-center items-center rounded-full
          ${variant === 'mini' ? 'p-1' : variant === 'large' ? 'p-3' : 'p-2'}
          ${isPressed ? 'bg-gray-100 dark:bg-gray-800' : 'bg-transparent'}
          ${(!canDownload && !isDownloaded && !isDownloading) ? 'opacity-50' : 'opacity-100'}
        `}
      >
        {/* Indicateur de progression circulaire */}
        {isDownloading && downloadProgress && showProgress && (
          <Animated.View 
            style={[progressStyle]}
            className="absolute inset-0 justify-center items-center"
          >
            <View 
              className="rounded-full border-2"
              style={{ 
                width: getSize() + 8, 
                height: getSize() + 8,
                borderColor: iconColor + '40',
                transform: [{ rotate: '90deg' }]
              }}
            >
              <View 
                className="rounded-full border-2"
                style={{ 
                  width: '100%', 
                  height: '100%',
                  borderColor: iconColor,
                  borderTopColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: downloadProgress.progress > 50 ? iconColor : 'transparent',
                  borderLeftColor: downloadProgress.progress > 25 ? iconColor : 'transparent',
                }}
              />
            </View>
          </Animated.View>
        )}

        {/* Icône principale */}
        <Animated.View style={animatedStyle}>
          <Ionicons
            name={iconName}
            size={getSize()}
            color={iconColor}
          />
        </Animated.View>

        {/* Pourcentage de progression */}
        {isDownloading && downloadProgress && showProgress && variant !== 'mini' && (
          <View className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
            <Text className="text-xs text-muted-foreground text-center">
              {Math.round(downloadProgress.progress)}%
            </Text>
          </View>
        )}
      </Pressable>

      {/* Taille estimée/réelle */}
      {showSize && variant !== 'mini' && (
        <View className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
          <Text className="text-xs text-muted-foreground text-center">
            {isDownloaded && downloadProgress?.totalBytes 
              ? formatSize(downloadProgress.totalBytes)
              : formatSize(estimatedSize)
            }
          </Text>
        </View>
      )}

      {/* Menu d'options pour les fichiers téléchargés */}
      {showOptions && isDownloaded && (
        <View className="absolute -top-16 -left-8 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg border border-gray-200 dark:border-gray-700 min-w-32">
          <Pressable
            onPress={handleDelete}
            className="flex-row items-center p-2 rounded"
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text className="ml-2 text-sm">Supprimer</Text>
          </Pressable>
          
          <Pressable
            onPress={() => setShowOptions(false)}
            className="flex-row items-center p-2 rounded mt-1"
          >
            <Ionicons name="close" size={16} color="#64748b" />
            <Text className="ml-2 text-sm text-muted-foreground">Fermer</Text>
          </Pressable>
        </View>
      )}

      {/* Overlay pour fermer le menu */}
      {showOptions && (
        <Pressable
          onPress={() => setShowOptions(false)}
          className="absolute inset-0 w-screen h-screen"
          style={{ left: -1000, top: -1000, width: 2000, height: 2000 }}
        />
      )}
    </View>
  );
}