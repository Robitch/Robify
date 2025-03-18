import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useAudioStore } from '~/store/audio';
import {
    useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { getImageColors, cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import TrackSlider from '~/components/TrackSlider';


interface ExpandedPlayerProps {
    scrollComponent?: (props: any) => React.ReactElement;
}

export default function PlayerPlayer({ scrollComponent }: ExpandedPlayerProps) {
    const ScrollComponentToUse = scrollComponent || ScrollView;
    const [colors, setColors] = useState<string[]>(["#000", "#fff"]);
    const {
        isPlaying,
        position,
        duration,
        play,
        pause,
        // togglePlayPause,
        sound,
        currentTrack,
        // playNextSong,
        // playPreviousSong
    } = useAudioStore();
    const togglePlayPause = () => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    }
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const getColors = async () => {
            if (!currentTrack) return;
            const colors = await getImageColors(currentTrack.album || "");
            setColors(colors);
        }
        getColors();

    }, [currentTrack]);
    const handleSkipForward = async () => {
        if (sound) {
            await sound.setPositionAsync(Math.min(duration, position + 10000));
        }
    };

    const handleSkipBackward = async () => {
        if (sound) {
            await sound.setPositionAsync(Math.max(0, position - 10000));
        }
    };

    const formatTime = (millis: number) => {
        const minutes = Math.floor(millis / 60000);
        const seconds = ((millis % 60000) / 1000).toFixed(0);
        return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
    };

    const progress = duration > 0 ? (position / duration) * 100 : 0;

    // Add sample lyrics (you should get this from your song data)
    const lyrics = [
        "Verse 1",
        "First line of the song",
        "Second line of the song",
        "Third line goes here",
        "",
        "Chorus",
        "This is the chorus",
        "Another chorus line",
        "Final chorus line",
        "",
        "Verse 2",
        "Back to the verses",
        "More lyrics here",
        "And here as well",
        // Add more lyrics as needed
    ];

    return (
        <LinearGradient
            colors={colors as [string, string, string]}
            style={{ paddingTop: insets.top }}
            className="flex-1 rounded-t-3xl justify-between items-center"
            start={{ x: 0, y: 0 }}
            end={{ x: 2, y: 0 }}
        >
            <View>
                <View className="w-12 h-1.5 rounded-full bg-muted-foreground self-center mt-2.5" />
            </View>

            {/* <ScrollComponentToUse
                className="flex-1 bg-purple-500"
                showsVerticalScrollIndicator={false}
            > */}
            {/* <View className="items-center bg-green-500 justify-between"> */}
            <View className="my-8 mx-5 shadow-lg shadow-black rounded-3xl overflow-hidden">
                <Image
                    source={{ uri: currentTrack?.album }}
                    style={{ width: '92.5%', borderRadius: 10, aspectRatio: 1 }}
                />
            </View>

            <View className="justify-between px-5">
                <View>
                    <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                            <Text className="text-2xl font-semibold">
                                {currentTrack?.title}
                            </Text>
                            <Text className="text-xl opacity-70">
                                {currentTrack?.author}
                            </Text>
                        </View>
                        {/* <View style={styles.titleIcons}> */}
                        <Button variant="ghost" className="rounded-full" size="icon">
                            <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
                        </Button>
                        {/* </View> */}
                    </View>

                    <View className="my-5">
                        <TrackSlider />
                        <View className="flex-row justify-between">
                            <Text className="text-sm opacity-70">
                                {formatTime(position)}
                            </Text>
                            <Text className="text-sm opacity-70">
                                -{formatTime(Math.max(0, duration - position))}
                            </Text>
                        </View>
                    </View>



                    <View style={styles.buttonContainer}>
                        <Pressable style={styles.button} onPress={void 0}>
                            <Ionicons name="play-skip-back" size={35} color="#fff" />
                        </Pressable>
                        <Pressable style={[styles.button, styles.playButton]} onPress={togglePlayPause}>
                            <Ionicons name={isPlaying ? "pause" : "play"} size={45} color="#fff" />
                        </Pressable>
                        <Pressable style={styles.button} onPress={void 0}>
                            <Ionicons name="play-skip-forward" size={35} color="#fff" />
                        </Pressable>
                    </View>


                </View>






                {/* <View> */}
                {/* <View style={styles.volumeControl}>
                                <Ionicons name="volume-off" size={24} color="#fff" />
                                <View style={styles.volumeBar}>
                                    <View style={styles.volumeProgress} />
                                </View>
                                <Ionicons name="volume-high" size={24} color="#fff" />
                            </View> */}





                <View className="flex-row justify-between my-5">
                    <Button variant="secondary" className="rounded-full" size="sm" prepend={<Ionicons name="chatbubble-outline" size={18} color="#ddd" />}>
                        <Text>Paroles</Text>
                    </Button>

                    {/* <Pressable style={styles.extraControlButton}>
                            <View style={styles.extraControlIcons}>
                                <Ionicons name="volume-off" size={26} color="#fff" marginRight={-6} />
                                <Ionicons name="bluetooth" size={24} color="#fff" />
                            </View>
                            <Text style={styles.extraControlText}>Px8</Text>
                        </Pressable> */}
                    <Button variant="secondary" className="rounded-full" size="sm" prepend={<Ionicons name="list-outline" size={18} color="#ddd" />}>
                        <Text>File d'attente</Text>
                    </Button>
                </View>
            </View>



            {/* </View> */}

            {/* Add lyrics section after the controls */}
            {/* <View style={styles.lyricsContainer}>
                        {lyrics.map((line, index) => (
                            <Text
                                key={index}
                                style={[
                                    styles.lyricsText,
                                    line === "" && styles.lyricsSpacing
                                ]}
                            >
                                {line}
                            </Text>
                        ))}
                    </View> */}
            {/* </View> */}
            {/* </ScrollComponentToUse> */}
        </LinearGradient >
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 50,
        backgroundColor: 'transparent',
    },
    button: {
        padding: 10,
    },
    playButton: {
        transform: [{ scale: 1.2 }],
    },
    volumeControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 10,

    },
    volumeBar: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 20,
    },
    volumeProgress: {
        width: '70%',
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 10,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },
    iconButton: {
        width: 32,
        height: 32,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    extraControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 26,
        backgroundColor: 'transparent',

    },
    extraControlButton: {
        alignItems: 'center',
        // justifyContent: 'center',
        opacity: 0.8,
        height: 60,
    },
    extraControlText: {
        color: '#fff',
        fontSize: 13,
        marginTop: 6,
        opacity: 0.7,
        fontWeight: '600',
    },
    extraControlIcons: {
        flexDirection: 'row',

    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    lyricsContainer: {
        paddingHorizontal: 20,
        paddingVertical: 30,
        width: '100%',
        alignItems: 'center',
    },
    lyricsText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        opacity: 0.8,
        marginVertical: 2,
    },
    lyricsSpacing: {
        marginVertical: 10,
    },
});