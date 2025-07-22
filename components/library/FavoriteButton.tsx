import React, { useEffect, useState, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  interpolate
} from 'react-native-reanimated';
import { useFavoritesStore } from '@/store/favoritesStore';
import { Track } from '@/types';
import { ReactionType } from '@/types/library';

interface FavoriteButtonProps {
  track: Track;
  size?: number;
  variant?: 'default' | 'mini' | 'large';
  showReactionType?: boolean;
  onFavoriteChange?: (isFavorite: boolean) => void;
}

// ReactionType importé depuis les types

const reactionIcons: Record<ReactionType, keyof typeof Ionicons.glyphMap> = {
  like: 'thumbs-up',
  fire: 'flame',
  heart: 'heart',
  mind_blown: 'nuclear'
};

const reactionColors: Record<ReactionType, string> = {
  like: '#3b82f6', // blue
  fire: '#f97316', // orange
  heart: '#ef4444', // red
  mind_blown: '#8b5cf6', // purple
};

export default function FavoriteButton({
  track,
  size = 24,
  variant = 'default',
  showReactionType = false,
  onFavoriteChange
}: FavoriteButtonProps) {
  const {
    isFavorite,
    getFavoriteReactionType,
    addToFavorites,
    removeFromFavorites,
    isLoading
  } = useFavoritesStore();

  const [isPressed, setIsPressed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Valeurs animées
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Vérifications de sécurité pour éviter les erreurs
  const isFav = isFavorite ? isFavorite(track.id) : false;
  const currentReactionType = getFavoriteReactionType ? getFavoriteReactionType(track.id) || 'heart' : 'heart';

  // Tailles selon la variante
  const getSize = () => {
    switch (variant) {
      case 'mini': return size * 0.8;
      case 'large': return size * 1.5;
      default: return size;
    }
  };

  // Animation de pression
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
      opacity: opacity.value,
    };
  });

  // Animation des particules (effet sparkle)
  const sparkleScale = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);

  const sparkleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: sparkleScale.value }],
      opacity: sparkleOpacity.value,
    };
  });

  // Animation de favoris activé
  const animateHeartBeat = useCallback(() => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 15, stiffness: 800 }),
      withSpring(1, { damping: 20, stiffness: 600 })
    );

    // Effet sparkle
    sparkleScale.value = withSpring(1.3, { damping: 15, stiffness: 600 });
    sparkleOpacity.value = withSequence(
      withSpring(1, { damping: 10, stiffness: 400 }),
      withSpring(0, { damping: 15, stiffness: 600 }, (finished) => {
        'worklet';
        if (finished) {
          sparkleScale.value = 0;
        }
      })
    );

    // Petite rotation pour l'effet "magique"
    rotation.value = withSequence(
      withSpring(-3, { damping: 15, stiffness: 600 }),
      withSpring(3, { damping: 15, stiffness: 600 }),
      withSpring(0, { damping: 20, stiffness: 800 })
    );
  }, []);

  // Animation de favoris retiré
  const animateHeartBreak = useCallback(() => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 20, stiffness: 600 }),
      withSpring(1, { damping: 25, stiffness: 800 })
    );

    opacity.value = withSequence(
      withSpring(0.6, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 20, stiffness: 600 })
    );
  }, []);

  // Gestion du toggle
  const handleToggleFavorite = async (reactionType: ReactionType = 'heart') => {
    if (isProcessing) return;

    // Vérifications de sécurité
    if (!track || !track.id) {
      console.error('Track invalide:', track);
      return;
    }

    if (!addToFavorites || !removeFromFavorites) {
      console.error('Store des favoris non initialisé');
      return;
    }

    setIsPressed(true);
    setIsProcessing(true);

    try {
      console.log('Toggle favorite for track:', track.id, 'isFav:', isFav, 'reactionType:', reactionType);

      if (isFav) {
        await removeFromFavorites(track.id, currentReactionType);
        animateHeartBreak();
        onFavoriteChange?.(false);
      } else {
        await addToFavorites(track.id, reactionType);
        animateHeartBeat();
        onFavoriteChange?.(true);
      }
    } catch (error) {
      console.error('Erreur lors du toggle favori:', error);
      console.error('Error details:', {
        trackId: track?.id,
        isFav,
        reactionType,
        error: error instanceof Error ? error.message : error
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setIsPressed(false), 100);
    }
  };

  // Long press pour afficher le picker de réaction
  const handleLongPress = () => {
    if (showReactionType) {
      setShowReactionPicker(true);
    }
  };

  const iconName = isFav
    ? (reactionIcons[currentReactionType] + '' as keyof typeof Ionicons.glyphMap)
    : 'heart-outline';

  const iconColor = isFav
    ? reactionColors[currentReactionType]
    : '#64748b'; // gray-500

  // Ne pas rendre le composant si les méthodes du store ne sont pas disponibles
  if (!isFavorite || !addToFavorites || !removeFromFavorites) {
    return (
      <View className="w-10 h-10 items-center justify-center">
        <Ionicons name="heart-outline" size={getSize()} color="#64748b" />
      </View>
    );
  }

  return (
    <View className="relative">
      {/* Bouton principal */}
      <Pressable
        onPress={() => handleToggleFavorite()}
        onLongPress={handleLongPress}
        disabled={isProcessing}
        className={`
          relative justify-center items-center rounded-full
          ${variant === 'mini' ? 'p-1' : variant === 'large' ? 'p-3' : 'p-2'}
          ${isPressed ? 'bg-gray-100 dark:bg-gray-800' : 'bg-transparent'}
          ${isProcessing ? 'opacity-50' : 'opacity-100'}
        `}
      >
        {/* Effet sparkle */}
        <Animated.View
          style={[sparkleStyle]}
          className="absolute inset-0 justify-center items-center"
          pointerEvents="none"
        >
          <View
            className="w-8 h-8 rounded-full"
            style={{
              backgroundColor: isFav ? reactionColors[currentReactionType] + '20' : 'transparent'
            }}
          />
        </Animated.View>

        {/* Icône principale */}
        <Animated.View style={animatedStyle}>
          <Ionicons
            name={iconName}
            size={getSize()}
            color={iconColor}
          />
        </Animated.View>
      </Pressable>

      {/* Picker de réactions (si activé) */}
      {showReactionPicker && showReactionType && (
        <View className="absolute -top-16 -left-4 flex-row bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border border-gray-200 dark:border-gray-700">
          {(Object.keys(reactionIcons) as ReactionType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => {
                handleToggleFavorite(type);
                setShowReactionPicker(false);
              }}
              className="p-2 rounded-full mx-1"
            >
              <Ionicons
                name={reactionIcons[type]}
                size={24}
                color={reactionColors[type]}
              />
            </Pressable>
          ))}

          {/* Bouton fermer */}
          <Pressable
            onPress={() => setShowReactionPicker(false)}
            className="p-2 rounded-full mx-1"
          >
            <Ionicons name="close" size={20} color="#64748b" />
          </Pressable>
        </View>
      )}
    </View>
  );
}