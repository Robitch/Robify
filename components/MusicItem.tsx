import { FileObject } from '@supabase/storage-js';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
// import { useAudioStore } from '@/store/audio';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Track } from '~/types';
import { usePlayerStore } from '~/store/playerStore';
import TrackPlayer from 'react-native-track-player';

export default function MusicItem({
    item,
    // userId,
    onRemoveMusic,
}: {
    item: Track;
    // userId: string;
    onRemoveMusic: () => void;
}) {
    // const { playTrack } = usePlayerStore();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [musicUrl, setMusicUrl] = useState('');

    useEffect(() => {
        const fetchCurrentTrack = async () => {
            await TrackPlayer.setupPlayer();
            const currentTrack = await TrackPlayer.getCurrentTrack();
            if (currentTrack) {
                const track = await TrackPlayer.getTrack(currentTrack);
                setCurrentTrack(track);
            }
        };

        fetchCurrentTrack();
    }, []);

    const playTrack = async (track: Track) => {
        try {
            if (currentTrack?.url === track.url) {
                if (isPlaying) {
                    await TrackPlayer.pause();
                } else {
                    await TrackPlayer.play();
                }
                setIsPlaying(!isPlaying);
            } else {
                await TrackPlayer.reset();
                await TrackPlayer.add({
                    id: track.id,
                    url: track.url,
                    title: track.title,
                    artist: track.artists[0].name,
                    artwork: track.artwork,
                });
                await TrackPlayer.play();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Error playing track:', error);
        }
    }


    return (
        <View className="flex-row items-center gap-2">
            <Text className="flex-1">{item.title}</Text>
            <Button onPress={() => playTrack(item)}>
                {/* <Text>{currentTrack?.url === musicUrl && isPlaying ? 'Pause' : 'Play'}</Text> */}
            </Button>
            <TouchableOpacity onPress={onRemoveMusic}>
                <Ionicons name="trash-outline" size={20} className="text-foreground" />
            </TouchableOpacity>
        </View>
    );
}
