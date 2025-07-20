import React from 'react';
import { View, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Track } from '~/types';
import TrackPlayer, { useActiveTrack, useIsPlaying } from 'react-native-track-player';
import { Image } from 'expo-image';
import { useColorScheme } from '~/lib/useColorScheme';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface MusicItemProps {
    item: Track;
    onRemoveMusic: () => void;
    showArtwork?: boolean;
    compact?: boolean;
}

export default function MusicItem({
    item,
    onRemoveMusic,
    showArtwork = true,
    compact = false,
}: MusicItemProps) {
    const { isDarkColorScheme } = useColorScheme();
    const activeTrack = useActiveTrack();
    const { playing } = useIsPlaying();
    
    // States pour animations
    const scale = useSharedValue(1);
    const playButtonScale = useSharedValue(1);
    
    // Vérifier si cette track est celle qui joue actuellement
    const isCurrentTrack = activeTrack?.url === item.file_url;
    const isPlaying = isCurrentTrack && playing;

    // Animations
    const itemAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const playButtonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: playButtonScale.value }],
    }));

    const playTrack = async (track: Track) => {
        try {
            // Animation du bouton
            playButtonScale.value = withSpring(0.8, { damping: 15 }, () => {
                playButtonScale.value = withSpring(1, { damping: 15 });
            });

            // Vérifier l'état actuel
            const currentActiveTrack = await TrackPlayer.getCurrentTrack();
            const state = await TrackPlayer.getState();
            
            // Si c'est la même track, juste pause/play
            if (currentActiveTrack !== null) {
                const currentTrackData = await TrackPlayer.getTrack(currentActiveTrack);
                if (currentTrackData?.url === track.file_url) {
                    if (state === 'playing') {
                        await TrackPlayer.pause();
                    } else {
                        await TrackPlayer.play();
                    }
                    return;
                }
            }
            
            // Sinon, charger la nouvelle track
            await TrackPlayer.reset();
            await TrackPlayer.add({
                id: track.id,
                url: track.file_url,
                title: track.title,
                artist: track.user_profiles?.full_name || 'Unknown Artist',
                artwork: track.artwork_url,
            });
            await TrackPlayer.play();
            
        } catch (error) {
            console.error('Error playing track:', error);
        }
    };

    const handlePress = () => {
        scale.value = withSpring(0.98, { damping: 15 }, () => {
            scale.value = withSpring(1, { damping: 15 });
        });
        playTrack(item);
    };

    const containerPadding = compact ? 'p-3' : 'p-4';
    const artworkSize = compact ? 'w-12 h-12' : 'w-16 h-16';

    return (
        <Animated.View style={itemAnimatedStyle}>
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.7}
                className={`${containerPadding} rounded-2xl ${
                    isCurrentTrack 
                        ? (isDarkColorScheme ? 'bg-emerald-900/40' : 'bg-emerald-50')
                        : (isDarkColorScheme ? 'bg-gray-800/60' : 'bg-white/80')
                } shadow-sm border ${
                    isCurrentTrack 
                        ? 'border-emerald-500/30' 
                        : (isDarkColorScheme ? 'border-gray-700/50' : 'border-gray-200/50')
                }`}
            >
                <View className="flex-row items-center">
                    {/* Artwork */}
                    {showArtwork && (
                        <View className={`${artworkSize} rounded-xl overflow-hidden mr-4`}>
                            {item.artwork_url ? (
                                <Image
                                    source={{ uri: item.artwork_url }}
                                    className="w-full h-full"
                                    contentFit="cover"
                                />
                            ) : (
                                <View className={`w-full h-full ${
                                    isDarkColorScheme ? 'bg-gray-700' : 'bg-gray-200'
                                } items-center justify-center`}>
                                    <Ionicons 
                                        name="musical-note" 
                                        size={compact ? 16 : 20} 
                                        className="text-muted-foreground" 
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    {/* Track Info */}
                    <View className="flex-1 min-w-0 mr-3">
                        <Text 
                            className={`${compact ? 'text-base' : 'text-lg'} font-bold mb-1 ${
                                isCurrentTrack ? 'text-emerald-600' : 'text-foreground'
                            }`}
                            numberOfLines={1}
                        >
                            {item.title}
                        </Text>
                        <Text 
                            className={`${compact ? 'text-xs' : 'text-sm'} ${
                                isCurrentTrack ? 'text-emerald-500' : 'text-muted-foreground'
                            }`}
                            numberOfLines={1}
                        >
                            {item.user_profiles?.full_name || 'Unknown Artist'}
                        </Text>
                    </View>

                    {/* Play/Pause Button */}
                    <Animated.View style={playButtonAnimatedStyle}>
                        <TouchableOpacity
                            onPress={() => playTrack(item)}
                            className={`w-12 h-12 rounded-full items-center justify-center ${
                                isCurrentTrack 
                                    ? 'bg-emerald-500' 
                                    : (isDarkColorScheme ? 'bg-gray-700' : 'bg-gray-100')
                            }`}
                            activeOpacity={0.8}
                        >
                            <Ionicons 
                                name={isPlaying ? "pause" : "play"} 
                                size={20} 
                                className={isCurrentTrack ? "text-white" : "text-foreground"}
                                style={{ marginLeft: isPlaying ? 0 : 2 }}
                            />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* More Options */}
                    <TouchableOpacity
                        onPress={onRemoveMusic}
                        className="w-10 h-10 items-center justify-center ml-2"
                        activeOpacity={0.7}
                    >
                        <Ionicons 
                            name="ellipsis-horizontal" 
                            size={18} 
                            className="text-muted-foreground" 
                        />
                    </TouchableOpacity>
                </View>

            </TouchableOpacity>
        </Animated.View>
    );
}
