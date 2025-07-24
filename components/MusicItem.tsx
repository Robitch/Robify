import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Track, TrackVersion, VersionType } from '~/types';
import TrackPlayer, { useActiveTrack, useIsPlaying } from 'react-native-track-player';
import { Image } from 'expo-image';
import { useColorScheme } from '~/lib/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    FadeInDown,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface MusicItemProps {
    item: Track;
    onRemoveMusic?: () => void;
    showArtwork?: boolean;
    variant?: 'default' | 'compact' | 'card';
    index?: number;
    onPress?: (track: Track) => void;
}


export default function MusicItem({
    item,
    onRemoveMusic,
    showArtwork = true,
    variant = 'default',
    index = 0,
    onPress,
}: MusicItemProps) {
    const { isDarkColorScheme } = useColorScheme();
    const activeTrack = useActiveTrack();
    const { playing } = useIsPlaying();

    // States pour animations
    const scale = useSharedValue(1);

    // Vérifier si cette track est celle qui joue actuellement
    const isCurrentTrack = activeTrack?.url === item.file_url;
    const isPlaying = isCurrentTrack && playing;

    // Fonction pour générer un gradient basé sur le titre
    const getTrackGradient = (title: string) => {
        const gradients = [
            ['#667eea', '#764ba2'],
            ['#f093fb', '#f5576c'],
            ['#4facfe', '#00f2fe'],
            ['#43e97b', '#38f9d7'],
            ['#fa709a', '#fee140'],
            ['#a8edea', '#fed6e3'],
        ];

        const hash = title.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);

        return gradients[Math.abs(hash) % gradients.length];
    };

    // Animation style
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.98);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const handlePress = () => {
        if (onPress) {
            onPress(item);
        } else {
            playTrack(item);
        }
    };

    const playTrack = async (track: Track) => {
        try {
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
                artist: track.user_profiles?.username || 'Unknown Artist',
                artwork: track.artwork_url ?? undefined,
                duration: track.duration || 0,
            });
            await TrackPlayer.play();

        } catch (error) {
            console.error('Error playing track:', error);
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds || seconds <= 0) return '';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Variantes de design
    if (variant === 'card') {
        const gradientColors = getTrackGradient(item.title);

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 100).springify()}
                style={animatedStyle}
            >
                <TouchableOpacity
                    onPress={handlePress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={1}
                    className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-4"
                >
                    {/* Header avec gradient */}
                    <LinearGradient
                        colors={gradientColors as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="h-3"
                    />

                    <View className="p-4">
                        <View className="flex-row items-center">
                            {/* Artwork */}
                            {showArtwork && (
                                <View className="w-16 h-16 rounded-2xl overflow-hidden mr-4">
                                    {item.artwork_url ? (
                                        <Image
                                            source={{ uri: item.artwork_url }}
                                            style={{ width: '100%', height: '100%' }}
                                            contentFit="cover"
                                        />
                                    ) : (
                                        <LinearGradient
                                            colors={gradientColors as [string, string]}
                                            className="w-full h-full items-center justify-center"
                                        >
                                            <Ionicons name="musical-notes" size={24} color="white" />
                                        </LinearGradient>
                                    )}
                                </View>
                            )}

                            {/* Track Info */}
                            <View className="flex-1">
                                <Text
                                    className={`text-lg font-bold mb-1 ${isCurrentTrack ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}
                                    numberOfLines={1}
                                >
                                    {item.title}
                                </Text>
                                <Text
                                    className={`text-sm ${isCurrentTrack ? 'text-green-500 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}
                                    numberOfLines={1}
                                >
                                    @{item.user_profiles?.username || 'Unknown Artist'}
                                </Text>
                                {item.duration && item.duration > 0 && (
                                    <Text className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        {formatDuration(item.duration)}
                                    </Text>
                                )}
                            </View>

                            {/* Play Button */}
                            <View
                                className="w-12 h-12 rounded-2xl items-center justify-center"
                                style={{ backgroundColor: `${gradientColors[0]}20` }}
                            >
                                <Ionicons
                                    name={isPlaying ? "pause" : "play"}
                                    size={20}
                                    color={gradientColors[0]}
                                    style={{ marginLeft: isPlaying ? 0 : 2 }}
                                />
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    if (variant === 'compact') {
        return (
            <Animated.View style={animatedStyle}>
                <TouchableOpacity
                    onPress={handlePress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={1}
                    className="flex-row items-center py-2"
                >
                    {/* Artwork */}
                    {showArtwork && (
                        <View className="w-10 h-10 rounded-xl overflow-hidden mr-3">
                            {item.artwork_url ? (
                                <Image
                                    source={{ uri: item.artwork_url }}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                />
                            ) : (
                                <View className="w-full h-full bg-gray-200 dark:bg-gray-700 items-center justify-center">
                                    <Ionicons name="musical-note" size={16} color="#9ca3af" />
                                </View>
                            )}
                        </View>
                    )}

                    {/* Track Info */}
                    <View className="flex-1">
                        <Text
                            className={`text-base font-semibold ${isCurrentTrack ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}
                            numberOfLines={1}
                        >
                            {item.title}
                        </Text>
                        <Text
                            className={`text-sm ${isCurrentTrack ? 'text-green-500' : 'text-gray-600 dark:text-gray-400'}`}
                            numberOfLines={1}
                        >
                            @{item.user_profiles?.username || 'Unknown Artist'}
                        </Text>
                    </View>

                    {/* Duration */}
                    {item.duration && item.duration > 0 && (
                        <Text className="text-sm text-gray-500 dark:text-gray-400 mr-3">
                            {formatDuration(item.duration)}
                        </Text>
                    )}

                    {/* Play Button */}
                    <View className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center">
                        <Ionicons
                            name={isPlaying ? "pause" : "play"}
                            size={14}
                            color="#10b981"
                            style={{ marginLeft: isPlaying ? 0 : 1 }}
                        />
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    // Variant par défaut
    return (
        <Animated.View
            entering={variant === 'default' && index > 0 ? FadeInDown.delay(index * 100).springify() : undefined}
            style={animatedStyle}
        >
            <TouchableOpacity
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700"
            >
                <View className="flex-row items-center">
                    {/* Artwork */}
                    {showArtwork && (
                        <View className="w-14 h-14 rounded-2xl overflow-hidden mr-4">
                            {item.artwork_url ? (
                                <Image
                                    source={{ uri: item.artwork_url }}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                />
                            ) : (
                                <LinearGradient
                                    colors={getTrackGradient(item.title) as [string, string]}
                                    className="w-full h-full items-center justify-center"
                                >
                                    <Ionicons name="musical-notes" size={20} color="white" />
                                </LinearGradient>
                            )}
                        </View>
                    )}

                    {/* Track Info */}
                    <View className="flex-1">
                        <Text
                            className={`text-lg font-bold mb-1 ${isCurrentTrack ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}
                            numberOfLines={1}
                        >
                            {item.title}
                        </Text>
                        <View className="flex-row items-center">
                            <Text
                                className={`text-sm ${isCurrentTrack ? 'text-green-500' : 'text-gray-600 dark:text-gray-400'}`}
                                numberOfLines={1}
                            >
                                @{item.user_profiles?.username || 'Unknown Artist'}
                            </Text>
                            {item.duration && item.duration > 0 && (
                                <>
                                    <Ionicons name="ellipse" size={4} color="#9ca3af" style={{ marginHorizontal: 8 }} />
                                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatDuration(item.duration)}
                                    </Text>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Play Button */}
                    <View className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 items-center justify-center">
                        <Ionicons
                            name={isPlaying ? "pause" : "play"}
                            size={20}
                            color="#10b981"
                            style={{ marginLeft: isPlaying ? 0 : 2 }}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}
