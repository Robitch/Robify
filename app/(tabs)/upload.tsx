import React, { useState } from 'react';
import { ScrollView, Pressable, View, Alert, Animated } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/provider/AuthProvider';
import { UserSelector } from '@/components/UserSelector';
import { useColorScheme } from '~/lib/useColorScheme';
import { cn } from '~/lib/utils';

interface UploadForm {
    title: string;
    genre: string;
    year: string;
    album?: string;
    description?: string;
}

interface User {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string | null;
}

const ACCEPTED_AUDIO_TYPES = [
    'audio/mpeg',  // MP3
    'audio/wav',   // WAV
    'audio/flac',  // FLAC
];

export default function Upload() {
    const { userProfile } = useAuth();
    const { isDarkColorScheme } = useColorScheme();
    const [form, setForm] = useState<UploadForm>({
        title: '',
        genre: '',
        year: new Date().getFullYear().toString(),
        album: '',
        description: '',
    });
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
    const [selectedArtists, setSelectedArtists] = useState<User[]>(
        userProfile ? [{
            id: userProfile.id,
            full_name: userProfile.full_name,
            username: userProfile.username,
            avatar_url: userProfile.avatar_url
        }] : []
    );
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ACCEPTED_AUDIO_TYPES,
            });

            if (result.canceled) {
                return;
            }

            setSelectedFile(result);
            setError(null);
        } catch (err) {
            setError('Erreur lors de la sélection du fichier');
            console.error('Error picking file:', err);
        }
    };

    const validateForm = () => {
        if (!selectedFile || selectedFile.canceled || !selectedFile.assets?.[0]) {
            setError('Veuillez sélectionner un fichier audio');
            return false;
        }
        if (!form.title) {
            setError('Le titre est requis');
            return false;
        }
        if (selectedArtists.length === 0) {
            setError('Veuillez sélectionner au moins un artiste');
            return false;
        }
        return true;
    };

    const handleUpload = async () => {
        if (!validateForm()) return;

        setIsUploading(true);
        setError(null);
        setSuccess(false);

        // DEBUG: Vérifier les données utilisateur
        console.log('=== UPLOAD DEBUG ===');
        console.log('userProfile:', userProfile);
        console.log('userProfile.id:', userProfile?.id);
        console.log('selectedArtists:', selectedArtists);
        console.log('form:', form);

        try {
            if (!selectedFile?.assets?.[0]) {
                throw new Error('Aucun fichier sélectionné');
            }

            const file = selectedFile.assets[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `audio/${fileName}`;

            // Upload to Supabase Storage with progress tracking
            setUploadProgress(10);

            // Convert DocumentPickerAsset to File-like object for upload
            const fileBlob = {
                uri: file.uri,
                type: file.mimeType,
                name: file.name,
            };

            console.log('Uploading file to storage...');
            console.log('filePath:', filePath);
            console.log('fileBlob:', fileBlob);

            const { error: uploadError } = await supabase.storage
                .from('files')
                .upload(filePath, fileBlob as any, {
                    contentType: file.mimeType
                });

            if (uploadError) {
                console.error('Storage upload error:', uploadError);
                throw uploadError;
            }
            console.log('File uploaded successfully!');
            setUploadProgress(60);

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('files')
                .getPublicUrl(filePath);

            setUploadProgress(70);

            // Extract user IDs directly from selected artists
            const userIds: string[] = selectedArtists.map(user => user.id);
            console.log('Selected user IDs:', userIds);

            // Handle album creation/selection (using first user)
            let albumId = null;
            if (form.album && form.album.trim() && userIds.length > 0) {
                const { data: existingAlbum } = await supabase
                    .from('albums')
                    .select('id')
                    .eq('title', form.album)
                    .eq('user_id', userIds[0])
                    .single();

                if (existingAlbum) {
                    albumId = existingAlbum.id;
                } else {
                    const albumPayload = {
                        title: form.album,
                        user_id: userIds[0],
                        release_date: form.year ? new Date(`${form.year}-01-01`) : null,
                        uploaded_by: userProfile?.id
                    };
                    console.log('Creating album with payload:', albumPayload);
                    
                    const { data: newAlbum, error: albumError } = await supabase
                        .from('albums')
                        .insert([albumPayload])
                        .select('id')
                        .single();

                    if (albumError) throw albumError;
                    albumId = newAlbum.id;
                }
            }

            setUploadProgress(90);

            // Create track record with primary user
            const trackPayload = {
                title: form.title,
                user_id: userIds[0], // Primary user/artist
                album_id: albumId,
                file_url: publicUrl,
                genre: form.genre ? [form.genre] : null,
                duration: 0, // TODO: Implement duration extraction
                uploaded_by: userProfile?.id
            };
            console.log('Creating track with payload:', trackPayload);
            
            const { data: track, error: trackError } = await supabase
                .from('tracks')
                .insert(trackPayload)
                .select()
                .single();

            if (trackError) throw trackError;

            // Create collaborations for additional users
            if (userIds.length > 1) {
                const collaborations = userIds.slice(1).map((userId, index) => ({
                    track_id: track.id,
                    user_id: userId,
                    role: 'artist'
                }));

                const { error: collabError } = await supabase
                    .from('collaborations')
                    .insert(collaborations);

                if (collabError) console.warn('Error creating collaborations:', collabError);
            }

            setUploadProgress(100);
            setSuccess(true);
            setUploadProgress(0);
            setForm({
                title: '',
                genre: '',
                year: new Date().getFullYear().toString(),
                album: '',
                description: '',
            });
            setSelectedArtists(userProfile ? [{
                id: userProfile.id,
                full_name: userProfile.full_name,
                username: userProfile.username,
                avatar_url: userProfile.avatar_url
            }] : []);
            setSelectedFile(null);

            Alert.alert(
                'Upload réussi !',
                `Le morceau "${form.title}" a été ajouté avec succès.`,
                [{ text: 'OK' }]
            );
        } catch (err) {
            setError('Erreur lors de l\'upload. Veuillez réessayer.');
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const insets = useSafeAreaInsets();

    return (
        <ScrollView
            className="flex-1 bg-background"
            style={{ paddingTop: insets.top + 8 }}
            contentContainerStyle={{
                paddingBottom: 120, // Space for floating player + tabs
            }}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View className="px-6 py-4 bg-background">
                <Text className="text-3xl font-bold text-foreground mb-2">
                    Nouveau morceau
                </Text>
                <Text className="text-base text-muted-foreground">
                    Partagez votre musique avec vos amis
                </Text>
            </View>

            <View className="px-6">
                {/* File Upload Zone */}
                <Pressable
                    style={{
                        borderWidth: 2,
                        borderStyle: 'dashed',
                        borderColor: selectedFile?.assets?.[0]
                            ? '#10b981'
                            : isDarkColorScheme ? '#374151' : '#d1d5db',
                        borderRadius: 16,
                        backgroundColor: selectedFile?.assets?.[0]
                            ? (isDarkColorScheme ? '#064e3b20' : '#d1fae520')
                            : (isDarkColorScheme ? '#1f293720' : '#f9fafb'),
                        padding: 32,
                        marginBottom: 24,
                    }}
                    onPress={pickFile}
                    disabled={isUploading}
                >
                    <View className="items-center">
                        <View
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                backgroundColor: selectedFile?.assets?.[0] ? '#10b981' : (isDarkColorScheme ? '#374151' : '#e5e7eb'),
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 16,
                            }}
                        >
                            <Ionicons
                                name={selectedFile?.assets?.[0] ? "checkmark" : "cloud-upload-outline"}
                                size={28}
                                className={selectedFile?.assets?.[0] ? 'text-white' : (isDarkColorScheme ? 'text-gray-400' : 'text-gray-500')}
                            />
                        </View>

                        <Text className={cn(
                            "text-lg font-semibold mb-2",
                            selectedFile?.assets?.[0] ? "text-primary" : "text-foreground"
                        )}>
                            {selectedFile?.assets?.[0] ? 'Fichier sélectionné' : 'Choisir un fichier audio'}
                        </Text>

                        {selectedFile?.assets?.[0] ? (
                            <View className="items-center">
                                <Text className="text-sm font-medium text-foreground mb-1">
                                    {selectedFile.assets[0].name}
                                </Text>
                                <Text className="text-xs text-muted-foreground">
                                    {(selectedFile.assets[0].size! / 1024 / 1024).toFixed(1)} MB
                                </Text>
                            </View>
                        ) : (
                            <Text className="text-sm text-muted-foreground text-center">
                                MP3, WAV, FLAC sont supportés{'\n'}Taille max: 50MB
                            </Text>
                        )}
                    </View>
                </Pressable>

                {/* Form Fields */}
                <View className="space-y-5">
                    {/* Title */}
                    <Input
                        label="Titre du morceau"
                        value={form.title}
                        onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))}
                        placeholder="Ex: Sunset Boulevard"
                        leftIcon="musical-note"
                        error={error && !form.title ? "Le titre est requis" : undefined}
                    />

                    {/* Artists Selector */}
                    <UserSelector
                        selectedUsers={selectedArtists}
                        onSelectionChange={setSelectedArtists}
                        label="Artistes"
                        placeholder="Sélectionner les artistes..."
                        error={error && selectedArtists.length === 0 ? "Au moins un artiste est requis" : undefined}
                    />

                    {/* Genre and Year in a row */}
                    <View className="flex-row gap-3">
                        <View className="flex-1">
                            <Input
                                label="Genre"
                                value={form.genre}
                                onChangeText={(text) => setForm(prev => ({ ...prev, genre: text }))}
                                placeholder="Rock, Pop, Jazz..."
                                leftIcon="radio"
                            />
                        </View>
                        <View style={{ width: 100 }}>
                            <Input
                                label="Année"
                                value={form.year}
                                onChangeText={(text) => setForm(prev => ({ ...prev, year: text }))}
                                placeholder="2024"
                                keyboardType="numeric"
                                maxLength={4}
                            />
                        </View>
                    </View>

                    {/* Album */}
                    <Input
                        label="Album (optionnel)"
                        value={form.album}
                        onChangeText={(text) => setForm(prev => ({ ...prev, album: text }))}
                        placeholder="Nom de l'album"
                        leftIcon="disc"
                    />

                    {/* Description */}
                    <Input
                        label="Description (optionnelle)"
                        value={form.description}
                        onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
                        placeholder="Racontez l'histoire de ce morceau..."
                        multiline
                        numberOfLines={3}
                        style={{ height: 80, textAlignVertical: 'top' }}
                    />

                    {/* Upload Progress */}
                    {isUploading && uploadProgress > 0 && (
                        <View
                            style={{
                                backgroundColor: isDarkColorScheme ? '#1f2937' : '#f8fafc',
                                borderRadius: 12,
                                padding: 16,
                                marginVertical: 8,
                            }}
                        >
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-sm font-medium text-foreground">
                                    Upload en cours...
                                </Text>
                                <Text className="text-sm font-bold text-primary">
                                    {Math.round(uploadProgress)}%
                                </Text>
                            </View>
                            <View
                                style={{
                                    height: 6,
                                    backgroundColor: isDarkColorScheme ? '#374151' : '#e5e7eb',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                }}
                            >
                                <Animated.View
                                    style={{
                                        height: '100%',
                                        backgroundColor: '#10b981',
                                        width: `${uploadProgress}%`,
                                        borderRadius: 3,
                                    }}
                                />
                            </View>
                        </View>
                    )}

                    {/* Success/Error Messages */}
                    {success && (
                        <View
                            style={{
                                backgroundColor: '#dcfce7',
                                borderColor: '#16a34a',
                                borderWidth: 1,
                                borderRadius: 12,
                                padding: 16,
                                marginVertical: 8,
                            }}
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="checkmark-circle" size={20} className="text-green-600" />
                                <Text className="text-green-700 font-medium ml-2">
                                    Upload réussi !
                                </Text>
                            </View>
                        </View>
                    )}

                    {error && !isUploading && (
                        <View
                            style={{
                                backgroundColor: '#fef2f2',
                                borderColor: '#ef4444',
                                borderWidth: 1,
                                borderRadius: 12,
                                padding: 16,
                                marginVertical: 8,
                            }}
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="alert-circle" size={20} className="text-red-500" />
                                <Text className="text-red-700 font-medium ml-2 flex-1">
                                    {error}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Upload Button */}
                <View className="py-6">
                    <Button
                        onPress={handleUpload}
                        disabled={isUploading || (!selectedFile?.assets?.[0])}
                        style={{
                            height: 56,
                            borderRadius: 16,
                            backgroundColor: (!selectedFile?.assets?.[0] || isUploading)
                                ? (isDarkColorScheme ? '#374151' : '#d1d5db')
                                : '#10b981',
                        }}
                    >
                        <View className="flex-row items-center justify-center">
                            {isUploading ? (
                                <>
                                    <Animated.View className="mr-2">
                                        <Ionicons name="sync" size={20} className="text-white" />
                                    </Animated.View>
                                    <Text className="text-white font-semibold text-base">
                                        Upload en cours...
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="cloud-upload" size={20} className="text-white mr-2" />
                                    <Text className="text-white font-semibold text-base ml-2">
                                        Publier le morceau
                                    </Text>
                                </>
                            )}
                        </View>
                    </Button>
                </View>
            </View>
        </ScrollView>
    );
}