import { FileObject } from '@supabase/storage-js';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAudioStore } from '@/store/audio';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function MusicItem({
    item,
    userId,
    onRemoveMusic,
}: {
    item: FileObject;
    userId: string;
    onRemoveMusic: () => void;
}) {
    const { loadTrack, play, pause, currentTrack, isPlaying } = useAudioStore();
    const [musicUrl, setMusicUrl] = useState<string>('');

    useEffect(() => {
        const getMusicUrl = async () => {
            const { data } = await supabase.storage.from('files').getPublicUrl(item.name);
            setMusicUrl(data.publicUrl);
        };
        getMusicUrl();
    }, [item.name]);

    async function handlePlayPause() {
        if (currentTrack?.url === musicUrl && isPlaying) {
            pause();
        } else {
            console.log('musicUrl', item);
            await loadTrack({ url: musicUrl, title: item.name, author: 'Unknown' });
            play();
        }
    }

    return (
        <View className="flex-row items-center gap-2">
            <Text className="flex-1">{item.name}</Text>
            <Button onPress={handlePlayPause}>
                <Text>{currentTrack?.url === musicUrl && isPlaying ? 'Pause' : 'Play'}</Text>
            </Button>
            <TouchableOpacity onPress={onRemoveMusic}>
                <Ionicons name="trash-outline" size={20} color={'#fff'} />
            </TouchableOpacity>
        </View>
    );
}
