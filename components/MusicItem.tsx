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

export default function MusicItem({
    item,
    // userId,
    onRemoveMusic,
}: {
    item: Track;
    // userId: string;
    onRemoveMusic: () => void;
}) {
    const { playTrack } = usePlayerStore();
    

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
