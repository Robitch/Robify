import { create } from 'zustand';
import { Audio, AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

// Type pour les pistes
interface Track {
    url: string;
    title: string;
    author: string;
    album?: string;
}

// Interface pour le store
interface AudioStore {
    sound: Audio.Sound | null;
    currentTrack: Track | null;
    isPlaying: boolean;
    position: number;
    duration: number;
    queue: Track[];
    loadTrack: (track: Track) => Promise<void>;
    onPlaybackStatusUpdate: (status: AVPlaybackStatus) => void;
    play: () => Promise<void>;
    pause: () => Promise<void>;
    nextTrack: () => Promise<void>;
    addToQueue: (track: Track) => void;
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

export const useAudioStore = create<AudioStore>((set, get) => ({
    sound: null,
    currentTrack: null,
    isPlaying: false,
    position: 0,
    duration: 0,
    queue: [],

    loadTrack: async (track) => {
        if (get().sound) {
            await get().sound?.unloadAsync();
        }

        const { sound } = await Audio.Sound.createAsync(
            { uri: track.url },
            { shouldPlay: false },
            get().onPlaybackStatusUpdate
        );

        set({ sound, currentTrack: { ...track, url: "https://picsum.photos/1000/1100" }, position: 0, duration: 0 });
    },

    onPlaybackStatusUpdate: (status) => {
        if (status.isLoaded) {
            set({
                isPlaying: status.isPlaying,
                position: status.positionMillis,
                duration: status.durationMillis,
            });
        }
    },

    play: async () => {
        const sound = get().sound;
        if (sound) {
            await sound.playAsync();
            set({ isPlaying: true });
        }
    },

    pause: async () => {
        const sound = get().sound;
        if (sound) {
            await sound.pauseAsync();
            set({ isPlaying: false });
        }
    },

    nextTrack: async () => {
        const queue = get().queue;
        if (queue.length > 0) {
            const [next, ...rest] = queue;
            set({ queue: rest });
            await get().loadTrack(next);
            get().play();
        }
    },

    addToQueue: (track) => {
        set((state) => ({ queue: [...state.queue, track] }));
    },
}));
