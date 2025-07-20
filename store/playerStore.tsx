import { create } from 'zustand';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import MusicControl from 'react-native-music-control';
import { UI_CONSTANTS } from '@/constants/player';

interface Track {
    id: string;
    title: string;
    artist: string;
    file_url: string;
    artwork?: string;
}

interface PlayerStore {
    currentTrack: Track | null;
    isPlaying: boolean;
    sound: Audio.Sound | null;
    queue: Track[];
    isRepeat: boolean;
    isShuffle: boolean;
    playTrack: (track: Track) => Promise<void>;
    togglePlayPause: () => Promise<void>;
    setQueue: (tracks: Track[]) => void;
    playNext: () => Promise<void>;
    playPrevious: () => Promise<void>;
    toggleRepeat: () => void;
    toggleShuffle: () => void;
}


// Mode audio
const audioMode = {
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    interruptionModeIOS: InterruptionModeIOS.DuckOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: true,
}
Audio.setAudioModeAsync(audioMode);

export const usePlayerStore = create<PlayerStore>((set, get) => ({
    currentTrack: null,
    isPlaying: false,
    sound: null,
    queue: [],
    isRepeat: false,
    isShuffle: false,

    playTrack: async (track) => {
        const { sound: currentSound } = get();

        try {
            if (currentSound) {
                await currentSound.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: track.file_url },
                { shouldPlay: true }
            );

            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.isLoaded && status.didJustFinish) {
                    const { isRepeat, queue, playNext } = get();
                    if (isRepeat) {
                        await sound.replayAsync();
                    } else if (queue.length > 0) {
                        await playNext();
                    }
                }
            });

            MusicControl.setNowPlaying({
                title: track.title,
                artwork: track.artwork || '',
                artist: track.artist,
                album: '',
                genre: '',
                duration: 0,
                description: '',
                color: 0xffffff,
                colorized: true,
                date: new Date().toISOString(),
                rating: false,
                notificationIcon: UI_CONSTANTS.NOTIFICATION_ICON,
                isLiveStream: false,
            })
            set({ currentTrack: track, sound, isPlaying: true });
        } catch (error) {
            console.error('Error playing track:', error);
        }
    },

    togglePlayPause: async () => {
        const { sound, isPlaying } = get();

        if (!sound) return;

        if (isPlaying) {
            await sound.pauseAsync();
        } else {
            await sound.playAsync();
        }

        set({ isPlaying: !isPlaying });
    },

    setQueue: (tracks) => set({ queue: tracks }),

    playNext: async () => {
        const { queue, currentTrack, isShuffle, playTrack } = get();
        if (queue.length === 0) return;

        let nextTrackIndex = 0;
        if (currentTrack) {
            const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
            if (isShuffle) {
                nextTrackIndex = Math.floor(Math.random() * queue.length);
            } else {
                nextTrackIndex = (currentIndex + 1) % queue.length;
            }
        }

        await playTrack(queue[nextTrackIndex]);
    },

    playPrevious: async () => {
        const { queue, currentTrack, playTrack } = get();
        if (queue.length === 0 || !currentTrack) return;

        const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
        const previousIndex = (currentIndex - 1 + queue.length) % queue.length;

        await playTrack(queue[previousIndex]);
    },

    toggleRepeat: () => set(state => ({ isRepeat: !state.isRepeat })),

    toggleShuffle: () => set(state => ({ isShuffle: !state.isShuffle })),

    setPositionAsync: async (position: number) => {
        const sound = get().sound;
        if (sound) {
            await sound.setPositionAsync(position);
        }
    }
}));