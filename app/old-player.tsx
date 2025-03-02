import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAudioStore } from '@/store/audio';
import { Play, Pause, FastForward, Rewind, Shuffle, Repeat, ChevronDown } from '@/lib/icons';
import { getImageColors, cn } from '@/lib/utils';
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router';
import TrackSlider from '~/components/TrackSlider';




export default function Player() {
    const { currentTrack, isPlaying, position, duration, play, pause, nextTrack } = useAudioStore();
    const progress = duration > 0 ? (position / duration) * 100 : 0;
    const [colors, setColors] = useState<string[]>(["#000", "#fff"]);

    useEffect(() => {
        const getColors = async () => {
            if (!currentTrack) return;
            const colors = await getImageColors(currentTrack.url);
            setColors(colors);
        }
        getColors();

    }, [currentTrack]);

    const handleClose = () => {
        router.back();
    }

    const formatTime = (time: number) => {
        // Convertir le temps (millisecondes) en minutes et secondes
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    return (
        <LinearGradient colors={colors as [string, string, string, string]} className="flex-1 p-6 justify-between">
            {/* Close button */}
            <View>
                <Button className="w-12 rounded-full" variant="default" onPress={handleClose}><ChevronDown size={28} className="text-foreground" /></Button>
            </View>

            <View className="flex-1 justify-center items-center">
                {/* Image de l'album */}
                <Image
                    source={currentTrack?.url}
                    style={{ width: '100%', height: 300, borderRadius: 10 }}
                />

                {/* Infos de la musique */}
                <Text className="text-white text-xl font-bold mt-4">{currentTrack?.title || 'Unknown'}</Text>
                <Text className="text-white text-md opacity-70">{currentTrack?.author || 'Unknown Artist'}</Text>

                {/* Barre de progression avec les temps */}
                <View className="w-full">
                    {/* <Progress className="w-full my-4" value={progress} max={100} /> */}
                    <TrackSlider />
                    <View className="flex-row justify-between">
                        <Text className="text-white text-sm opacity-70">{formatTime(position)}</Text>
                        <Text className="text-white text-sm opacity-70">{formatTime(duration)}</Text>
                    </View>
                </View>

                {/* Boutons de contrôle */}
                <View className="flex-row justify-between items-center w-full">
                    <TouchableOpacity><Shuffle className="text-white opacity-70" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => { }}><Rewind className="text-white" /></TouchableOpacity>
                    <Button onPress={isPlaying ? pause : play}>
                        {isPlaying ? <Pause className="text-white" /> : <Play className="text-white" />}
                    </Button>
                    <TouchableOpacity onPress={nextTrack}><FastForward className="text-white" /></TouchableOpacity>
                    <TouchableOpacity><Repeat className="text-white opacity-70" /></TouchableOpacity>
                </View>
                {/* <View className="flex-row gap-2 flex-wrap">
                {colors.map((color, index) => (
                    <ColoredSquare key={index} color={color} />
                ))}
            </View> */}
            </View>
        </LinearGradient >
    );
}

const ColoredSquare = ({ color }: { color: string }) => {
    return <View className="w-20 h-20 rounded-md" style={{ backgroundColor: color }} />
}
