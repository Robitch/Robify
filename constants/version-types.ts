import { VersionType } from '~/types';

export const VERSION_TYPES = [
  { value: VersionType.DEMO, label: 'Demo', icon: 'create-outline' },
  { value: VersionType.ROUGH_MIX, label: 'Rough Mix', icon: 'build-outline' },
  { value: VersionType.FINAL_MIX, label: 'Final Mix', icon: 'checkmark-circle-outline' },
  { value: VersionType.REMASTER, label: 'Remaster', icon: 'diamond-outline' },
  { value: VersionType.REMIX, label: 'Remix', icon: 'shuffle-outline' },
  { value: VersionType.RADIO_EDIT, label: 'Radio Edit', icon: 'radio-outline' },
  { value: VersionType.EXTENDED_MIX, label: 'Extended Mix', icon: 'time-outline' },
  { value: VersionType.LIVE, label: 'Live', icon: 'mic-outline' },
  { value: VersionType.ACOUSTIC, label: 'Acoustic', icon: 'musical-note-outline' },
  { value: VersionType.INSTRUMENTAL, label: 'Instrumental', icon: 'piano-outline' },
];

export const ACCEPTED_AUDIO_TYPES = [
  'audio/mpeg',  // MP3
  'audio/wav',   // WAV
  'audio/flac',  // FLAC
  'audio/m4a',   // M4A
];

export const VERSION_TYPE_COLORS = {
  [VersionType.DEMO]: '#f59e0b',
  [VersionType.ROUGH_MIX]: '#8b5cf6',
  [VersionType.FINAL_MIX]: '#10b981',
  [VersionType.REMASTER]: '#06b6d4',
  [VersionType.REMIX]: '#ec4899',
  [VersionType.RADIO_EDIT]: '#f97316',
  [VersionType.EXTENDED_MIX]: '#3b82f6',
  [VersionType.LIVE]: '#ef4444',
  [VersionType.ACOUSTIC]: '#84cc16',
  [VersionType.INSTRUMENTAL]: '#6366f1',
};

export const VERSION_TYPE_ICONS = {
  [VersionType.DEMO]: 'create-outline',
  [VersionType.ROUGH_MIX]: 'build-outline',
  [VersionType.FINAL_MIX]: 'checkmark-circle-outline',
  [VersionType.REMASTER]: 'diamond-outline',
  [VersionType.REMIX]: 'shuffle-outline',
  [VersionType.RADIO_EDIT]: 'radio-outline',
  [VersionType.EXTENDED_MIX]: 'time-outline',
  [VersionType.LIVE]: 'mic-outline',
  [VersionType.ACOUSTIC]: 'musical-note-outline',
  [VersionType.INSTRUMENTAL]: 'piano-outline',
};