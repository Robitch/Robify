import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '~/lib/useColorScheme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/provider/AuthProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Album } from '~/types';
import { Image } from 'expo-image';
import AlbumCreator from '@/components/AlbumCreator';

interface AlbumPickerProps {
    selectedAlbum: Album | null;
    onAlbumSelected: (album: Album) => void;
    onAlbumCleared: () => void;
    label?: string;
    placeholder?: string;
    error?: string;
}

export default function AlbumPicker({
    selectedAlbum,
    onAlbumSelected,
    onAlbumCleared,
    label = "Album (optionnel)",
    placeholder = "Sélectionner un album...",
    error
}: AlbumPickerProps) {
    const { isDarkColorScheme } = useColorScheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    
    const [isOpen, setIsOpen] = useState(false);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCreator, setShowCreator] = useState(false);

    const fetchAlbums = async () => {
        if (!user) return;
        
        setLoading(true);
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

            // Compter les tracks pour chaque album
            const albumsWithCount = data?.map(album => ({
                ...album,
                tracks_count: album.tracks?.length || 0
            })) || [];

            setAlbums(albumsWithCount);
        } catch (err) {
            console.error('Error fetching albums:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchAlbums();
        }
    }, [isOpen, user]);

    const filteredAlbums = albums.filter(album =>
        album.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAlbumSelect = (album: Album) => {
        onAlbumSelected(album);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleCreateNew = () => {
        setShowCreator(true);
    };

    const handleAlbumCreated = (album: Album) => {
        setShowCreator(false);
        onAlbumSelected(album);
        setIsOpen(false);
        setSearchQuery('');
    };

    const borderColor = error
        ? '#ef4444'
        : isDarkColorScheme
            ? '#374151'
            : '#e5e7eb';

    return (
        <View className="w-full">
            {label && (
                <Text className="text-sm font-medium text-foreground mb-2">
                    {label}
                </Text>
            )}

            {/* Selector Button */}
            <Pressable
                style={{
                    borderWidth: 1.5,
                    borderColor,
                    borderRadius: 12,
                    backgroundColor: isDarkColorScheme ? '#1f2937' : '#ffffff',
                    minHeight: 52,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                }}
                onPress={() => setIsOpen(true)}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                        {!selectedAlbum ? (
                            <Text className="text-muted-foreground">
                                {placeholder}
                            </Text>
                        ) : (
                            <View className="flex-row items-center">
                                {selectedAlbum.artwork_url && (
                                    <Image
                                        source={{ uri: selectedAlbum.artwork_url }}
                                        style={{ 
                                            width: 32, 
                                            height: 32, 
                                            borderRadius: 6,
                                            marginRight: 12 
                                        }}
                                    />
                                )}
                                <View className="flex-1">
                                    <Text className="text-foreground font-medium">
                                        {selectedAlbum.title}
                                    </Text>
                                    <Text className="text-muted-foreground text-xs">
                                        {selectedAlbum.album_type?.toUpperCase()} • {selectedAlbum.tracks_count || 0} titre{(selectedAlbum.tracks_count || 0) > 1 ? 's' : ''}
                                    </Text>
                                </View>
                                <Pressable 
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        onAlbumCleared();
                                    }}
                                    style={{ marginLeft: 8 }}
                                >
                                    <Ionicons name="close-circle" size={20} color={isDarkColorScheme ? '#9ca3af' : '#6b7280'} />
                                </Pressable>
                            </View>
                        )}
                    </View>
                    {!selectedAlbum && (
                        <Ionicons
                            name="chevron-down"
                            size={20}
                            color={isDarkColorScheme ? '#9ca3af' : '#6b7280'}
                        />
                    )}
                </View>
            </Pressable>

            {error && (
                <Text className="text-sm mt-1 text-red-500">
                    {error}
                </Text>
            )}

            {/* Modal */}
            <Modal
                visible={isOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsOpen(false)}
            >
                <View
                    className="flex-1 bg-background"
                    style={{ paddingTop: insets.top + 8 }}
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
                        <View>
                            <Text className="text-xl font-bold text-foreground">
                                Sélectionner un album
                            </Text>
                            <Text className="text-sm text-muted-foreground mt-1">
                                Ou créer un nouveau
                            </Text>
                        </View>
                        <Button
                            variant="ghost"
                            size="icon"
                            onPress={() => setIsOpen(false)}
                        >
                            <Ionicons name="close" size={24} color={isDarkColorScheme ? '#f9fafb' : '#111827'} />
                        </Button>
                    </View>

                    {/* Search */}
                    <View className="px-6 py-4">
                        <Input
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Rechercher un album..."
                            leftIcon="search"
                        />
                    </View>

                    {/* Create New Button */}
                    <View className="px-6 pb-4">
                        <TouchableOpacity
                            onPress={handleCreateNew}
                            style={{
                                backgroundColor: isDarkColorScheme ? '#065f46' : '#d1fae5',
                                borderRadius: 12,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: '#10b981',
                            }}
                        >
                            <View className="flex-row items-center justify-center">
                                <Ionicons name="add-circle" size={20} color="#10b981" style={{ marginRight: 8 }} />
                                <Text className="text-primary font-semibold">
                                    Créer un nouvel album
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Albums List */}
                    <ScrollView className="flex-1 px-6">
                        {loading ? (
                            <View className="py-8 items-center">
                                <Text className="text-muted-foreground">Chargement...</Text>
                            </View>
                        ) : filteredAlbums.length === 0 ? (
                            <View className="py-8 items-center">
                                <Ionicons name="albums-outline" size={48} color={isDarkColorScheme ? '#6b7280' : '#9ca3af'} />
                                <Text className="text-muted-foreground mt-4 text-center">
                                    {searchQuery ? 'Aucun album trouvé' : 'Vous n\'avez pas encore d\'album'}
                                </Text>
                                {!searchQuery && (
                                    <Text className="text-muted-foreground text-sm text-center mt-2">
                                        Créez votre premier album ci-dessus
                                    </Text>
                                )}
                            </View>
                        ) : (
                            <View className="gap-2 pb-4">
                                {filteredAlbums.map((album) => (
                                    <TouchableOpacity
                                        key={album.id}
                                        style={{
                                            borderRadius: 12,
                                            padding: 16,
                                            backgroundColor: isDarkColorScheme ? '#374151' : '#f9fafb',
                                            borderWidth: 1,
                                            borderColor: isDarkColorScheme ? '#4b5563' : '#e5e7eb',
                                        }}
                                        onPress={() => handleAlbumSelect(album)}
                                    >
                                        <View className="flex-row items-center gap-3">
                                            {/* Album Artwork */}
                                            <View
                                                style={{
                                                    width: 50,
                                                    height: 50,
                                                    borderRadius: 8,
                                                    backgroundColor: isDarkColorScheme ? '#6b7280' : '#d1d5db',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {album.artwork_url ? (
                                                    <Image
                                                        source={{ uri: album.artwork_url }}
                                                        style={{ width: 50, height: 50, borderRadius: 8 }}
                                                    />
                                                ) : (
                                                    <Ionicons
                                                        name="albums"
                                                        size={24}
                                                        color={isDarkColorScheme ? '#9ca3af' : '#6b7280'}
                                                    />
                                                )}
                                            </View>

                                            {/* Album Info */}
                                            <View className="flex-1">
                                                <Text className="font-semibold text-foreground">
                                                    {album.title}
                                                </Text>
                                                <Text className="text-sm text-muted-foreground">
                                                    {album.album_type?.toUpperCase()} • {album.tracks_count || 0} titre{(album.tracks_count || 0) > 1 ? 's' : ''}
                                                </Text>
                                                {album.release_date && (
                                                    <Text className="text-xs text-muted-foreground mt-1">
                                                        {new Date(album.release_date).getFullYear()}
                                                    </Text>
                                                )}
                                            </View>

                                            {/* Arrow */}
                                            <Ionicons 
                                                name="chevron-forward" 
                                                size={20} 
                                                color={isDarkColorScheme ? '#9ca3af' : '#6b7280'} 
                                            />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>

            {/* Album Creator Modal */}
            {showCreator && (
                <Modal
                    visible={showCreator}
                    animationType="slide"
                    presentationStyle="fullScreen"
                >
                    <AlbumCreator
                        onAlbumCreated={handleAlbumCreated}
                        onCancel={() => setShowCreator(false)}
                    />
                </Modal>
            )}
        </View>
    );
}