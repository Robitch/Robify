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
    Extrapolate,
    withSequence,
    Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const PlayerScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDarkColorScheme } = useColorScheme();
    const activeTrack = useActiveTrack();
    const progress = useProgress();


    // Enhanced animation values
    const opacity = useSharedValue(0);

    // Component-specific animations
    const headerOpacity = useSharedValue(0);
    const headerTranslateY = useSharedValue(-50);

    const artworkScale = useSharedValue(0.7);
    const artworkRotation = useSharedValue(0);
    const artworkOpacity = useSharedValue(0);

    const titleOpacity = useSharedValue(0);
    const titleTranslateY = useSharedValue(30);

    const controlsOpacity = useSharedValue(0);
    const controlsTranslateY = useSharedValue(40);

    const progressOpacity = useSharedValue(0);
    const progressScale = useSharedValue(0.8);

    const actionsOpacity = useSharedValue(0);
    const actionsTranslateY = useSharedValue(50);

    // Interactive states
    const backdropBlur = useSharedValue(0);

    useEffect(() => {
        // Sophisticated entrance animation sequence
        const springConfig = { damping: 15, stiffness: 120 };
        const timingConfig = { duration: 400, easing: Easing.out(Easing.cubic) };

        // Screen fade in
        opacity.value = withTiming(1, { duration: 200 });

        // Header slides down and fades in
        headerOpacity.value = withDelay(50, withTiming(1, timingConfig));
        headerTranslateY.value = withDelay(50, withSpring(0, springConfig));

        // Backdrop blur effect
        backdropBlur.value = withDelay(100, withTiming(20, timingConfig));

        // Artwork: scale + rotation + fade sequence
        artworkOpacity.value = withDelay(150, withTiming(1, { duration: 500 }));
        artworkScale.value = withDelay(200,
            withSequence(
                withSpring(1.1, { damping: 12, stiffness: 100 }),
                withSpring(1, { damping: 20, stiffness: 150 })
            )
        );

        // Title slides up and fades
        titleOpacity.value = withDelay(300, withTiming(1, timingConfig));
        titleTranslateY.value = withDelay(300, withSpring(0, springConfig));

        // Progress bar scales in
        progressOpacity.value = withDelay(350, withTiming(1, timingConfig));
        progressScale.value = withDelay(350, withSpring(1, springConfig));

        // Controls slide up
        controlsOpacity.value = withDelay(400, withTiming(1, timingConfig));
        controlsTranslateY.value = withDelay(400, withSpring(0, springConfig));

        // Action buttons stagger in
        actionsOpacity.value = withDelay(500, withTiming(1, timingConfig));
        actionsTranslateY.value = withDelay(500, withSpring(0, springConfig));
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeek = async (value: number) => {
        await TrackPlayer.seekTo(value);
    };

    const handleBack = () => {
        router.dismiss();
    };


    const containerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            backdropBlur.value,
            [0, 20],
            [0, 0.95],
            Extrapolate.CLAMP
        ),
    }));

    const headerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: headerOpacity.value,
        transform: [{ translateY: headerTranslateY.value }],
    }));

    const artworkAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: artworkScale.value },
            { rotate: `${artworkRotation.value}deg` }
        ],
        opacity: artworkOpacity.value,
    }));

    const titleAnimatedStyle = useAnimatedStyle(() => ({
        opacity: titleOpacity.value,
        transform: [{ translateY: titleTranslateY.value }],
    }));

    const controlsAnimatedStyle = useAnimatedStyle(() => ({
        opacity: controlsOpacity.value,
        transform: [{ translateY: controlsTranslateY.value }],
    }));

    const progressAnimatedStyle = useAnimatedStyle(() => ({
        opacity: progressOpacity.value,
        transform: [{ scale: progressScale.value }],
    }));

    const actionsAnimatedStyle = useAnimatedStyle(() => ({
        opacity: actionsOpacity.value,
        transform: [{ translateY: actionsTranslateY.value }],
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
        <>
            {/* Enhanced backdrop with blur effect */}
            <Animated.View
                className={`absolute inset-0 ${isDarkColorScheme ? 'bg-black' : 'bg-white'}`}
                style={backdropStyle}
            />

            <Animated.View
                className={`flex-1 ${isDarkColorScheme ? 'bg-gradient-to-b from-gray-900/95 to-black/95' : 'bg-gradient-to-b from-gray-50/95 to-white/95'}`}
                style={[{ paddingTop: insets.top }, containerAnimatedStyle]}
            >
                    {/* Header */}
                    <Animated.View
                        className="flex-row items-center justify-between px-6 py-4"
                        style={headerAnimatedStyle}
                    >
                        <TouchableOpacity
                            onPress={handleBack}
                            className="w-12 h-12 items-center justify-center rounded-full"
                            style={{
                                backgroundColor: isDarkColorScheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                            }}
                        >
                            <Ionicons
                                name="chevron-down"
                                size={28}
                                color={isDarkColorScheme ? '#fff' : '#000'}
                            />
                        </TouchableOpacity>

                        <View className="flex-1 items-center">
                            <Text className="text-sm text-muted-foreground font-medium tracking-wider">
                                EN COURS DE LECTURE
                            </Text>
                        </View>

                        <TouchableOpacity
                            className="w-12 h-12 items-center justify-center rounded-full"
                            style={{
                                backgroundColor: isDarkColorScheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                            }}
                        >
                            <Ionicons
                                name="ellipsis-horizontal"
                                size={24}
                                color={isDarkColorScheme ? '#fff' : '#000'}
                            />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Album Artwork */}
                    <Animated.View
                        className="flex-1 justify-center items-center px-8 py-8"
                        style={artworkAnimatedStyle}
                    >
                        <View
                            className={`rounded-3xl overflow-hidden ${isDarkColorScheme ? 'shadow-white/20' : 'shadow-black/30'
                                }`}
                            style={{
                                width: width * 0.85,
                                height: width * 0.85,
                                maxWidth: 380,
                                maxHeight: 380,
                                shadowOffset: { width: 0, height: 8 },
                                shadowRadius: 24,
                                shadowOpacity: 0.3,
                                elevation: 12,
                            }}
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
                                        color={isDarkColorScheme ? '#6b7280' : '#9ca3af'}
                                    />
                                </View>
                            )}
                        </View>
                    </Animated.View>

                    {/* Enhanced Track Info */}
                    <Animated.View
                        className="px-8 py-6"
                        style={titleAnimatedStyle}
                    >
                        <Text className="text-3xl font-bold text-foreground text-center mb-3 tracking-tight" numberOfLines={2}>
                            {activeTrack.title || 'Titre inconnu'}
                        </Text>
                        <Text className="text-xl text-muted-foreground text-center font-medium" numberOfLines={1}>
                            {activeTrack.artist || 'Artiste inconnu'}
                        </Text>

                        {/* Subtle divider */}
                        <View
                            className={`h-0.5 w-16 mx-auto mt-4 rounded-full ${isDarkColorScheme ? 'bg-gray-700' : 'bg-gray-300'}`}
                        />
                    </Animated.View>

                    {/* Progress Bar */}
                    <Animated.View
                        className="px-8 py-4"
                        style={progressAnimatedStyle}
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
                        style={controlsAnimatedStyle}
                    >
                        <PlayerControlsAnimated />
                    </Animated.View>

                    {/* Enhanced Bottom Actions */}
                    <Animated.View
                        className="flex-row items-center justify-between px-8 pb-8"
                        style={actionsAnimatedStyle}
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
        </>
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
                color={isDarkColorScheme ? '#9ca3af' : '#6b7280'}
            />
        </AnimatedTouchableOpacity>
    );
};

export default PlayerScreen;