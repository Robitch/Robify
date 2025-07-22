import { useCallback } from 'react'
import {
  useSharedValue,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import { ANIMATION_CONSTANTS } from '@/constants/player'

interface PlayerGestureConfig {
  onDismiss?: () => void
  onOpen?: () => void
  onTrackChange?: (direction: 'next' | 'previous') => void
  isMultiTrack?: boolean
  dismissThreshold?: number
  velocityThreshold?: number
}

export const usePlayerGestures = (config: PlayerGestureConfig = {}) => {
  const {
    onDismiss,
    onOpen,
    onTrackChange,
    isMultiTrack = false,
    dismissThreshold = ANIMATION_CONSTANTS.FLOATING_PLAYER.DISMISS_THRESHOLD_Y,
    velocityThreshold = ANIMATION_CONSTANTS.FLOATING_PLAYER.DISMISS_VELOCITY_Y,
  } = config

  // Animation values
  const translateY = useSharedValue(0)
  const translateX = useSharedValue(0)
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const rotation = useSharedValue(0)
  const glowIntensity = useSharedValue(1)

  // Enhanced dismissal gesture
  const dismissGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(0.96, ANIMATION_CONSTANTS.ELASTIC_CONFIG)
      glowIntensity.value = withTiming(0.7, { duration: 150 })
    },
    onActive: (event) => {
      if (event.translationY > 0 && Math.abs(event.translationX) < 25) {
        translateY.value = event.translationY

        const progress = Math.min(event.translationY / 100, 1)
        
        // Smooth opacity curve
        opacity.value = interpolate(
          progress,
          [0, 0.8, 1],
          [1, 0.6, 0.2],
          Extrapolate.CLAMP
        )
        
        // Scale curve
        scale.value = interpolate(
          progress,
          [0, 1],
          [0.96, 0.8],
          Extrapolate.CLAMP
        )
        
        // Subtle rotation
        rotation.value = interpolate(
          progress,
          [0, 1],
          [0, -3],
          Extrapolate.CLAMP
        )
        
        // Reduce glow during gesture
        glowIntensity.value = interpolate(
          progress,
          [0, 1],
          [0.7, 0.1],
          Extrapolate.CLAMP
        )
      }
    },
    onEnd: (event) => {
      const shouldDismiss = (
        event.translationY > dismissThreshold && 
        event.velocityY > velocityThreshold && 
        Math.abs(event.translationX) < 35
      )

      if (shouldDismiss && onDismiss) {
        // Smooth dismissal animation
        translateY.value = withTiming(150, {
          duration: 350,
          easing: Easing.in(Easing.cubic)
        })
        opacity.value = withTiming(0, { duration: 300 })
        scale.value = withTiming(0.7, { duration: 350 })
        rotation.value = withTiming(-8, { duration: 350 })
        glowIntensity.value = withTiming(0, { duration: 200 })

        setTimeout(() => {
          runOnJS(onDismiss)()
        }, 100)
      } else {
        // Elastic bounce back
        const springConfig = ANIMATION_CONSTANTS.SPRING_CONFIG
        
        translateY.value = withSpring(0, springConfig)
        opacity.value = withSpring(1, springConfig)
        scale.value = withSpring(1, springConfig)
        rotation.value = withSpring(0, springConfig)
        glowIntensity.value = withSpring(1, springConfig)
      }
    },
  })

  // Track swipe gesture (horizontal)
  const trackSwipeHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      if (isMultiTrack && Math.abs(event.translationY) < 20) {
        translateX.value = event.translationX

        // Reduce opacity during swipe
        const progress = Math.abs(event.translationX) / 100
        opacity.value = interpolate(
          progress,
          [0, 1],
          [1, 0.7],
          Extrapolate.CLAMP
        )
      }
    },
    onEnd: (event) => {
      if (!isMultiTrack || !onTrackChange) {
        translateX.value = withSpring(0)
        opacity.value = withSpring(1)
        return
      }

      const threshold = 80
      const velocity = 800
      const isPrimarilyHorizontal = Math.abs(event.translationX) > Math.abs(event.translationY) * 2

      if (isPrimarilyHorizontal) {
        if (event.translationX > threshold || event.velocityX > velocity) {
          // Swipe right -> previous track
          translateX.value = withTiming(300, { duration: 200 })
          opacity.value = withTiming(0, { duration: 200 })
          
          setTimeout(() => {
            runOnJS(onTrackChange)('previous')
          }, 150)
        } else if (event.translationX < -threshold || event.velocityX < -velocity) {
          // Swipe left -> next track
          translateX.value = withTiming(-300, { duration: 200 })
          opacity.value = withTiming(0, { duration: 200 })
          
          setTimeout(() => {
            runOnJS(onTrackChange)('next')
          }, 150)
        } else {
          // Return to normal position
          translateX.value = withSpring(0)
          opacity.value = withSpring(1)
        }
      } else {
        // Return to normal position
        translateX.value = withSpring(0)
        opacity.value = withSpring(1)
      }
    },
  })

  // Tap gesture with haptic feedback
  const tapHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(0.94, { damping: 25, stiffness: 200 })
    },
    onEnd: () => {
      scale.value = withSequence(
        withSpring(1.02, { damping: 15, stiffness: 200 }),
        withSpring(1, ANIMATION_CONSTANTS.SPRING_CONFIG)
      )
      
      if (onOpen) {
        runOnJS(onOpen)()
      }
    },
    onFail: () => {
      scale.value = withSpring(1, ANIMATION_CONSTANTS.SPRING_CONFIG)
    },
  })

  // Reset all animations
  const resetAnimations = useCallback(() => {
    translateX.value = withSpring(0)
    translateY.value = withSpring(0)
    scale.value = withSpring(1)
    opacity.value = withSpring(1)
    rotation.value = withSpring(0)
    glowIntensity.value = withSpring(1)
  }, [translateX, translateY, scale, opacity, rotation, glowIntensity])

  return {
    // Animation values
    translateY,
    translateX,
    scale,
    opacity,
    rotation,
    glowIntensity,
    
    // Gesture handlers
    dismissGestureHandler,
    trackSwipeHandler,
    tapHandler,
    
    // Utility functions
    resetAnimations,
  }
}