import { useEffect, useRef } from 'react'
import TrackPlayer, { Capability, RatingType, RepeatMode } from 'react-native-track-player'
import { AUDIO_CONSTANTS } from '@/constants/player'
import { usePlayerWithTracking } from './usePlayerWithTracking'

const setupPlayer = async () => {
	try {
		// Vérifier si TrackPlayer est déjà configuré
		const state = await TrackPlayer.getPlaybackState();
		console.log('🎵 TrackPlayer already initialized, skipping setup');
		
		// Même si déjà initialisé, on peut mettre à jour les options
		await TrackPlayer.updateOptions({
			ratingType: RatingType.Heart,
			capabilities: [
				Capability.Play,
				Capability.Pause,
				Capability.SkipToNext,
				Capability.SkipToPrevious,
				Capability.Stop,
			],
		})
		
		await TrackPlayer.setVolume(AUDIO_CONSTANTS.DEFAULT_VOLUME)
		await TrackPlayer.setRepeatMode(RepeatMode.Queue)
		
	} catch (error) {
		// Si getPlaybackState échoue, c'est que TrackPlayer n'est pas encore initialisé
		console.log('🎵 Initializing TrackPlayer for the first time');
		
		await TrackPlayer.setupPlayer({
			maxCacheSize: AUDIO_CONSTANTS.CACHE_SIZE,
		})

		await TrackPlayer.updateOptions({
			ratingType: RatingType.Heart,
			capabilities: [
				Capability.Play,
				Capability.Pause,
				Capability.SkipToNext,
				Capability.SkipToPrevious,
				Capability.Stop,
			],
		})

		await TrackPlayer.setVolume(AUDIO_CONSTANTS.DEFAULT_VOLUME)
		await TrackPlayer.setRepeatMode(RepeatMode.Queue)
	}
}

// Variable globale pour éviter l'initialisation multiple entre les composants
let globalTrackPlayerInitialized = false;

export const useSetupTrackPlayer = ({ onLoad }: { onLoad?: () => void }) => {
	const isInitialized = useRef(false)
	
	// Initialiser le tracking automatiquement
	const trackingHook = usePlayerWithTracking()

	useEffect(() => {
		if (isInitialized.current || globalTrackPlayerInitialized) {
			console.log('🎵 TrackPlayer setup skipped (already initialized)');
			onLoad?.();
			return;
		}

		console.log('🎵 Starting TrackPlayer setup...');

		setupPlayer()
			.then(() => {
				isInitialized.current = true
				globalTrackPlayerInitialized = true
				console.log('🎵 TrackPlayer setup completed successfully')
				onLoad?.()
			})
			.catch((error) => {
				isInitialized.current = false
				globalTrackPlayerInitialized = false
				console.error('TrackPlayer setup error:', error)
			})
	}, [onLoad])
}
