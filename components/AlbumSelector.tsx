import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '~/lib/useColorScheme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/provider/AuthProvider';
import { Album } from '~/types';
import { Image } from 'expo-image';

interface AlbumSelectorProps {
    onAlbumSelected: (album: Album) => void;
    onCreateNew: () => void;
    onCancel: () => void;
}

export default function AlbumSelector({ onAlbumSelected, onCreateNew, onCancel }: AlbumSelectorProps) {
    const { isDarkColorScheme } = useColorScheme();
    const { user } = useAuth();

    const [albums, setAlbums] = useState<Album[]>([]);
    const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserAlbums();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = albums.filter(album => 
                album.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredAlbums(filtered);
        } else {
            setFilteredAlbums(albums);
        }
    }, [searchQuery, albums]);

    const fetchUserAlbums = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('albums')
                .select(`
                    *,
                    tracks!inner(id)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const albumsWithCount = data.map(album => ({
                ...album,
                tracks_count: album.tracks?.length || 0,
                user_profiles: {
                    username: user.user_metadata?.username || 'unknown',
                },
            }));

            setAlbums(albumsWithCount);
        } catch (error) {
            console.error('Error fetching albums:', error);
            Alert.alert('Erreur', 'Impossible de charger vos albums');
        } finally {
            setIsLoading(false);
        }
    };

    const getAlbumTypeIcon = (albumType: string) => {
        switch (albumType) {
            case 'album': return 'albums-outline';
            case 'ep': return 'disc-outline';
            case 'single': return 'musical-note-outline';
            default: return 'musical-note-outline';
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

    const renderAlbumItem = ({ item }: { item: Album }) => (
        <TouchableOpacity
            onPress={() => onAlbumSelected(item)}
            className={`p-4 rounded-xl mb-3 ${
                isDarkColorScheme ? 'bg-gray-800/60' : 'bg-white/80'
            } border ${
                isDarkColorScheme ? 'border-gray-700/50' : 'border-gray-200/50'
            }`}
            activeOpacity={0.7}
        >
            <View className="flex-row items-center">
                {/* Artwork */}
                <View className="w-16 h-16 rounded-xl overflow-hidden mr-4">
                    {item.artwork_url ? (
                        <Image
                            source={{ uri: item.artwork_url }}
                            className="w-full h-full"
                            contentFit="cover"
                        />
                    ) : (
                        <View className={`w-full h-full ${
                            isDarkColorScheme ? 'bg-gray-700' : 'bg-gray-200'
                        } items-center justify-center`}>
                            <Ionicons 
                                name={getAlbumTypeIcon(item.album_type)} 
                                size={24} 
                                className="text-muted-foreground" 
                            />
                        </View>
                    )}
                </View>

                {/* Info */}
                <View className="flex-1 min-w-0">
                    <Text className="text-lg font-bold text-foreground mb-1" numberOfLines={1}>
                        {item.title}
                    </Text>
                    <View className="flex-row items-center gap-2 mb-1">
                        <Text className="text-sm text-primary font-medium">
                            {getAlbumTypeLabel(item.album_type)}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                            • {item.tracks_count || 0} titre{(item.tracks_count || 0) > 1 ? 's' : ''}
                        </Text>
                    </View>
                    {item.release_date && (
                        <Text className="text-xs text-muted-foreground">
                            {new Date(item.release_date).toLocaleDateString('fr-FR')}
                        </Text>
                    )}
                </View>

                {/* Arrow */}
                <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className={`flex-row items-center justify-between p-4 border-b ${
                isDarkColorScheme ? 'border-gray-800' : 'border-gray-200'
            }`}>
                <TouchableOpacity onPress={onCancel}>
                    <Text className="text-primary font-semibold">Annuler</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold text-foreground">Choisir un Album</Text>
                <TouchableOpacity onPress={onCreateNew}>
                    <Text className="text-primary font-semibold">Nouveau</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-1 p-4">
                {/* Search */}
                <View className="mb-4">
                    <Input
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Rechercher un album..."
                        className="text-base"
                    />
                </View>

                {/* Albums List */}
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-muted-foreground">Chargement...</Text>
                    </View>
                ) : filteredAlbums.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="albums-outline" size={64} className="text-muted-foreground mb-4" />
                        <Text className="text-lg font-semibold text-foreground mb-2">
                            {searchQuery ? 'Aucun résultat' : 'Aucun album'}
                        </Text>
                        <Text className="text-muted-foreground text-center mb-6">
                            {searchQuery 
                                ? 'Aucun album ne correspond à votre recherche'
                                : 'Vous n\'avez pas encore créé d\'album'
                            }
                        </Text>
                        {!searchQuery && (
                            <TouchableOpacity 
                                onPress={onCreateNew}
                                className="px-6 py-3 bg-primary rounded-xl"
                            >
                                <Text className="text-white font-semibold">Créer mon premier album</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <FlatList
                        data={filteredAlbums}
                        renderItem={renderAlbumItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
        </View>
    );
}