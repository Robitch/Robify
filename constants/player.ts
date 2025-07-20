// Player and Animation Constants
export const ANIMATION_CONSTANTS = {
  FLOATING_PLAYER: {
    BOTTOM_OFFSET_TABS: 78,
    BOTTOM_OFFSET_DEFAULT: 16,
    DISMISS_THRESHOLD_Y: 80,
    DISMISS_VELOCITY_Y: 500,
    OPEN_THRESHOLD_Y: -50,
    OPEN_VELOCITY_Y: -500,
    SHADOW_OPACITY_MIN: 0.1,
    SHADOW_OPACITY_MAX: 0.3,
    CACHE_SIZE_MB: 10,
  },
  SPRING_CONFIG: {
    DAMPING: 15,
    STIFFNESS: 150,
    MASS: 1,
  },
  TIMING_CONFIG: {
    ENTRANCE_DURATION: 300,
    EXIT_DURATION: 200,
  }
} as const;

export const AUDIO_CONSTANTS = {
  CACHE_SIZE: 1024 * 10, // 10MB
  DEFAULT_VOLUME: 0.3,
  SUPPORTED_FORMATS: [
    'audio/mpeg',  // MP3
    'audio/wav',   // WAV
    'audio/flac',  // FLAC
  ],
  MAX_FILE_SIZE_MB: 50,
} as const;

export const UI_CONSTANTS = {
  CONTENT_PADDING_BOTTOM: 120, // Space for floating player + tabs
  MOVING_TEXT_THRESHOLD: 25,
  NOTIFICATION_ICON: 'notification_icon',
} as const;