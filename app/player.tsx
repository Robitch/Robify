import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAudioStore } from '@/store/audio';
import { Play, Pause, FastForward, Rewind, Shuffle, Repeat } from '@/lib/icons';
import { getColors } from 'react-native-image-colors'
import { IOSImageColors } from 'react-native-image-colors/build/types'



export default function Player() {
    const { currentTrack, isPlaying, position, duration, play, pause, nextTrack } = useAudioStore();
    const progress = duration > 0 ? (position / duration) * 100 : 0;
    const [colors, setColors] = useState<IOSImageColors | null>(null);

    useEffect(() => {
        getColors(currentTrack?.url || '').then((colors) => {
            if ('background' in colors) {
                setColors(colors as IOSImageColors);
            }
        });
    }, [currentTrack]);

    return (
        <View className="flex-1 bg-black p-6">
            {/* Image de l'album */}
            <Image
                source={currentTrack?.url}
                style={{ width: '100%', height: 300, borderRadius: 10 }}
            />

            {/* Infos de la musique */}
            <Text className="text-white text-xl font-bold mt-4">{currentTrack?.title || 'Unknown'}</Text>
            <Text className="text-white text-md opacity-70">{currentTrack?.author || 'Unknown Artist'}</Text>

            {/* Barre de progression */}
            <Progress className="w-full my-4" value={progress} max={100} />

            {/* Boutons de contrôle */}
            <View className="flex-row justify-center items-center gap-4">
                <TouchableOpacity><Shuffle className="text-white opacity-70" /></TouchableOpacity>
                <TouchableOpacity onPress={() => { }}><Rewind className="text-white" /></TouchableOpacity>
                <Button onPress={isPlaying ? pause : play}>
                    {isPlaying ? <Pause className="text-white" /> : <Play className="text-white" />}
                </Button>
                <TouchableOpacity onPress={nextTrack}><FastForward className="text-white" /></TouchableOpacity>
                <TouchableOpacity><Repeat className="text-white opacity-70" /></TouchableOpacity>
            </View>
        </View>
    );
}
