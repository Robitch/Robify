// Enhanced Player and Animation Constants
export const ANIMATION_CONSTANTS = {
  FLOATING_PLAYER: {
    BOTTOM_OFFSET_TABS: 78,
    BOTTOM_OFFSET_DEFAULT: 16,
    DISMISS_THRESHOLD_Y: 70,
    DISMISS_VELOCITY_Y: 400,
    OPEN_THRESHOLD_Y: -50,
    OPEN_VELOCITY_Y: -500,
    SHADOW_OPACITY_MIN: 0.2,
    SHADOW_OPACITY_MAX: 0.4,
    CACHE_SIZE_MB: 10,
  },
  SPRING_CONFIG: {
    damping: 20,
    stiffness: 120,
    mass: 0.8,
  },
  ELASTIC_CONFIG: {
    damping: 15,
    stiffness: 150,
    mass: 0.6,
  },
  MORPH_CONFIG: {
    duration: 500,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  TRANSITION: {
    MORPH_DURATION: 500,
    CONTENT_DELAY: 200,
    SPRING_DAMPING: 20,
    SPRING_STIFFNESS: 100,
    ENTRANCE_DURATION: 400,
    EXIT_DURATION: 300,
  }
} as const;

export const AUDIO_CONSTANTS = {
  CACHE_SIZE: 1024 * 10, // 10MB
  DEFAULT_VOLUME: 1.0,
  SUPPORTED_FORMATS: [
    'audio/mpeg',  // MP3
    'audio/wav',   // WAV
    'audio/flac',  // FLAC
  ],
  MAX_FILE_SIZE_MB: 50,
} as const;

export const UI_CONSTANTS = {
  CONTENT_PADDING_BOTTOM: 130, // Space for mini player + tabs (60 + 70)
  MINI_PLAYER_HEIGHT: 60, // Hauteur du mini player
  MOVING_TEXT_THRESHOLD: 25,
  NOTIFICATION_ICON: 'notification_icon',
} as const;