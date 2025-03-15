import { create } from 'zustand';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import MusicControl from 'react-native-music-control';

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
                title: 'Billie Jean',
                artwork: 'https://i.imgur.com/e1cpwdo.png', // URL or RN's image require()
                artist: 'Michael Jackson',
                album: 'Thriller',
                genre: 'Post-disco, Rhythm and Blues, Funk, Dance-pop',
                duration: 294, // (Seconds)
                description: '', // Android Only
                color: 0xffffff, // Android Only - Notification Color
                colorized: true, // Android 8+ Only - Notification Color extracted from the artwork. Set to false to use the color property instead
                date: '1983-01-02T00:00:00Z', // Release Date (RFC 3339) - Android Only
                rating: 84, // Android Only (Boolean or Number depending on the type)
                notificationIcon: 'my_custom_icon', // Android Only (String), Android Drawable resource name for a custom notification icon
                isLiveStream: true, // iOS Only (Boolean), Show or hide Live Indicator instead of seekbar on lock screen for live streams. Default value is false.
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