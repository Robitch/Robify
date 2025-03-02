import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Platform,
    Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '@/store/playerStore';
import Slider from '@react-native-community/slider';

export function MusicPlayer() {
    const insets = useSafeAreaInsets();
    const {
        currentTrack,
        isPlaying,
        togglePlayPause,
        sound,
        queue,
        playNext,
        playPrevious,
        toggleRepeat,
        toggleShuffle,
        isRepeat,
        isShuffle,
    } = usePlayerStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (sound) {
            const updatePosition = async () => {
                const status = await sound.getStatusAsync();
                if (status.isLoaded) {
                    setPosition(status.positionMillis / 1000);
                    setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
                }
            };

            const interval = setInterval(updatePosition, 1000);
            return () => clearInterval(interval);
        }
    }, [sound]);

    const animatedStyle = useAnimatedStyle(() => ({
        height: withSpring(isExpanded ? '100%' : 60),
        bottom: withSpring(isExpanded ? 0 : 60 + insets.bottom),
    }));

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (!currentTrack) return null;

    const handleSeek = async (value: number) => {
        if (sound) {
            await sound.setPositionAsync(value * 1000);
        }
    };

    const renderMiniPlayer = () => (
        <Pressable
            style={styles.miniContent}
            onPress={() => setIsExpanded(true)}>
            <View style={styles.trackInfo}>
                <Text style={styles.title} numberOfLines={1}>
                    {currentTrack.title}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                    {currentTrack.artist}
                </Text>
            </View>
            <View style={styles.controls}>
                <Pressable onPress={togglePlayPause}>
                    <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={24}
                        className='text-black'
                    />
                </Pressable>
            </View>
        </Pressable>
    );

    const renderFullPlayer = () => (
        <View style={styles.fullContent}>
            <Pressable
                style={styles.closeButton}
                onPress={() => setIsExpanded(false)}>
                <Ionicons name="chevron-down" size={24} className='text-black' />
            </Pressable>

            <Image
                source={{
                    uri: currentTrack.artwork ||
                        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bXVzaWN8ZW58MHx8MHx8fDA%3D%3D'
                }}
                style={styles.artwork}
            />

            <View style={styles.fullTrackInfo}>
                <Text style={styles.fullTitle}>{currentTrack.title}</Text>
                <Text style={styles.fullArtist}>{currentTrack.artist}</Text>
            </View>

            <View style={styles.progressContainer}>
                <Slider
                    style={styles.progressBar}
                    minimumValue={0}
                    maximumValue={duration}
                    value={position}
                    onSlidingComplete={handleSeek}
                    minimumTrackTintColor="#000"
                    maximumTrackTintColor="#ccc"
                    thumbTintColor="#000"
                />
                <View style={styles.timeInfo}>
                    <Text style={styles.time}>{formatTime(position)}</Text>
                    <Text style={styles.time}>{formatTime(duration)}</Text>
                </View>
            </View>

            <View style={styles.fullControls}>
                <Pressable
                    style={styles.controlButton}
                    onPress={toggleShuffle}>
                    <Ionicons
                        name="shuffle"
                        size={24}
                        // color={isShuffle ? '#000' : '#666'}
                        className={isShuffle ? 'text-black' : 'text-gray-500'}
                    />
                </Pressable>
                <Pressable
                    style={styles.controlButton}
                    onPress={playPrevious}>
                    <Ionicons name="play-skip-back" size={24} className='text-black' />
                </Pressable>
                <Pressable
                    style={styles.playButton}
                    onPress={togglePlayPause}>
                    <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={32}
                        // color="#fff"
                        className='text-white'
                    />
                </Pressable>
                <Pressable
                    style={styles.controlButton}
                    onPress={playNext}>
                    <Ionicons name="play-skip-forward" size={24}
                        // color="#000"
                        className='text-black'
                    />
                </Pressable>
                <Pressable
                    style={styles.controlButton}
                    onPress={toggleRepeat}>
                    <Ionicons
                        name="repeat"
                        size={24}
                        // color={isRepeat ? '#000' : '#666'}
                        className={isRepeat ? 'text-black' : 'text-gray-500'}
                    />
                </Pressable>
            </View>

            {queue.length > 0 && (
                <View style={styles.queue}>
                    <Text style={styles.queueTitle}>File d'attente</Text>
                    {queue.map((track, index) => (
                        <View key={track.id} style={styles.queueItem}>
                            <Text style={styles.queueTrackTitle} numberOfLines={1}>
                                {track.title}
                            </Text>
                            <Text style={styles.queueArtist} numberOfLines={1}>
                                {track.artist}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );

    return (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[styles.container, animatedStyle]}>
            <BlurView intensity={80} style={StyleSheet.absoluteFill} />
            {isExpanded ? renderFullPlayer() : renderMiniPlayer()}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        margin: 16,
        borderRadius: 12,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
            },
            android: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
            web: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
        }),
    },
    miniContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 60,
    },
    trackInfo: {
        flex: 1,
        marginRight: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    artist: {
        fontSize: 14,
        color: '#666',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fullContent: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    closeButton: {
        alignSelf: 'flex-start',
        padding: 8,
        marginBottom: 16,
    },
    artwork: {
        width: 300,
        height: 300,
        borderRadius: 16,
        marginBottom: 32,
    },
    fullTrackInfo: {
        alignItems: 'center',
        marginBottom: 32,
    },
    fullTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
        textAlign: 'center',
        marginBottom: 8,
    },
    fullArtist: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
    },
    progressContainer: {
        width: '100%',
        marginBottom: 32,
    },
    progressBar: {
        width: '100%',
        height: 40,
    },
    timeInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    time: {
        fontSize: 14,
        color: '#666',
    },
    fullControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 16,
        marginBottom: 32,
    },
    controlButton: {
        padding: 12,
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    queue: {
        width: '100%',
    },
    queueTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 16,
    },
    queueItem: {
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 8,
        marginBottom: 8,
    },
    queueTrackTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    queueArtist: {
        fontSize: 14,
        color: '#666',
    },
});