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
            // await TrackPlayer.setupPlayer();
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
            // Ensure TrackPlayer is set up before trying to play
            const state = await TrackPlayer.getState();
            console.log('TrackPlayer state:', state);

            if (currentTrack?.url === track.file_url) {
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
                    url: track.file_url,
                    title: track.title,
                    artist: track.user_profiles?.full_name || 'Unknown Artist',
                    artwork: track.artwork_url,
                });
                await TrackPlayer.play();
                setIsPlaying(true);
                setCurrentTrack({
                    ...track,
                    url: track.file_url
                });
            }
        } catch (error) {
            console.error('Error playing track:', error);
        }
    }


    return (
        <View className="flex-row items-center gap-2 p-3 bg-card rounded-lg">
            <View className="flex-1">
                <Text className="font-semibold text-foreground">{item.title}</Text>
                <Text className="text-sm text-muted-foreground">
                    {item.user_profiles?.full_name || 'Unknown Artist'}
                </Text>
            </View>
            <Button onPress={() => playTrack(item)}>
                <Text>{currentTrack?.url === item.file_url && isPlaying ? 'Pause' : 'Play'}</Text>
            </Button>
            <TouchableOpacity onPress={onRemoveMusic}>
                <Ionicons name="trash-outline" size={20} className="text-foreground" />
            </TouchableOpacity>
        </View>
    );
}
