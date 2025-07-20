import React, { useEffect } from 'react'
import { PlayPauseButton, SkipToNextButton } from '@/components/PlayerControls'
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
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	withTiming,
	interpolate,
	runOnJS,
	useAnimatedGestureHandler,
	withSequence,
} from 'react-native-reanimated'
import { PanGestureHandler, TapGestureHandler } from 'react-native-gesture-handler'

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)

export const FloatingPlayer = ({ style }: ViewProps) => {
	const router = useRouter()
	const segments = useSegments()
	const insets = useSafeAreaInsets()
	const { isDarkColorScheme } = useColorScheme()
	const activeTrack = useActiveTrack()
	const { playing } = useIsPlaying()

	// Déterminer si on est dans les tabs ou pas
	const isInTabsLayout = segments[0] === '(tabs)'
	const bottomOffset = isInTabsLayout ? 78 : insets.bottom + 16

	// Masquer le FloatingPlayer si on est sur la page PlayerScreen
	const isOnPlayerScreen = segments.includes('PlayerScreen')
	
	console.log('Current segments:', segments)
	console.log('Is on PlayerScreen:', isOnPlayerScreen)

	// Animation values
	const scale = useSharedValue(0)
	const opacity = useSharedValue(0)
	const translateY = useSharedValue(50)
	const pressScale = useSharedValue(1)
	const panX = useSharedValue(0)
	const panY = useSharedValue(0)
	const isPressed = useSharedValue(false)

	// Vérifier si TrackPlayer a des tracks chargées
	const [hasLoadedTrack, setHasLoadedTrack] = React.useState(false)

	useEffect(() => {
		const checkTrackPlayer = async () => {
			try {
				const queue = await TrackPlayer.getQueue()
				const currentTrack = await TrackPlayer.getCurrentTrack()
				setHasLoadedTrack(queue.length > 0 && currentTrack !== null)
			} catch (error) {
				setHasLoadedTrack(false)
			}
		}

		checkTrackPlayer()
	}, [activeTrack])

	// Entrance animation - seulement si on a une track chargée
	useEffect(() => {
		if (activeTrack && hasLoadedTrack) {
			// Réinitialiser d'abord les valeurs pour une nouvelle apparition propre
			resetAnimationValues()
			
			// Puis lancer l'animation d'entrée
			scale.value = withSpring(1, {
				damping: 15,
				stiffness: 150,
				mass: 1
			})
			opacity.value = withTiming(1, { duration: 300 })
			translateY.value = withSpring(0, {
				damping: 12,
				stiffness: 120
			})
		} else {
			scale.value = withTiming(0, { duration: 200 })
			opacity.value = withTiming(0, { duration: 200 })
			translateY.value = withTiming(50, { duration: 200 })
		}
	}, [activeTrack, hasLoadedTrack])

	const handlePress = () => {
		router.navigate('/PlayerScreen')
	}

	// Gesture handlers
	const tapGestureHandler = useAnimatedGestureHandler({
		onStart: () => {
			isPressed.value = true
			pressScale.value = withSpring(0.95, { damping: 15 })
		},
		onEnd: () => {
			isPressed.value = false
			pressScale.value = withSpring(1, { damping: 15 })
			runOnJS(handlePress)()
		},
		onFail: () => {
			isPressed.value = false
			pressScale.value = withSpring(1, { damping: 15 })
		},
	})

	const handleDismissPlayer = async () => {
		try {
			// Arrêter la musique et vider la queue
			await TrackPlayer.pause()
			await TrackPlayer.reset()
			console.log('Player dismissed and queue cleared')
		} catch (error) {
			console.error('Error dismissing player:', error)
		}
	}

	// Réinitialiser les valeurs d'animation quand une nouvelle track arrive
	const resetAnimationValues = () => {
		scale.value = 0
		opacity.value = 0
		translateY.value = 50
		panX.value = 0
		panY.value = 0
		pressScale.value = 1
	}

	const panGestureHandler = useAnimatedGestureHandler({
		onStart: () => {
			isPressed.value = true
			pressScale.value = withSpring(0.98)
		},
		onActive: (event) => {
			// Permettre le mouvement dans toutes les directions
			panX.value = event.translationX * 0.5
			panY.value = event.translationY
			
			// Réduire l'opacité quand on swipe vers le bas
			if (event.translationY > 0) {
				opacity.value = interpolate(
					event.translationY,
					[0, 100],
					[1, 0.3],
					'clamp'
				)
			}
		},
		onEnd: (event) => {
			isPressed.value = false
			pressScale.value = withSpring(1)

			// Si swipe vers le bas assez fort, fermer le player
			if (event.translationY > 80 && event.velocityY > 500) {
				// Animation de sortie vers le bas
				translateY.value = withTiming(150, { duration: 300 })
				opacity.value = withTiming(0, { duration: 300 })
				scale.value = withTiming(0.8, { duration: 300 })
				
				// Clear la queue après l'animation
				runOnJS(handleDismissPlayer)()
				return
			}
			
			// Si swipe vers le haut assez fort, ouvrir le player
			if (event.translationY < -50 && event.velocityY < -500) {
				runOnJS(handlePress)()
			}

			// Retour à la position normale
			panX.value = withSpring(0)
			panY.value = withSpring(0)
			opacity.value = withSpring(1)
		},
	})

	// Animated styles
	const containerAnimatedStyle = useAnimatedStyle(() => ({
		transform: [
			{ scale: scale.value * pressScale.value },
			{ translateY: translateY.value + panY.value },
			{ translateX: panX.value },
		],
		opacity: opacity.value,
	}))

	const shadowAnimatedStyle = useAnimatedStyle(() => {
		const shadowOpacity = interpolate(
			pressScale.value,
			[0.95, 1],
			[0.1, 0.3]
		)
		return {
			shadowOpacity,
		}
	})

	// Ne pas afficher le FloatingPlayer si :
	// - Pas de track active ou chargée
	// - On est sur la page PlayerScreen
	if (!activeTrack || !hasLoadedTrack || isOnPlayerScreen) return null

	return (
		<PanGestureHandler onGestureEvent={panGestureHandler}>
			<Animated.View>
				<TapGestureHandler onGestureEvent={tapGestureHandler}>
					<Animated.View
						className={`flex-row items-center p-4 rounded-2xl mx-4 mb-2 ${isDarkColorScheme ? 'bg-gray-900/95' : 'bg-white/95'
							}`}
						style={[
							{
								position: 'absolute',
								left: 8,
								right: 8,
								bottom: bottomOffset,
								zIndex: 1000,
							},
							containerAnimatedStyle,
							shadowAnimatedStyle,
							{
								shadowColor: isDarkColorScheme ? '#000' : '#000',
								shadowOffset: { width: 0, height: 4 },
								shadowRadius: 12,
								elevation: 8,
								backdropFilter: 'blur(20px)',
							}
						]}
					>
						{/* Album Artwork avec animation */}
						<AlbumArtwork
							artwork={activeTrack.artwork}
							isDarkColorScheme={isDarkColorScheme}
						/>

						{/* Track Info */}
						<View className="flex-1 min-w-0 mx-3">
							<MovingText
								text={activeTrack.title || 'Titre inconnu'}
								className="font-semibold text-foreground text-base"
								animationThreshold={25}
							/>
							<Text className="text-muted-foreground text-sm mt-1" numberOfLines={1}>
								{activeTrack.artist || 'Artiste inconnu'}
							</Text>
						</View>

						{/* Player Controls avec animations */}
						<PlayerControlsFloating />
					</Animated.View>
				</TapGestureHandler>
			</Animated.View>
		</PanGestureHandler>
	)
}

// Composant séparé pour l'artwork sans animation
const AlbumArtwork = ({ artwork, isDarkColorScheme }: {
	artwork?: string,
	isDarkColorScheme: boolean
}) => {
	const scale = useSharedValue(0.8)

	useEffect(() => {
		// Animation d'entrée simple
		scale.value = withSpring(1, {
			damping: 15,
			stiffness: 150
		})
	}, [])

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}))

	return (
		<Animated.View
			className="w-14 h-14 rounded-xl overflow-hidden"
			style={animatedStyle}
		>
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
		</Animated.View>
	)
}

// Composant séparé pour les contrôles avec animations et prévention du tap
const PlayerControlsFloating = () => {
	const controlsScale = useSharedValue(1)
	const { playing } = useIsPlaying()

	useEffect(() => {
		controlsScale.value = withSpring(1, {
			damping: 12,
			stiffness: 100
		})
	}, [])

	const controlsAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: controlsScale.value }],
	}))

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

	const handleSkipNext = async () => {
		try {
			await TrackPlayer.skipToNext()
		} catch (error) {
			console.error('Error skipping to next:', error)
		}
	}

	// Gestes pour empêcher la propagation
	const playPauseGestureHandler = useAnimatedGestureHandler({
		onEnd: () => {
			runOnJS(handlePlayPause)()
		},
	})

	const skipGestureHandler = useAnimatedGestureHandler({
		onEnd: () => {
			runOnJS(handleSkipNext)()
		},
	})

	return (
		<Animated.View
			className="flex-row items-center space-x-3"
			style={controlsAnimatedStyle}
		>
			<TapGestureHandler onGestureEvent={playPauseGestureHandler}>
				<Animated.View>
					<TouchableOpacity activeOpacity={0.7}>
						<Ionicons 
							name={playing ? 'pause-circle' : 'play-circle'} 
							size={24}
							className="text-white" 
						/>
					</TouchableOpacity>
				</Animated.View>
			</TapGestureHandler>
			
			<TapGestureHandler onGestureEvent={skipGestureHandler}>
				<Animated.View>
					<TouchableOpacity activeOpacity={0.7}>
						<Ionicons 
							name="play-skip-forward" 
							size={22}
							className="text-white" 
						/>
					</TouchableOpacity>
				</Animated.View>
			</TapGestureHandler>
		</Animated.View>
	)
}