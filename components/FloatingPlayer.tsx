import React, { useEffect, useRef } from 'react'
import { ANIMATION_CONSTANTS, UI_CONSTANTS } from '@/constants/player'
import { useRouter, useSegments } from 'expo-router'
import { TouchableOpacity, View, ViewProps } from 'react-native'
import { useActiveTrack, useIsPlaying } from 'react-native-track-player'
import { MovingText } from './MovingText'
import { Image } from 'expo-image'
import { Text } from '@/components/ui/text'
import { useColorScheme } from '~/lib/useColorScheme'
import { Ionicons } from '@expo/vector-icons'
import TrackPlayer from 'react-native-track-player'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePlayerWithTracking } from '@/hooks/usePlayerWithTracking'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	withTiming,
	interpolate,
	runOnJS,
	useAnimatedGestureHandler,
	Extrapolate,
	withSequence,
	withDelay,
	Easing,
} from 'react-native-reanimated'
import { PanGestureHandler, TapGestureHandler } from 'react-native-gesture-handler'

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)

export const FloatingPlayer = ({ style }: ViewProps) => {
	const router = useRouter()
	const segments = useSegments()
	const insets = useSafeAreaInsets()
	const { isDarkColorScheme } = useColorScheme()
	
	// Utiliser le hook de tracking intégré
	const {
		activeTrack,
		playing,
		progress,
		isTracking,
		currentTrack,
	} = usePlayerWithTracking()



	// Ref pour mesurer la position
	const containerRef = useRef<View>(null)


	// Déterminer si on est dans les tabs et pas sur PlayerScreen
	const isInTabsLayout = segments[0] === '(tabs)'
	const isOnPlayerScreen = (segments as string[]).includes('PlayerScreen')

	// Enhanced animation values
	const containerY = useSharedValue(0) // Entrance/exit animation
	const containerOpacity = useSharedValue(0)
	const containerScale = useSharedValue(0)
	const containerRotation = useSharedValue(0)

	// Content animations
	const titleAreaX = useSharedValue(0)
	const titleAreaOpacity = useSharedValue(1)
	const artworkScale = useSharedValue(0.8)
	const artworkOpacity = useSharedValue(0)

	// Interactive feedback
	const pressScale = useSharedValue(1)
	const glowIntensity = useSharedValue(0)
	const shadowIntensity = useSharedValue(0)

	// Progress indicator
	const progressWidth = useSharedValue(0)

	// Vérifier si TrackPlayer a des tracks chargées et la queue
	const [hasLoadedTrack, setHasLoadedTrack] = React.useState(false)
	const [queueLength, setQueueLength] = React.useState(0)

	useEffect(() => {
		const checkTrackPlayer = async () => {
			try {
				const queue = await TrackPlayer.getQueue()
				const currentTrack = await TrackPlayer.getCurrentTrack()
				setHasLoadedTrack(queue.length > 0 && currentTrack !== null)
				setQueueLength(queue.length)
			} catch (error) {
				setHasLoadedTrack(false)
				setQueueLength(0)
			}
		}

		checkTrackPlayer()
	}, [activeTrack])

	// Enhanced entrance/exit animations
	useEffect(() => {
		if (activeTrack && hasLoadedTrack) {
			// Sophisticated entrance animation
			const springConfig = { damping: 20, stiffness: 100 };

			// Container slides up with rotation
			containerY.value = withSequence(
				withTiming(-10, { duration: 100 }),
				withSpring(0, springConfig)
			);

			containerOpacity.value = withTiming(1, {
				duration: 400,
				easing: Easing.out(Easing.cubic)
			});

			containerScale.value = withSequence(
				withTiming(1.05, { duration: 200 }),
				withSpring(1, springConfig)
			);

			// Subtle rotation for organic feel
			containerRotation.value = withSequence(
				withTiming(1, { duration: 150 }),
				withSpring(0, { damping: 25, stiffness: 150 })
			);

			// Content animations with delay
			artworkOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
			artworkScale.value = withDelay(150, withSpring(1, springConfig));

			// Glow effect
			glowIntensity.value = withDelay(200, withTiming(1, { duration: 500 }));
			shadowIntensity.value = withDelay(250, withTiming(1, { duration: 400 }));

		} else if (!activeTrack || !hasLoadedTrack) {
			// Smooth exit animation
			glowIntensity.value = withTiming(0, { duration: 150 });
			shadowIntensity.value = withTiming(0, { duration: 150 });

			artworkOpacity.value = withTiming(0, { duration: 200 });
			artworkScale.value = withTiming(0.8, { duration: 200 });

			containerY.value = withTiming(120, {
				duration: 300,
				easing: Easing.in(Easing.cubic)
			});
			containerOpacity.value = withTiming(0, { duration: 250 });
			containerScale.value = withTiming(0.7, { duration: 300 });
			containerRotation.value = withTiming(-2, { duration: 300 });
		}
	}, [activeTrack, hasLoadedTrack])

	// Animation du titre quand la track change (horizontal)
	useEffect(() => {
		if (activeTrack) {
			// Reset et animate la zone titre
			titleAreaX.value = 50
			titleAreaOpacity.value = 0

			titleAreaX.value = withSpring(0, { damping: 15, stiffness: 120 })
			titleAreaOpacity.value = withTiming(1, { duration: 250 })
		}
	}, [activeTrack?.id]) // Trigger seulement quand l'ID change


	const handlePress = () => {
		router.push('/PlayerScreen')
	}

	const handleDismissPlayer = async () => {
		try {
			await TrackPlayer.pause()
			await TrackPlayer.reset()
		} catch (error) {
			console.error('Error dismissing player:', error)
		}
	}

	const handleSkipToNext = async () => {
		try {
			await TrackPlayer.skipToNext()
		} catch (error) {
			console.error('Error skipping to next:', error)
		}
	}

	const handleSkipToPrevious = async () => {
		try {
			await TrackPlayer.skipToPrevious()
		} catch (error) {
			console.error('Error skipping to previous:', error)
		}
	}

	// Gesture handler pour le container (swipe down pour fermer SEULEMENT)
	const containerPanHandler = useAnimatedGestureHandler({
		onStart: () => {
			pressScale.value = withSpring(0.98, { damping: 15 })
		},
		onActive: (event) => {
			// Seulement permettre le swipe vers le bas, ET seulement si pas de mouvement horizontal significatif
			if (event.translationY > 0 && Math.abs(event.translationX) < 20) {
				containerY.value = event.translationY

				// Réduire l'opacité en fonction du swipe
				containerOpacity.value = interpolate(
					event.translationY,
					[0, 80],
					[1, 0.3],
					Extrapolate.CLAMP
				)
			}
		},
		onEnd: (event) => {
			pressScale.value = withSpring(1, { damping: 15 })

			// Logique améliorée pour détecter l'intention de fermer
			const isSwipeDown = event.translationY > 0 // Mouvement vers le bas
			const hasSignificantDistance = event.translationY > 40 // Distance minimale réduite
			const hasDownwardVelocity = event.velocityY > 200 // Vitesse minimale réduite
			const isNotTooHorizontal = Math.abs(event.translationX) < Math.abs(event.translationY) * 2 // Plus permissif
			
			// Conditions alternatives pour fermer :
			// 1. Distance importante (>80px) peu importe la vitesse
			// 2. Distance moyenne (>40px) avec vitesse vers le bas
			const shouldClose = isSwipeDown && isNotTooHorizontal && (
				event.translationY > 80 || // Grande distance
				(hasSignificantDistance && hasDownwardVelocity) // Distance + vitesse
			)

			if (shouldClose) {
				// Animation de fermeture
				containerY.value = withTiming(100, { duration: 250 })
				containerOpacity.value = withTiming(0, { duration: 250 })
				containerScale.value = withTiming(0.8, { duration: 250 })

				// Fermer le player après l'animation
				runOnJS(handleDismissPlayer)()
			} else {
				// Retour à la position normale
				containerY.value = withSpring(0, { damping: 15 })
				containerOpacity.value = withSpring(1, { damping: 15 })
			}
		},
	})

	// Gesture handler pour la zone titre SEULEMENT (swipe horizontal pour changer de track)
	const titleAreaPanHandler = useAnimatedGestureHandler({
		onActive: (event) => {
			// Mouvement horizontal seulement ET seulement si il y a plus d'une track dans la queue
			if (Math.abs(event.translationY) < 20) { // Pas de mouvement vertical significatif
				titleAreaX.value = event.translationX

				// Réduire l'opacité légèrement pendant le swipe
				titleAreaOpacity.value = interpolate(
					Math.abs(event.translationX),
					[0, 100],
					[1, 0.7],
					Extrapolate.CLAMP
				)
			}
		},
		onEnd: (event) => {
			const threshold = 80
			const velocity = 800

			// Vérifier qu'on a plus d'une track ET que le mouvement est principalement horizontal
			const hasMultipleTracks = queueLength > 1
			const isPrimarilyHorizontal = Math.abs(event.translationX) > Math.abs(event.translationY) * 2

			if (hasMultipleTracks && isPrimarilyHorizontal) {
				if (event.translationX > threshold || event.velocityX > velocity) {
					// Swipe vers la droite -> track précédente
					titleAreaX.value = withTiming(300, { duration: 200 }, () => {
						runOnJS(handleSkipToPrevious)()
					})
					titleAreaOpacity.value = withTiming(0, { duration: 200 })
				} else if (event.translationX < -threshold || event.velocityX < -velocity) {
					// Swipe vers la gauche -> track suivante
					titleAreaX.value = withTiming(-300, { duration: 200 }, () => {
						runOnJS(handleSkipToNext)()
					})
					titleAreaOpacity.value = withTiming(0, { duration: 200 })
				} else {
					// Retour à la position normale
					titleAreaX.value = withSpring(0, { damping: 15 })
					titleAreaOpacity.value = withSpring(1, { damping: 15 })
				}
			} else {
				// Retour à la position normale si pas assez de tracks ou mouvement pas horizontal
				titleAreaX.value = withSpring(0, { damping: 15 })
				titleAreaOpacity.value = withSpring(1, { damping: 15 })
			}
		},
	})

	// Tap handler pour ouvrir le player
	const tapHandler = useAnimatedGestureHandler({
		onStart: () => {
			pressScale.value = withSpring(0.96, { damping: 15 })
		},
		onEnd: () => {
			pressScale.value = withSpring(1, { damping: 15 })
			// runOnJS(handlePress)()
			handlePress()
		},
		onFail: () => {
			pressScale.value = withSpring(1, { damping: 15 })
		},
	})

	// Enhanced animated styles
	const containerAnimatedStyle = useAnimatedStyle(() => {
		const shadowOpacity = interpolate(
			shadowIntensity.value,
			[0, 1],
			[0.2, 0.4],
			Extrapolate.CLAMP
		);

		return {
			transform: [
				{ translateY: containerY.value },
				{ scale: containerScale.value * pressScale.value },
				{ rotate: `${containerRotation.value}deg` }
			],
			opacity: containerOpacity.value,
			shadowOpacity,
			shadowRadius: interpolate(
				shadowIntensity.value,
				[0, 1],
				[8, 16],
				Extrapolate.CLAMP
			),
		};
	});

	const artworkAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: artworkScale.value }],
		opacity: artworkOpacity.value,
	}));

	const glowStyle = useAnimatedStyle(() => ({
		opacity: interpolate(
			glowIntensity.value,
			[0, 1],
			[0, 0.3],
			Extrapolate.CLAMP
		),
	}));

	// Styles animés pour la zone titre (swipe horizontal)
	const titleAreaAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: titleAreaX.value }],
		opacity: titleAreaOpacity.value,
	}))

	// Ne pas afficher le FloatingPlayer si nécessaire ou si pas dans les tabs
	if (!activeTrack || !hasLoadedTrack || isOnPlayerScreen || !isInTabsLayout) return null

	return (
		<PanGestureHandler onGestureEvent={containerPanHandler}>
			<Animated.View
				ref={containerRef}
				className={`flex-row items-center ${isDarkColorScheme ? 'bg-gray-900/95' : 'bg-white/95'}`}
				style={[
					{
						position: 'absolute',
						left: 0,
						right: 0,
						bottom: 70, // Juste au-dessus de la bottom bar (height: 70)
						height: UI_CONSTANTS.MINI_PLAYER_HEIGHT,
						// zIndex: 1000,
						borderTopWidth: 1,
						borderTopColor: isDarkColorScheme ? '#374151' : '#f3f4f6',
						shadowColor: isDarkColorScheme ? '#000' : '#000',
						shadowOffset: { width: 0, height: -2 },
						shadowRadius: 8,
						shadowOpacity: 0.1,
						elevation: 8,
					},
					containerAnimatedStyle,
				]}
			>
				{/* Layout fixe avec zones séparées */}
				<View className="flex-row items-center px-4 py-2 flex-1">
					{/* Album Artwork - fixe, pas de swipe */}
					<AlbumArtwork
						artwork={activeTrack.artwork}
						isDarkColorScheme={isDarkColorScheme}
					/>

					{/* Zone Titre/Artiste - swipable horizontalement SI queue > 1 */}
					<View className="flex-1 min-w-0 mx-3">
						{queueLength > 1 ? (
							<PanGestureHandler onGestureEvent={titleAreaPanHandler}>
								<Animated.View style={titleAreaAnimatedStyle}>
									<TapGestureHandler onGestureEvent={() => tapHandler}>
										<Animated.View>
											<MovingText
												text={activeTrack.title || 'Titre inconnu'}
												className="font-semibold text-foreground text-base"
												animationThreshold={UI_CONSTANTS.MOVING_TEXT_THRESHOLD}
											/>
											<Text className="text-muted-foreground text-sm mt-1" numberOfLines={1}>
												{activeTrack.artist || 'Artiste inconnu'}
											</Text>
										</Animated.View>
									</TapGestureHandler>
								</Animated.View>
							</PanGestureHandler>
						) : (
							// Si une seule track, zone titre normale sans swipe
							// <TapGestureHandler onGestureEvent={() => tapHandler}>
							// 	<Animated.View>
							<TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
								<View>
									<MovingText
										text={activeTrack.title || 'Titre inconnu'}
										className="font-semibold text-foreground text-base"
										animationThreshold={UI_CONSTANTS.MOVING_TEXT_THRESHOLD}
									/>
									<Text className="text-muted-foreground text-sm mt-1" numberOfLines={1}>
										{activeTrack.artist || 'Artiste inconnu'}
									</Text>
								</View>
							</TouchableOpacity>

							// </Animated.View>
							// </TapGestureHandler> 
						)}
					</View>

					{/* Player Controls - fixes, ne bougent jamais */}
					<PlayerControlsFloating isDarkColorScheme={isDarkColorScheme} />
				</View>
			</Animated.View>
		</PanGestureHandler>
	)
}

// Composant séparé pour l'artwork
const AlbumArtwork = ({ artwork, isDarkColorScheme }: {
	artwork?: string,
	isDarkColorScheme: boolean
}) => {
	return (
		<View className="w-12 h-12 rounded-lg overflow-hidden">
			{artwork ? (
				<Image
					source={{ uri: artwork }}
					className="w-full h-full"
					contentFit="cover"
				/>
			) : (
				<View className={`w-full h-full ${isDarkColorScheme ? 'bg-gray-800' : 'bg-gray-200'} items-center justify-center`}>
					<Text className="text-lg">🎵</Text>
				</View>
			)}
		</View>
	)
}

// Composant séparé pour les contrôles
const PlayerControlsFloating = ({ isDarkColorScheme }: { isDarkColorScheme: boolean }) => {
	const { playing } = usePlayerWithTracking()
	const pressScalePlay = useSharedValue(1)

	const handlePlayPause = async () => {
		try {
			if (playing) {
				await TrackPlayer.pause()
			} else {
				await TrackPlayer.play()
			}
		} catch (error) {
			console.error('Error controlling playback:', error)
		}
	}

	const playAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: pressScalePlay.value }],
	}))

	return (
		<View className="flex-row items-center">
			<TouchableOpacity
				activeOpacity={0.7}
				onPress={handlePlayPause}
				hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
			>
				<Animated.View
					style={playAnimatedStyle}
					onTouchStart={() => {
						pressScalePlay.value = withSpring(0.8, { damping: 15 })
					}}
					onTouchEnd={() => {
						pressScalePlay.value = withSpring(1, { damping: 15 })
					}}
				>
					<Ionicons
						name={playing ? 'pause-circle' : 'play-circle'}
						size={36}
						color={isDarkColorScheme ? '#ffffff' : '#000000'}
					/>
				</Animated.View>
			</TouchableOpacity>
		</View>
	)
}

