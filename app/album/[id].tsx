import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
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

const { width, height } = Dimensions.get('window');

export default function AlbumPage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDarkColorScheme } = useColorScheme();

    const [album, setAlbum] = useState<Album | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            <View className="flex-1 justify-center items-center bg-background">
                <Text className="text-destructive">ID album manquant</Text>
            </View>
        );
    }

    if (isLoading && !album) {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <Text className="text-muted-foreground">Chargement...</Text>
            </View>
        );
    }

    if (error || !album) {
        return (
            <View className="flex-1 justify-center items-center bg-background px-6">
                <Ionicons name="albums-outline" size={64} className="text-muted-foreground mb-4" />
                <Text className="text-lg font-semibold mb-2 text-center">Album introuvable</Text>
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
                <View style={{ height: height * 0.5 }}>
                    {album.artwork_url ? (
                        <Image
                            source={{ uri: album.artwork_url }}
                            className="w-full h-full"
                            contentFit="cover"
                        />
                    ) : (
                        <View className={`w-full h-full ${isDarkColorScheme ? 'bg-gray-800' : 'bg-gray-200'} items-center justify-center`}>
                            <Ionicons 
                                name="albums-outline" 
                                size={120} 
                                className="text-muted-foreground" 
                            />
                        </View>
                    )}
                </View>

                {/* Gradient overlay */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
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

                {/* Album info overlay */}
                <View className="absolute bottom-0 left-0 right-0 p-6">
                    <Text className="text-sm text-white/80 font-medium mb-1">
                        {getAlbumTypeLabel(album.album_type)}
                    </Text>
                    <Text className="text-4xl font-bold text-white mb-2">
                        {album.title}
                    </Text>
                    <TouchableOpacity 
                        onPress={() => router.push(`/artist/${album.user_id}`)}
                        className="flex-row items-center"
                    >
                        <Text className="text-lg text-white/90 font-medium">
                            @{album.user_profiles?.username}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} className="text-white/70 ml-1" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Album Details */}
            <View className="px-6 py-6">
                <View className="flex-row items-center justify-between mb-6">
                    <View className="flex-row items-center gap-4">
                        <Text className="text-muted-foreground">
                            {tracks.length} titre{tracks.length > 1 ? 's' : ''}
                        </Text>
                        {tracks.some(t => t.duration) && (
                            <>
                                <Text className="text-muted-foreground">•</Text>
                                <Text className="text-muted-foreground">
                                    {getTotalDuration()}
                                </Text>
                            </>
                        )}
                        {album.release_date && (
                            <>
                                <Text className="text-muted-foreground">•</Text>
                                <Text className="text-muted-foreground">
                                    {album.release_year || new Date(album.release_date).getFullYear()}
                                </Text>
                            </>
                        )}
                    </View>
                    
                    <TouchableOpacity className="w-12 h-12 bg-primary rounded-full items-center justify-center">
                        <Ionicons name="play" size={24} className="text-white" style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                </View>

                {/* Description */}
                {album.description && (
                    <View className="mb-6">
                        <Text className="text-base text-muted-foreground leading-6">
                            {album.description}
                        </Text>
                    </View>
                )}

                {/* Release Date */}
                {album.release_date && (
                    <View className="mb-6">
                        <Text className="text-sm text-muted-foreground">
                            Sorti le {formatReleaseDate(album.release_date)}
                        </Text>
                    </View>
                )}

                {/* Tracks List */}
                <View>
                    <Text className="text-lg font-semibold text-foreground mb-4">
                        Titres
                    </Text>
                    {tracks.length === 0 ? (
                        <View className="py-8 items-center">
                            <Ionicons name="musical-note-outline" size={48} className="text-muted-foreground mb-4" />
                            <Text className="text-muted-foreground text-center">
                                Aucun titre dans cet album
                            </Text>
                        </View>
                    ) : (
                        <View className="gap-2">
                            {tracks.map((track, index) => (
                                <View key={track.id} className="flex-row items-center">
                                    {/* Track Number */}
                                    <View className="w-8 mr-3">
                                        <Text className="text-sm text-muted-foreground text-center">
                                            {track.track_number || index + 1}
                                        </Text>
                                    </View>
                                    
                                    {/* Track */}
                                    <View className="flex-1">
                                        <MusicItem
                                            item={track}
                                            onRemoveMusic={() => void 0}
                                            showArtwork={false}
                                            compact={true}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Bottom spacing for floating player */}
                <View style={{ height: 120 }} />
            </View>
        </ScrollView>
    );
}