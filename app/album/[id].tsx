import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  RefreshControl, 
  StatusBar,
  Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '~/lib/useColorScheme';
import { Album, Track } from '~/types';
import MusicItem from '@/components/MusicItem';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  SlideInLeft,
  ZoomIn,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { UI_CONSTANTS } from '@/constants/player';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 340;

interface StatCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    color: string;
    delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, delay = 0 }) => (
    <Animated.View entering={ZoomIn.delay(delay).springify()}>
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 items-center min-w-20">
            <View
                className="w-10 h-10 rounded-xl items-center justify-center mb-2"
                style={{ backgroundColor: `${color}20` }}
            >
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
                {value}
            </Text>
            <Text className="text-xs text-gray-600 dark:text-gray-400 text-center">
                {label}
            </Text>
        </View>
    </Animated.View>
);

interface TrackItemProps {
    track: Track;
    index: number;
    onPress: (track: Track) => void;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, index, onPress }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.98);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <TouchableOpacity
                onPress={() => onPress(track)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                <Animated.View
                    style={[animatedStyle]}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700 flex-row items-center"
                >
                    {/* Track Number */}
                    <View className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mr-4">
                        <Text className="text-sm font-bold text-gray-600 dark:text-gray-400">
                            {track.track_number || index + 1}
                        </Text>
                    </View>

                    {/* Track Info */}
                    <View className="flex-1">
                        <Text className="font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
                            {track.title}
                        </Text>
                        {track.featuring && (
                            <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1" numberOfLines={1}>
                                feat. {track.featuring}
                            </Text>
                        )}
                    </View>

                    {/* Duration */}
                    {track.duration && (
                        <Text className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                            {formatDuration(track.duration)}
                        </Text>
                    )}

                    {/* Play/Pause Button */}
                    <View className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center">
                        <Ionicons name="play" size={16} color="#10b981" />
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function AlbumPage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scrollY = useSharedValue(0);
    const { isDarkColorScheme } = useColorScheme();

    const [album, setAlbum] = useState<Album | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Animation pour le header
    const headerAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, HEADER_HEIGHT / 2, HEADER_HEIGHT],
            [1, 0.8, 0.6],
        );

        const translateY = interpolate(
            scrollY.value,
            [0, HEADER_HEIGHT],
            [0, -HEADER_HEIGHT / 4],
        );

        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    // Fonction pour générer un gradient basé sur le titre de l'album
    const getAlbumGradient = (title: string) => {
        const gradients = [
            ['#667eea', '#764ba2'],
            ['#f093fb', '#f5576c'],
            ['#4facfe', '#00f2fe'],
            ['#43e97b', '#38f9d7'],
            ['#fa709a', '#fee140'],
            ['#a8edea', '#fed6e3'],
            ['#ffecd2', '#fcb69f'],
            ['#ff8a80', '#ffb74d'],
        ];

        const hash = title.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);

        return gradients[Math.abs(hash) % gradients.length];
    };

    useEffect(() => {
        if (id) {
            fetchAlbumData();
        }
    }, [id]);

    const fetchAlbumData = async (isRefresh = false) => {
        try {
            if (isRefresh) setIsRefreshing(true);

            // Fetch album details
            const { data: albumData, error: albumError } = await supabase
                .from('albums')
                .select(`
                    *,
                    user_profiles!inner(*)
                `)
                .eq('id', id)
                .single();

            if (albumError) throw albumError;

            // Fetch album tracks
            const { data: tracksData, error: tracksError } = await supabase
                .from('tracks')
                .select(`
                    *,
                    user_profiles(*)
                `)
                .eq('album_id', id)
                .order('track_number', { ascending: true })
                .order('created_at', { ascending: true }); // Fallback order

            if (tracksError) throw tracksError;

            setAlbum(albumData);
            setTracks(tracksData || []);

        } catch (err) {
            setError('Erreur lors du chargement de l\'album');
            console.error('Error fetching album data:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = () => {
        fetchAlbumData(true);
    };

    const handleTrackPress = (track: Track) => {
        // Ici on pourrait jouer le morceau
        console.log('Playing track:', track.title);
    };

    const handlePlayAlbum = () => {
        // Ici on pourrait jouer tout l'album
        console.log('Playing album:', album?.title);
    };

    const handleArtistPress = () => {
        if (album?.user_id) {
            router.push(`/artist/${album.user_id}`);
        }
    };

    const getAlbumTypeLabel = (albumType: string) => {
        switch (albumType) {
            case 'album': return 'Album';
            case 'ep': return 'EP';
            case 'single': return 'Single';
            default: return albumType;
        }
    };

    const formatReleaseDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTotalDuration = () => {
        const total = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
        const hours = Math.floor(total / 3600);
        const mins = Math.floor((total % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${mins}min`;
        }
        return `${mins} min`;
    };

    if (!id) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900 px-6">
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <Animated.View
                    entering={FadeInDown.springify()}
                    className="bg-red-50 dark:bg-red-900/20 rounded-3xl p-8 items-center border border-red-200 dark:border-red-800"
                >
                    <Ionicons name="warning" size={64} color="#ef4444" />
                    <Text className="text-red-600 dark:text-red-400 font-bold text-lg mt-4 text-center">
                        ID album manquant
                    </Text>
                    <Text className="text-red-500 dark:text-red-400 text-center mt-2 mb-6">
                        Impossible de charger les détails de l'album
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-red-500 px-6 py-3 rounded-xl"
                    >
                        <Text className="text-white font-semibold">Retour</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    }

    if (isLoading && !album) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900 px-6">
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <Animated.View
                    entering={FadeInDown.springify()}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-8 items-center border border-gray-100 dark:border-gray-700"
                >
                    <View className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 items-center justify-center mb-4">
                        <Ionicons name="albums" size={32} color="#3b82f6" />
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg text-center">
                        Chargement de l'album...
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-center mt-2">
                        Récupération des morceaux et détails
                    </Text>
                </Animated.View>
            </View>
        );
    }

    if (error || !album) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900 px-6">
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <Animated.View
                    entering={FadeInDown.springify()}
                    className="bg-red-50 dark:bg-red-900/20 rounded-3xl p-8 items-center border border-red-200 dark:border-red-800"
                >
                    <Ionicons name="albums-outline" size={64} color="#ef4444" />
                    <Text className="text-red-600 dark:text-red-400 font-bold text-lg mt-4 text-center">
                        Album introuvable
                    </Text>
                    <Text className="text-red-500 dark:text-red-400 text-center mt-2 mb-6">
                        {error || "Impossible de charger les détails de l'album"}
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-red-500 px-6 py-3 rounded-xl"
                    >
                        <Text className="text-white font-semibold">Retour</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    }

    const gradientColors = getAlbumGradient(album.title);

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor="#10b981"
                        colors={["#10b981"]}
                        progressViewOffset={insets.top}
                    />
                }
                contentContainerStyle={{
                    paddingBottom: UI_CONSTANTS.CONTENT_PADDING_BOTTOM + 20,
                }}
            >
                {/* Hero Header avec Gradient */}
                <Animated.View style={[headerAnimatedStyle]}>
                    <LinearGradient
                        colors={[...gradientColors, `${gradientColors[1]}80`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="relative"
                        style={{ height: HEADER_HEIGHT, marginTop: -insets.top }}
                    >
                        {/* Pattern Background */}
                        <View className="absolute inset-0 opacity-10">
                            <View className="flex-row flex-wrap">
                                {Array.from({ length: 50 }).map((_, i) => (
                                    <Animated.View
                                        key={i}
                                        entering={FadeInUp.delay(i * 25).springify()}
                                        className="w-5 h-5 m-1 rounded-full bg-white/30"
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Back button */}
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="absolute w-12 h-12 items-center justify-center rounded-2xl bg-black/20 backdrop-blur-sm border border-white/20"
                            style={{ 
                                top: insets.top + 15, 
                                left: 20,
                            }}
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>

                        {/* More button */}
                        <TouchableOpacity
                            className="absolute w-12 h-12 items-center justify-center rounded-2xl bg-black/20 backdrop-blur-sm border border-white/20"
                            style={{ 
                                top: insets.top + 15, 
                                right: 20,
                            }}
                        >
                            <Ionicons name="ellipsis-vertical" size={24} color="white" />
                        </TouchableOpacity>

                        {/* Album Content */}
                        <View 
                            className="flex-1 justify-end pb-8 px-6"
                            style={{ paddingTop: insets.top + 60 }}
                        >
                            <Animated.View entering={FadeInDown.delay(200).springify()}>
                                {/* Album Artwork */}
                                <View className="items-center mb-6">
                                    <View className="w-48 h-48 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30">
                                        {album.artwork_url ? (
                                            <Image
                                                source={{ uri: album.artwork_url }}
                                                className="w-full h-full"
                                                contentFit="cover"
                                            />
                                        ) : (
                                            <LinearGradient
                                                colors={['#667eea', '#764ba2']}
                                                className="w-full h-full items-center justify-center"
                                            >
                                                <Ionicons name="albums" size={80} color="white" />
                                            </LinearGradient>
                                        )}
                                    </View>
                                </View>

                                {/* Album Info */}
                                <View className="items-center">
                                    {/* Album Type Badge */}
                                    <View className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-2">
                                        <Text className="text-white/90 text-xs font-medium uppercase tracking-wider">
                                            {getAlbumTypeLabel(album.album_type)}
                                        </Text>
                                    </View>

                                    {/* Album Title */}
                                    <Text className="text-white text-3xl font-bold mb-2 text-center">
                                        {album.title}
                                    </Text>

                                    {/* Artist */}
                                    <TouchableOpacity 
                                        onPress={handleArtistPress}
                                        className="flex-row items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full"
                                    >
                                        <Text className="text-white/90 text-sm font-medium">
                                            par @{album.user_profiles?.username}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Statistiques et Play Button */}
                <View className="px-6 -mt-8 mb-8">
                    <Animated.View
                        entering={FadeInUp.delay(100).springify()}
                        className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
                    >
                        <View className="flex-row justify-between items-center mb-4">
                            <View className="flex-row space-x-4">
                                <StatCard
                                    icon="musical-notes"
                                    label="Morceaux"
                                    value={tracks.length.toString()}
                                    color="#10b981"
                                    delay={200}
                                />
                                {tracks.some(t => t.duration) && (
                                    <StatCard
                                        icon="time"
                                        label="Durée"
                                        value={getTotalDuration()}
                                        color="#3b82f6"
                                        delay={300}
                                    />
                                )}
                                {album.release_date && (
                                    <StatCard
                                        icon="calendar"
                                        label="Année"
                                        value={(album.release_year || new Date(album.release_date).getFullYear()).toString()}
                                        color="#8b5cf6"
                                        delay={400}
                                    />
                                )}
                            </View>

                            {/* Play Button */}
                            <Animated.View entering={ZoomIn.delay(500).springify()}>
                                <TouchableOpacity
                                    onPress={handlePlayAlbum}
                                    className="w-16 h-16 rounded-2xl items-center justify-center shadow-lg"
                                    style={{ backgroundColor: gradientColors[0] }}
                                >
                                    <Ionicons name="play" size={24} color="white" style={{ marginLeft: 2 }} />
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </Animated.View>
                </View>

                {/* Description */}
                {album.description && (
                    <View className="px-6 mb-8">
                        <Animated.View entering={FadeInRight.delay(600).springify()}>
                            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Description
                            </Text>
                            <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <Text className="text-gray-700 dark:text-gray-300 leading-6 text-base">
                                    {album.description}
                                </Text>
                            </View>
                        </Animated.View>
                    </View>
                )}

                {/* Release Date */}
                {album.release_date && (
                    <View className="px-6 mb-8">
                        <Animated.View entering={FadeInRight.delay(700).springify()}>
                            <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <View className="flex-row items-center">
                                    <View
                                        className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                                        style={{ backgroundColor: `${gradientColors[0]}20` }}
                                    >
                                        <Ionicons name="calendar-outline" size={24} color={gradientColors[0]} />
                                    </View>
                                    <View>
                                        <Text className="text-sm font-medium text-gray-900 dark:text-white">
                                            Date de sortie
                                        </Text>
                                        <Text className="text-gray-600 dark:text-gray-400 text-base">
                                            {formatReleaseDate(album.release_date)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Animated.View>
                    </View>
                )}

                {/* Tracks List */}
                <View className="px-6 mb-8">
                    <Animated.View entering={FadeInRight.delay(800).springify()}>
                        <View className="flex-row items-center justify-between mb-6">
                            <View>
                                <Text className="text-xl font-bold text-gray-900 dark:text-white">
                                    Liste des morceaux
                                </Text>
                                <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {tracks.length} titre{tracks.length > 1 ? 's' : ''} au total
                                </Text>
                            </View>
                        </View>

                        {tracks.length === 0 ? (
                            <Animated.View
                                entering={FadeInDown.delay(900).springify()}
                                className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl p-8 items-center border border-blue-200 dark:border-blue-800"
                            >
                                <Ionicons name="musical-note-outline" size={64} color="#3b82f6" />
                                <Text className="text-blue-900 dark:text-blue-300 font-semibold mt-4 text-center">
                                    Aucun morceau pour l'instant
                                </Text>
                                <Text className="text-blue-700 dark:text-blue-400 text-center mt-2">
                                    Les morceaux de cet album apparaîtront ici une fois ajoutés
                                </Text>
                            </Animated.View>
                        ) : (
                            <View>
                                {tracks.map((track, index) => (
                                    <TrackItem
                                        key={track.id}
                                        track={track}
                                        index={index}
                                        onPress={handleTrackPress}
                                    />
                                ))}
                            </View>
                        )}
                    </Animated.View>
                </View>

                {/* Call to Action pour écouter plus */}
                <Animated.View
                    entering={FadeInUp.delay(1000).springify()}
                    className="mx-6 mb-8"
                >
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="rounded-3xl p-6"
                    >
                        <View className="flex-row items-center">
                            <View className="flex-1">
                                <Text className="text-white text-xl font-bold mb-2">
                                    Découvrez plus de musique
                                </Text>
                                <Text className="text-white/90 text-sm mb-4">
                                    Explorez d'autres albums et artistes de votre communauté musicale.
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => router.push('/library')}
                                    className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl self-start"
                                >
                                    <Text className="text-white font-semibold">
                                        Explorer la bibliothèque
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View className="ml-4">
                                <Ionicons name="library" size={64} color="rgba(255,255,255,0.6)" />
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </Animated.ScrollView>
        </View>
    );
}