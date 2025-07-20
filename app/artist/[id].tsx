import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
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

const { width, height } = Dimensions.get('window');

interface Artist {
    id: string;
    full_name: string;
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

export default function ArtistProfile() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDarkColorScheme } = useColorScheme();

    const [artist, setArtist] = useState<Artist | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                    full_name: artistData.full_name,
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

    if (!id) {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <Text className="text-destructive">ID artiste manquant</Text>
            </View>
        );
    }

    if (isLoading && !artist) {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <Text className="text-muted-foreground">Chargement...</Text>
            </View>
        );
    }

    if (error || !artist) {
        return (
            <View className="flex-1 justify-center items-center bg-background px-6">
                <Ionicons name="person-outline" size={64} className="text-muted-foreground mb-4" />
                <Text className="text-lg font-semibold mb-2 text-center">Artiste introuvable</Text>
                <Text className="text-muted-foreground text-center mb-4">{error}</Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="px-6 py-3 bg-primary rounded-lg"
                >
                    <Text className="text-white font-semibold">Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-background"
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    tintColor="#10b981"
                    colors={["#10b981"]}
                />
            }
        >
            {/* Header avec image de couverture */}
            <View className="relative">
                <View style={{ height: height * 0.6 }}>
                    {artist.avatar_url ? (
                        <Image
                            source={{ uri: artist.avatar_url }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                        />
                    ) : (
                        <View className={`w-full h-full ${isDarkColorScheme ? 'bg-gray-800' : 'bg-gray-200'} items-center justify-center`}>
                            <Ionicons
                                name="person"
                                size={120}
                                className="text-muted-foreground"
                            />
                        </View>
                    )}
                </View>

                {/* Gradient overlay */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    className="absolute bottom-0 left-0 right-0 h-32"
                />

                {/* Back button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 left-4 w-10 h-10 items-center justify-center rounded-full bg-black/30"
                    style={{ marginTop: insets.top }}
                >
                    <Ionicons name="arrow-back" size={24} className="text-white" />
                </TouchableOpacity>

                {/* More button */}
                <TouchableOpacity
                    className="absolute top-12 right-4 w-10 h-10 items-center justify-center rounded-full bg-black/30"
                    style={{ marginTop: insets.top }}
                >
                    <Ionicons name="ellipsis-vertical" size={24} className="text-white" />
                </TouchableOpacity>

                {/* Artist info overlay */}
                <View className="absolute bottom-0 left-0 right-0 p-6">
                    <Text className="text-4xl font-bold text-white mb-2">
                        {artist.full_name}
                    </Text>
                    <Text className="text-lg text-white/80">
                        {albums.length} Album{albums.length > 1 ? 's' : ''} • {tracks.length} Track{tracks.length > 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            {/* Content */}
            <View className="px-6 py-6 space-y-8">
                {/* Bio */}
                {artist.bio && (
                    <View>
                        <Text className="text-lg font-semibold text-foreground mb-3">
                            À propos
                        </Text>
                        <Text className="text-muted-foreground leading-6">
                            {artist.bio}
                        </Text>
                    </View>
                )}

                {/* Albums Section */}
                {albums.length > 0 && (
                    <View>
                        <Text className="text-lg font-semibold text-foreground mb-4">
                            Albums
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="gap-4"
                        >
                            {albums.map((album) => (
                                <TouchableOpacity
                                    key={album.id}
                                    className="mr-4"
                                    activeOpacity={0.7}
                                    onPress={() => router.push(`/album/${album.id}`)}
                                >
                                    <View className="w-32 h-32 rounded-2xl overflow-hidden mb-3">
                                        {album.artwork_url ? (
                                            <Image
                                                source={{ uri: album.artwork_url }}
                                                className="w-full h-full"
                                                contentFit="cover"
                                            />
                                        ) : (
                                            <View className={`w-full h-full ${isDarkColorScheme ? 'bg-gray-700' : 'bg-gray-200'
                                                } items-center justify-center`}>
                                                <Ionicons
                                                    name="musical-note"
                                                    size={32}
                                                    className="text-muted-foreground"
                                                />
                                            </View>
                                        )}
                                    </View>
                                    <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                                        {album.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Songs Section */}
                <View>
                    <Text className="text-lg font-semibold text-foreground mb-4">
                        Morceaux
                    </Text>
                    {tracks.length === 0 ? (
                        <View className="py-8 items-center">
                            <Ionicons name="musical-note-outline" size={48} className="text-muted-foreground mb-4" />
                            <Text className="text-muted-foreground text-center">
                                Aucun morceau trouvé pour cet artiste
                            </Text>
                        </View>
                    ) : (
                        <View className="gap-3">
                            {tracks.map((track) => (
                                <MusicItem
                                    key={track.id}
                                    item={track}
                                    onRemoveMusic={() => void 0}
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* Social Links */}
                {(artist.website || artist.instagram || artist.spotify) && (
                    <View>
                        <Text className="text-lg font-semibold text-foreground mb-4">
                            Liens
                        </Text>
                        <View className="gap-3">
                            {artist.website && (
                                <TouchableOpacity className="flex-row items-center">
                                    <Ionicons name="globe" size={20} className="text-muted-foreground mr-3" />
                                    <Text className="text-primary">{artist.website}</Text>
                                </TouchableOpacity>
                            )}
                            {artist.instagram && (
                                <TouchableOpacity className="flex-row items-center">
                                    <Ionicons name="logo-instagram" size={20} className="text-muted-foreground mr-3" />
                                    <Text className="text-primary">{artist.instagram}</Text>
                                </TouchableOpacity>
                            )}
                            {artist.spotify && (
                                <TouchableOpacity className="flex-row items-center">
                                    <Ionicons name="musical-note" size={20} className="text-muted-foreground mr-3" />
                                    <Text className="text-primary">{artist.spotify}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </View>

            {/* Bottom padding for floating player */}
            <View style={{ height: 120 }} />
        </ScrollView>
    );
}