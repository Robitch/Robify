import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '~/lib/useColorScheme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/provider/AuthProvider';
import { Album, AlbumType } from '~/types';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');

interface AlbumCreatorProps {
    onAlbumCreated: (album: Album) => void;
    onCancel: () => void;
}

export default function AlbumCreator({ onAlbumCreated, onCancel }: AlbumCreatorProps) {
    const { isDarkColorScheme } = useColorScheme();
    const { user } = useAuth();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [albumType, setAlbumType] = useState<AlbumType>('album');
    const [releaseDate, setReleaseDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [artworkUri, setArtworkUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const albumTypes: { type: AlbumType; label: string; icon: string }[] = [
        { type: 'album', label: 'Album', icon: 'albums-outline' },
        { type: 'ep', label: 'EP', icon: 'disc-outline' },
        { type: 'single', label: 'Single', icon: 'musical-note-outline' },
    ];

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setArtworkUri(result.assets[0].uri);
        }
    };

    const uploadArtwork = async (uri: string): Promise<string | null> => {
        try {
            const filename = `album-artwork-${Date.now()}.jpg`;
            const formData = new FormData();

            formData.append('file', {
                uri,
                type: 'image/jpeg',
                name: filename,
            } as any);

            const { data, error } = await supabase.storage
                .from('album-artwork')
                .upload(filename, formData, {
                    contentType: 'image/jpeg',
                });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('album-artwork')
                .getPublicUrl(data.path);

            return urlData.publicUrl;
        } catch (error) {
            console.error('Error uploading artwork:', error);
            return null;
        }
    };

    const createAlbum = async () => {
        if (!title.trim()) {
            Alert.alert('Erreur', 'Le titre de l\'album est requis');
            return;
        }

        if (!user) {
            Alert.alert('Erreur', 'Vous devez être connecté');
            return;
        }

        setIsLoading(true);

        try {
            let artworkUrl: string | null = null;

            if (artworkUri) {
                artworkUrl = await uploadArtwork(artworkUri);
            }

            const albumData = {
                title: title.trim(),
                description: description.trim() || null,
                album_type: albumType,
                release_date: releaseDate ? releaseDate.toISOString().split('T')[0] : null,
                release_year: releaseDate ? releaseDate.getFullYear() : null,
                artwork_url: artworkUrl,
                user_id: user.id,
                is_public: true,
            };

            const { data, error } = await supabase
                .from('albums')
                .insert([albumData])
                .select('*')
                .single();

            if (error) throw error;

            const albumWithProfile: Album = {
                ...data,
                user_profiles: {
                    full_name: user.user_metadata?.full_name || 'Unknown',
                    username: user.user_metadata?.username || 'unknown',
                },
                tracks_count: 0,
            };

            onAlbumCreated(albumWithProfile);

        } catch (error) {
            console.error('Error creating album:', error);
            Alert.alert('Erreur', 'Impossible de créer l\'album');
        } finally {
            setIsLoading(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setReleaseDate(selectedDate);
        }
    };

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className={`flex-row items-center justify-between p-4 border-b ${isDarkColorScheme ? 'border-gray-800' : 'border-gray-200'
                }`}>
                <TouchableOpacity onPress={onCancel}>
                    <Text className="text-primary font-semibold">Annuler</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold text-foreground">Nouvel Album</Text>
                <TouchableOpacity
                    onPress={createAlbum}
                    disabled={isLoading || !title.trim()}
                >
                    <Text className={`font-semibold ${isLoading || !title.trim()
                        ? 'text-muted-foreground'
                        : 'text-primary'
                        }`}>
                        {isLoading ? 'Création...' : 'Créer'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="flex-1 p-6">
                {/* Artwork */}
                <View className="items-center mb-8">
                    <TouchableOpacity
                        onPress={pickImage}
                        className={`w-40 h-40 rounded-2xl overflow-hidden ${isDarkColorScheme ? 'bg-gray-800' : 'bg-gray-100'
                            } items-center justify-center`}
                    >
                        {artworkUri ? (
                            <Image
                                source={{ uri: artworkUri }}
                                className="w-full h-full"
                                contentFit="cover"
                            />
                        ) : (
                            <View className="items-center">
                                <Ionicons
                                    name="camera-outline"
                                    size={32}
                                    className="text-muted-foreground mb-2"
                                />
                                <Text className="text-sm text-muted-foreground">
                                    Ajouter une pochette
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Title */}
                <View className="mb-6">
                    <Text className="text-base font-semibold text-foreground mb-2">
                        Titre *
                    </Text>
                    <Input
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Nom de l'album"
                        className="text-lg"
                    />
                </View>

                {/* Description */}
                <View className="mb-6">
                    <Text className="text-base font-semibold text-foreground mb-2">
                        Description
                    </Text>
                    <Input
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Description de l'album (optionnel)"
                        multiline
                        numberOfLines={3}
                        style={{ textAlignVertical: 'top' }}
                    />
                </View>

                {/* Album Type */}
                <View className="mb-6">
                    <Text className="text-base font-semibold text-foreground mb-3">
                        Type
                    </Text>
                    <View className="flex-row gap-3">
                        {albumTypes.map((type) => (
                            <TouchableOpacity
                                key={type.type}
                                onPress={() => setAlbumType(type.type)}
                                className={`flex-1 p-4 rounded-xl border ${albumType === type.type
                                    ? 'border-primary bg-primary/10'
                                    : isDarkColorScheme
                                        ? 'border-gray-700 bg-gray-800/50'
                                        : 'border-gray-200 bg-gray-50'
                                    }`}
                            >
                                <View className="items-center">
                                    <Ionicons
                                        name={type.icon as any}
                                        size={24}
                                        className={albumType === type.type ? 'text-primary' : 'text-muted-foreground'}
                                    />
                                    <Text className={`mt-2 font-medium ${albumType === type.type ? 'text-primary' : 'text-foreground'
                                        }`}>
                                        {type.label}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Release Date */}
                <View className="mb-6">
                    <Text className="text-base font-semibold text-foreground mb-2">
                        Date de sortie
                    </Text>
                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        className={`p-4 rounded-xl border ${isDarkColorScheme ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                            }`}
                    >
                        <View className="flex-row items-center justify-between">
                            <Text className={releaseDate ? 'text-foreground' : 'text-muted-foreground'}>
                                {releaseDate
                                    ? releaseDate.toLocaleDateString('fr-FR')
                                    : 'Sélectionner une date (optionnel)'
                                }
                            </Text>
                            <Ionicons name="calendar-outline" size={20} className="text-muted-foreground" />
                        </View>
                    </TouchableOpacity>

                    {/* {showDatePicker && (
                        <DateTimePicker
                            value={releaseDate || new Date()}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                        />
                    )} */}
                </View>
            </View>
        </View>
    );
}