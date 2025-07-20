import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from '~/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '~/lib/useColorScheme';
import { useRouter } from 'expo-router';

interface Artist {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string;
    bio?: string;
    tracks_count: number;
    created_at: string;
}

export default function Artists() {
    const insets = useSafeAreaInsets();
    const { isDarkColorScheme } = useColorScheme();
    const router = useRouter();
    const [artists, setArtists] = useState<Artist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchArtists();
    }, []);

    const fetchArtists = async (isRefresh = false) => {
        try {
            if (isRefresh) setIsRefreshing(true);

            // Récupérer tous les utilisateurs qui ont uploadé au moins une track
            // D'abord, récupérer tous les utilisateurs
            const { data: usersData, error: usersError } = await supabase
                .from('user_profiles')
                .select('id, full_name, username, avatar_url, bio, created_at');

            if (usersError) throw usersError;

            // Ensuite, compter les tracks pour chaque utilisateur
            const artistsWithCount = await Promise.all(
                usersData.map(async (user) => {
                    const { count, error: countError } = await supabase
                        .from('tracks')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', user.id);

                    return {
                        ...user,
                        tracks_count: count || 0
                    };
                })
            );

            // Filtrer seulement ceux qui ont des tracks
            const filteredArtists = artistsWithCount.filter(artist => artist.tracks_count > 0);

            setArtists(filteredArtists as Artist[]);
            console.log('Artists:', filteredArtists);
        } catch (err) {
            setError('Erreur lors du chargement des artistes');
            console.error('Error fetching artists:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = () => {
        fetchArtists(true);
    };

    const handleArtistPress = (artist: Artist) => {
        router.push(`/artist/${artist.id}`);
    };

    return (
        <ScrollView
            className="flex-1 bg-background"
            style={{ paddingTop: insets.top + 16 }}
            contentContainerStyle={{
                paddingBottom: 120, // Space for floating player + tabs
            }}
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
            {/* Header */}
            <View className="px-6 py-4">
                <Text className="text-3xl font-bold text-foreground mb-2">
                    Artistes
                </Text>
                <Text className="text-base text-muted-foreground">
                    Découvrez tous les artistes de votre cercle musical
                </Text>
                {artists.length > 0 && (
                    <Text className="text-sm text-muted-foreground mt-1">
                        {artists.length} artiste{artists.length > 1 ? 's' : ''} trouvé{artists.length > 1 ? 's' : ''}
                    </Text>
                )}
            </View>

            {/* Artists List */}
            <View className="px-6">
                {isLoading ? (
                    <View className="py-8">
                        <Text className="text-center text-muted-foreground">Chargement...</Text>
                    </View>
                ) : error ? (
                    <View className="py-8">
                        <Text className="text-center text-destructive">{error}</Text>
                    </View>
                ) : artists.length === 0 ? (
                    <View className="mt-8 p-8 bg-muted/20 rounded-lg items-center">
                        <Ionicons
                            name="people-outline"
                            size={48}
                            className="text-muted-foreground mb-4"
                        />
                        <Text className="text-lg font-semibold mb-2 text-center">
                            Aucun artiste trouvé
                        </Text>
                        <Text className="text-center text-muted-foreground">
                            La liste des artistes apparaîtra une fois que vos amis commenceront à uploader leur musique.
                        </Text>
                    </View>
                ) : (
                    <View className="gap-4">
                        {artists.map((artist) => (
                            <TouchableOpacity
                                key={artist.id}
                                className={`p-4 rounded-2xl ${isDarkColorScheme ? 'bg-gray-800/60' : 'bg-white/80'
                                    } shadow-sm`}
                                onPress={() => handleArtistPress(artist)}
                                activeOpacity={0.7}
                            >
                                <View className="flex-row items-center">
                                    {/* Avatar */}
                                    <View className="w-16 h-16 rounded-full overflow-hidden mr-4">
                                        {artist.avatar_url ? (
                                            <Image
                                                source={{ uri: artist.avatar_url }}
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        ) : (
                                            <View className={`w-full h-full ${isDarkColorScheme ? 'bg-gray-700' : 'bg-gray-200'
                                                } items-center justify-center`}>
                                                <Ionicons
                                                    name="person"
                                                    size={24}
                                                    color={isDarkColorScheme ? '#fff' : '#000'}
                                                />
                                            </View>
                                        )}
                                    </View>

                                    {/* Artist Info */}
                                    <View className="flex-1">
                                        <Text className="text-lg font-bold text-foreground mb-1">
                                            {artist.full_name}
                                        </Text>
                                        <Text className="text-sm text-muted-foreground mb-2">
                                            @{artist.username}
                                        </Text>
                                        <Text className="text-xs text-primary">
                                            {artist.tracks_count} morceau{artist.tracks_count > 1 ? 'x' : ''}
                                        </Text>
                                    </View>

                                    {/* Arrow */}
                                    <Ionicons
                                        name="chevron-forward"
                                        size={20}
                                        className="text-muted-foreground"
                                    />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}