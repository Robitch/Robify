import React, { useEffect, useState } from 'react';
import {
    View,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useActiveTrack, useProgress } from 'react-native-track-player';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/text';
import { PlayPauseButton, SkipToNextButton, SkipToPreviousButton } from '@/components/PlayerControls';
import { useColorScheme } from '~/lib/useColorScheme';
import TrackPlayer from 'react-native-track-player';
import Slider from '@react-native-community/slider';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    runOnJS,
    useAnimatedGestureHandler,
    withDelay,
    FadeIn,
    FadeInUp,
    FadeInDown,
    SlideInUp,
    SlideInDown,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const PlayerScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDarkColorScheme } = useColorScheme();
    const activeTrack = useActiveTrack();
    const progress = useProgress();

    // Animation values
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const artworkScale = useSharedValue(0.8);

    useEffect(() => {
        // Entrance animations
        artworkScale.value = withDelay(200, withSpring(1, { damping: 15 }));
    }, [activeTrack]);


    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeek = async (value: number) => {
        await TrackPlayer.seekTo(value);
    };

    // Pan gesture for closing
    const panGestureHandler = useAnimatedGestureHandler({
        onActive: (event) => {
            if (event.translationY > 0) {
                translateY.value = event.translationY;
                scale.value = interpolate(
                    event.translationY,
                    [0, 300],
                    [1, 0.9],
                    'clamp'
                );
            }
        },
        onEnd: (event) => {
            if (event.translationY > 150 || event.velocityY > 1000) {
                runOnJS(router.back)();
            } else {
                translateY.value = withSpring(0);
                scale.value = withSpring(1);
            }
        },
    });

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value }
        ],
    }));

    const artworkAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: artworkScale.value }
        ],
    }));

    if (!activeTrack) {
        return (
            <Animated.View
                className={`flex-1 ${isDarkColorScheme ? 'bg-black' : 'bg-white'}`}
                entering={FadeIn}
            >
                <View className="flex-1 justify-center items-center">
                    <Text className="text-muted-foreground">Aucun morceau en cours</Text>
                </View>
            </Animated.View>
        );
    }

    return (
        <PanGestureHandler onGestureEvent={panGestureHandler}>
            <Animated.View
                className={`flex-1 ${isDarkColorScheme ? 'bg-gradient-to-b from-gray-900 to-black' : 'bg-gradient-to-b from-gray-50 to-white'}`}
                style={[{ paddingTop: insets.top }, containerAnimatedStyle]}
            >
                {/* Header */}
                <Animated.View
                    className="flex-row items-center justify-between px-6 py-4"
                    entering={SlideInDown.delay(100)}
                >
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-12 h-12 items-center justify-center rounded-full"
                        style={{
                            backgroundColor: isDarkColorScheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                        }}
                    >
                        <Ionicons
                            name="chevron-down"
                            size={28}
                            className={`text-foreground ${isDarkColorScheme ? 'text-white' : 'text-black'}`}
                        />
                    </TouchableOpacity>

                    <Animated.View
                        className="flex-1 items-center"
                        entering={FadeInUp.delay(200)}
                    >
                        <Text className="text-sm text-muted-foreground font-medium tracking-wider">
                            EN COURS DE LECTURE
                        </Text>
                    </Animated.View>

                    <TouchableOpacity
                        className="w-12 h-12 items-center justify-center rounded-full"
                        style={{
                            backgroundColor: isDarkColorScheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                        }}
                    >
                        <Ionicons
                            name="ellipsis-horizontal"
                            size={24}
                            className={`text-foreground ${isDarkColorScheme ? 'text-white' : 'text-black'}`}
                        />
                    </TouchableOpacity>
                </Animated.View>

                {/* Album Artwork */}
                <Animated.View
                    className="flex-1 justify-center items-center px-8 py-8"
                    entering={FadeIn.delay(300)}
                >
                    <Animated.View
                        className={`rounded-3xl overflow-hidden ${isDarkColorScheme ? 'shadow-white/20' : 'shadow-black/30'
                            }`}
                        style={[
                            artworkAnimatedStyle,
                            {
                                width: width * 0.85,
                                height: width * 0.85,
                                maxWidth: 380,
                                maxHeight: 380,
                                shadowOffset: { width: 0, height: 8 },
                                shadowRadius: 24,
                                shadowOpacity: 0.3,
                                elevation: 12,
                            }
                        ]}
                    >
                        {activeTrack.artwork ? (
                            <Image
                                source={{ uri: activeTrack.artwork }}
                                className="w-full h-full"
                                contentFit="cover"
                            />
                        ) : (
                            <View className={`w-full h-full ${isDarkColorScheme ? 'bg-gray-800' : 'bg-gray-200'} items-center justify-center`}>
                                <Ionicons
                                    name="musical-note"
                                    size={100}
                                    className={`text-foreground ${isDarkColorScheme ? 'text-white' : 'text-black'}`}
                                />
                            </View>
                        )}
                    </Animated.View>
                </Animated.View>

                {/* Track Info */}
                <Animated.View
                    className="px-8 py-6"
                    entering={FadeInUp.delay(400)}
                >
                    <Text className="text-3xl font-bold text-foreground text-center mb-3" numberOfLines={2}>
                        {activeTrack.title || 'Titre inconnu'}
                    </Text>
                    <Text className="text-xl text-muted-foreground text-center" numberOfLines={1}>
                        {activeTrack.artist || 'Artiste inconnu'}
                    </Text>
                </Animated.View>

                {/* Progress Bar */}
                <Animated.View
                    className="px-8 py-4"
                    entering={FadeInUp.delay(500)}
                >
                    <View className="relative">
                        {/* Custom Progress Bar Background */}
                        <View
                            className={`h-1 rounded-full ${isDarkColorScheme ? 'bg-gray-700' : 'bg-gray-300'}`}
                        />

                        {/* Animated Progress Bar */}
                        <AnimatedProgressBar
                            progress={progress}
                            onSeek={handleSeek}
                            isDarkColorScheme={isDarkColorScheme}
                        />
                    </View>

                    {/* Time Labels */}
                    <View className="flex-row justify-between mt-4">
                        <Text className="text-sm text-muted-foreground font-medium">
                            {formatTime(progress.position)}
                        </Text>
                        <Text className="text-sm text-muted-foreground font-medium">
                            -{formatTime(progress.duration - progress.position)}
                        </Text>
                    </View>
                </Animated.View>

                {/* Player Controls */}
                <Animated.View
                    className="px-8 py-8"
                    entering={FadeInUp.delay(600)}
                >
                    <PlayerControlsAnimated />
                </Animated.View>

                {/* Bottom Actions */}
                <Animated.View
                    className="flex-row items-center justify-between px-8 pb-8"
                    entering={FadeInDown.delay(700)}
                >
                    <AnimatedActionButton
                        icon="heart-outline"
                        delay={0}
                        isDarkColorScheme={isDarkColorScheme}
                    />

                    <AnimatedActionButton
                        icon="repeat-outline"
                        delay={50}
                        isDarkColorScheme={isDarkColorScheme}
                    />

                    <AnimatedActionButton
                        icon="shuffle-outline"
                        delay={100}
                        isDarkColorScheme={isDarkColorScheme}
                    />

                    <AnimatedActionButton
                        icon="share-outline"
                        delay={150}
                        isDarkColorScheme={isDarkColorScheme}
                    />
                </Animated.View>
            </Animated.View>
        </PanGestureHandler>
    );
};

// Composant pour la barre de progression animée
const AnimatedProgressBar = ({ progress, onSeek, isDarkColorScheme }: any) => {
    const progressWidth = useSharedValue(0);

    useEffect(() => {
        if (progress.duration > 0) {
            progressWidth.value = withTiming(
                (progress.position / progress.duration) * 100,
                { duration: 500 }
            );
        }
    }, [progress.position, progress.duration]);

    const animatedStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    return (
        <>
            <Animated.View
                className="absolute top-0 left-0 h-1 bg-emerald-500 rounded-full"
                style={animatedStyle}
            />
            <Slider
                style={{
                    position: 'absolute',
                    top: -15,
                    left: 0,
                    right: 0,
                    height: 30,
                    opacity: 0
                }}
                value={progress.position}
                minimumValue={0}
                maximumValue={progress.duration || 1}
                onSlidingComplete={onSeek}
            />
        </>
    );
};

// Composant pour les contrôles du lecteur avec animations
const PlayerControlsAnimated = () => {
    return (
        <View className="flex-row items-center justify-center">
            <AnimatedControlButton
                delay={0}
                scale={0.9}
            >
                <SkipToPreviousButton iconSize={36} />
            </AnimatedControlButton>

            <AnimatedControlButton
                delay={100}
                scale={1.1}
                style={{ marginHorizontal: 32 }}
            >
                <PlayPauseButton iconSize={72} />
            </AnimatedControlButton>

            <AnimatedControlButton
                delay={200}
                scale={0.9}
            >
                <SkipToNextButton iconSize={36} />
            </AnimatedControlButton>
        </View>
    );
};

// Composant pour boutons de contrôle animés
const AnimatedControlButton = ({ children, delay, scale = 1, style }: any) => {
    const buttonScale = useSharedValue(0);

    useEffect(() => {
        buttonScale.value = withDelay(delay, withSpring(scale, { damping: 15 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }));

    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

// Composant pour boutons d'action animés
const AnimatedActionButton = ({ icon, delay, isDarkColorScheme }: any) => {
    const scale = useSharedValue(0);
    const pressScale = useSharedValue(1);

    useEffect(() => {
        scale.value = withDelay(delay, withSpring(1, { damping: 15 }));
    }, []);

    const handlePress = () => {
        pressScale.value = withSpring(0.8, { damping: 20 }, () => {
            pressScale.value = withSpring(1, { damping: 15 });
        });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value * pressScale.value }],
    }));

    return (
        <AnimatedTouchableOpacity
            className="w-12 h-12 items-center justify-center rounded-full"
            style={[
                animatedStyle,
                {
                    backgroundColor: isDarkColorScheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                }
            ]}
            onPress={handlePress}
        >
            <Ionicons
                name={icon}
                size={24}
                className={`text-foreground ${isDarkColorScheme ? 'text-white' : 'text-black'}`}
            />
        </AnimatedTouchableOpacity>
    );
};

export default PlayerScreen;