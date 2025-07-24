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
import { Track } from '~/types';
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
const HEADER_HEIGHT = 320;

interface Artist {
    id: string;
    username: string;
    avatar_url?: string;
    bio?: string;
    location?: string;
    website?: string;
    instagram?: string;
    spotify?: string;
    created_at: string;
}

interface Album {
    id: string;
    title: string;
    artwork_url?: string;
    tracks_count: number;
}

interface AlbumCardProps {
    album: Album;
    onPress: (album: Album) => void;
    index: number;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, onPress, index }) => {
    const scale = useSharedValue(1);
    const { isDarkColorScheme } = useColorScheme();

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <Animated.View entering={SlideInLeft.delay(index * 100).springify()}>
            <TouchableOpacity
                onPress={() => onPress(album)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                <Animated.View
                    style={[animatedStyle]}
                    className="mr-4"
                >
                    <View className="w-36 h-36 rounded-3xl overflow-hidden mb-3 shadow-lg border border-gray-100 dark:border-gray-700">
                        {album.artwork_url ? (
                            <Image
                                source={{ uri: album.artwork_url }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                            />
                        ) : (
                            <LinearGradient
                                colors={['#667eea', '#764ba2']}
                                className="w-full h-full items-center justify-center"
                            >
                                <Ionicons name="musical-notes" size={36} color="white" />
                            </LinearGradient>
                        )}
                    </View>
                    <View className="px-1">
                        <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                            {album.title}
                        </Text>
                        <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {album.tracks_count} morceau{album.tracks_count > 1 ? 'x' : ''}
                        </Text>
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
};

interface StatCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    color: string;
    delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, delay = 0 }) => (
    <Animated.View entering={ZoomIn.delay(delay).springify()}>
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 items-center min-w-24">
            <View
                className="w-12 h-12 rounded-xl items-center justify-center mb-2"
                style={{ backgroundColor: `${color}20` }}
            >
                <Ionicons name={icon} size={24} color={color} />
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

interface SocialLinkProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    color: string;
    onPress: () => void;
    delay?: number;
}

const SocialLink: React.FC<SocialLinkProps> = ({ icon, label, value, color, onPress, delay = 0 }) => (
    <Animated.View entering={FadeInRight.delay(delay).springify()}>
        <TouchableOpacity
            onPress={onPress}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex-row items-center"
        >
            <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: `${color}20` }}
            >
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900 dark:text-white">
                    {label}
                </Text>
                <Text className="text-xs text-gray-600 dark:text-gray-400" numberOfLines={1}>
                    {value}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
    </Animated.View>
);

export default function ArtistProfile() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scrollY = useSharedValue(0);
    const { isDarkColorScheme } = useColorScheme();

    const [artist, setArtist] = useState<Artist | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
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

    // Fonction pour générer un gradient basé sur le nom d'utilisateur
    const getAvatarGradient = (username: string) => {
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

        const hash = username.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);

        return gradients[Math.abs(hash) % gradients.length];
    };

    useEffect(() => {
        if (id) {
            fetchArtistData();
        }
    }, [id]);

    const fetchArtistData = async (isRefresh = false) => {
        try {
            if (isRefresh) setIsRefreshing(true);

            // Fetch artist profile
            const { data: artistData, error: artistError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (artistError) throw artistError;

            // Fetch artist tracks
            const { data: tracksData, error: tracksError } = await supabase
                .from('tracks')
                .select('*')
                .eq('user_id', id)
                .order('created_at', { ascending: false });

            // Ajouter les infos user_profiles à chaque track manuellement
            const tracksWithProfiles = tracksData?.map(track => ({
                ...track,
                user_profiles: {
                    username: artistData.username
                }
            })) || [];

            if (tracksError) throw tracksError;

            // Fetch albums from the albums table
            const { data: albumsData, error: albumsError } = await supabase
                .from('albums')
                .select('*, tracks!inner(id)')
                .eq('user_id', id)
                .order('created_at', { ascending: false });

            if (albumsError) {
                console.warn('Error fetching albums:', albumsError);
            }

            // Process albums with tracks count
            const albumsWithCount = albumsData?.map(album => ({
                ...album,
                tracks_count: album.tracks?.length || 0
            })) || [];

            setArtist(artistData);
            setTracks(tracksWithProfiles || []);
            setAlbums(albumsWithCount);

        } catch (err) {
            setError('Erreur lors du chargement du profil artiste');
            console.error('Error fetching artist data:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = () => {
        fetchArtistData(true);
    };

    const handleAlbumPress = (album: Album) => {
        router.push(`/album/${album.id}`);
    };

    const handleSocialLinkPress = (url: string) => {
        // Dans une vraie application, on utiliserait Linking.openURL(url)
        console.log('Opening URL:', url);
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
                        ID artiste manquant
                    </Text>
                    <Text className="text-red-500 dark:text-red-400 text-center mt-2 mb-6">
                        Impossible de charger le profil de l'artiste
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

    if (isLoading && !artist) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900 px-6">
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <Animated.View
                    entering={FadeInDown.springify()}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-8 items-center border border-gray-100 dark:border-gray-700"
                >
                    <View className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 items-center justify-center mb-4">
                        <Ionicons name="person" size={32} color="#3b82f6" />
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-lg text-center">
                        Chargement du profil...
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-center mt-2">
                        Récupération des informations de l'artiste
                    </Text>
                </Animated.View>
            </View>
        );
    }

    if (error || !artist) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900 px-6">
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <Animated.View
                    entering={FadeInDown.springify()}
                    className="bg-red-50 dark:bg-red-900/20 rounded-3xl p-8 items-center border border-red-200 dark:border-red-800"
                >
                    <Ionicons name="person-outline" size={64} color="#ef4444" />
                    <Text className="text-red-600 dark:text-red-400 font-bold text-lg mt-4 text-center">
                        Artiste introuvable
                    </Text>
                    <Text className="text-red-500 dark:text-red-400 text-center mt-2 mb-6">
                        {error || "Impossible de charger le profil de l'artiste"}
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

    const gradientColors = getAvatarGradient(artist.username);

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
                                {Array.from({ length: 40 }).map((_, i) => (
                                    <Animated.View
                                        key={i}
                                        entering={FadeInUp.delay(i * 30).springify()}
                                        className="w-6 h-6 m-1 rounded-full bg-white/30"
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

                        {/* Artist Profile Content */}
                        <View
                            className="flex-1 justify-end pb-8 px-6"
                            style={{ paddingTop: insets.top + 60 }}
                        >
                            <Animated.View entering={FadeInDown.delay(200).springify()}>
                                {/* Avatar ou Image */}
                                <View className="items-center mb-6">
                                    <View className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30">
                                        {artist.avatar_url ? (
                                            <Image
                                                source={{ uri: artist.avatar_url }}
                                                style={{ width: '100%', height: '100%' }}
                                                contentFit="cover"
                                            />
                                        ) : (
                                            <LinearGradient
                                                colors={['#667eea', '#764ba2']}
                                                className="w-full h-full items-center justify-center"
                                            >
                                                <Text className="text-white text-4xl font-bold">
                                                    {artist.username.charAt(0).toUpperCase()}
                                                </Text>
                                            </LinearGradient>
                                        )}
                                    </View>
                                </View>

                                {/* Artist Info */}
                                <View className="items-center">
                                    <Text className="text-white text-3xl font-bold mb-2">
                                        @{artist.username}
                                    </Text>
                                    <View className="flex-row items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                        <Ionicons name="musical-notes" size={16} color="white" />
                                        <Text className="text-white/90 text-sm font-medium ml-2">
                                            {albums.length} Album{albums.length !== 1 ? 's' : ''} • {tracks.length} Morceau{tracks.length !== 1 ? 'x' : ''}
                                        </Text>
                                    </View>
                                </View>
                            </Animated.View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Statistiques */}
                {/* <View className="px-6 -mt-8 mb-8">
                    <Animated.View
                        entering={FadeInUp.delay(100).springify()}
                        className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
                    >
                        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                            Aperçu de l'artiste
                        </Text>

                        <View className="flex-row justify-around">
                            <StatCard
                                icon="musical-notes"
                                label="Morceaux"
                                value={tracks.length.toString()}
                                color="#10b981"
                                delay={200}
                            />
                            <StatCard
                                icon="albums"
                                label="Albums"
                                value={albums.length.toString()}
                                color="#3b82f6"
                                delay={300}
                            />
                            <StatCard
                                icon="calendar"
                                label="Membre depuis"
                                value={new Date(artist.created_at).getFullYear().toString()}
                                color="#8b5cf6"
                                delay={400}
                            />
                        </View>
                    </Animated.View>
                </View> */}

                {/* Bio */}
                {artist.bio && (
                    <View className="px-6 mb-8">
                        <Animated.View entering={FadeInRight.delay(500).springify()}>
                            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                À propos
                            </Text>
                            <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <Text className="text-gray-700 dark:text-gray-300 leading-6 text-base">
                                    {artist.bio}
                                </Text>
                            </View>
                        </Animated.View>
                    </View>
                )}

                {/* Albums Section */}
                {albums.length > 0 && (
                    <View className="px-6 mb-8">
                        <Animated.View entering={FadeInRight.delay(600).springify()}>
                            <View className="flex-row items-center justify-between mb-6">
                                <View>
                                    <Text className="text-xl font-bold text-gray-900 dark:text-white">
                                        Albums & EPs
                                    </Text>
                                    <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {albums.length} album{albums.length > 1 ? 's' : ''} disponible{albums.length > 1 ? 's' : ''}
                                    </Text>
                                </View>
                            </View>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingRight: 24 }}
                            >
                                {albums.map((album, index) => (
                                    <AlbumCard
                                        key={album.id}
                                        album={album}
                                        onPress={handleAlbumPress}
                                        index={index}
                                    />
                                ))}
                            </ScrollView>
                        </Animated.View>
                    </View>
                )}

                {/* Morceaux Section */}
                <View className="px-6 mb-8">
                    <Animated.View entering={FadeInRight.delay(700).springify()}>
                        <View className="flex-row items-center justify-between mb-6">
                            <View>
                                <Text className="text-xl font-bold text-gray-900 dark:text-white">
                                    Tous les morceaux
                                </Text>
                                <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {tracks.length} morceau{tracks.length > 1 ? 'x' : ''} dans sa collection
                                </Text>
                            </View>
                        </View>

                        {tracks.length === 0 ? (
                            <Animated.View
                                entering={FadeInDown.delay(800).springify()}
                                className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl p-8 items-center border border-blue-200 dark:border-blue-800"
                            >
                                <Ionicons name="musical-note-outline" size={64} color="#3b82f6" />
                                <Text className="text-blue-900 dark:text-blue-300 font-semibold mt-4 text-center">
                                    Aucun morceau pour l'instant
                                </Text>
                                <Text className="text-blue-700 dark:text-blue-400 text-center mt-2">
                                    Cet artiste n'a pas encore publié de morceaux
                                </Text>
                            </Animated.View>
                        ) : (
                            <View className="space-y-3">
                                {tracks.map((track, index) => (
                                    <Animated.View
                                        key={track.id}
                                        entering={FadeInDown.delay(800 + index * 50).springify()}
                                    >
                                        <MusicItem
                                            item={track}
                                            onRemoveMusic={() => void 0}
                                        />
                                    </Animated.View>
                                ))}
                            </View>
                        )}
                    </Animated.View>
                </View>

                {/* Social Links */}
                {(artist.website || artist.instagram || artist.spotify) && (
                    <View className="px-6 mb-8">
                        <Animated.View entering={FadeInRight.delay(900).springify()}>
                            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                Liens sociaux
                            </Text>
                            <View className="space-y-4">
                                {artist.website && (
                                    <SocialLink
                                        icon="globe"
                                        label="Site web"
                                        value={artist.website}
                                        color="#10b981"
                                        onPress={() => handleSocialLinkPress(artist.website!)}
                                        delay={1000}
                                    />
                                )}
                                {artist.instagram && (
                                    <SocialLink
                                        icon="logo-instagram"
                                        label="Instagram"
                                        value={artist.instagram}
                                        color="#e1306c"
                                        onPress={() => handleSocialLinkPress(artist.instagram!)}
                                        delay={1100}
                                    />
                                )}
                                {artist.spotify && (
                                    <SocialLink
                                        icon="musical-note"
                                        label="Spotify"
                                        value={artist.spotify}
                                        color="#1db954"
                                        onPress={() => handleSocialLinkPress(artist.spotify!)}
                                        delay={1200}
                                    />
                                )}
                            </View>
                        </Animated.View>
                    </View>
                )}

                {/* Call to Action pour collaboration */}
                <Animated.View
                    entering={FadeInUp.delay(1300).springify()}
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
                                    Collaboration musicale
                                </Text>
                                <Text className="text-white/90 text-sm mb-4">
                                    Découvrez d'autres talents et créez ensemble des morceaux uniques.
                                </Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/artists')}
                                    className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl self-start"
                                >
                                    <Text className="text-white font-semibold">
                                        Explorer d'autres artistes
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View className="ml-4">
                                <Ionicons name="people" size={64} color="rgba(255,255,255,0.6)" />
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </Animated.ScrollView>
        </View>
    );
}