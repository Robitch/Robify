import React, { useState, useEffect } from 'react';
import { ScrollView, Pressable, View, Alert, Animated, Modal, TouchableOpacity } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/provider/AuthProvider';
import { useColorScheme } from '~/lib/useColorScheme';
import { cn } from '~/lib/utils';
import { Album, AlbumType, VersionType } from '~/types';
import AlbumPicker from '@/components/AlbumPicker';
import { UserSelector } from '@/components/UserSelector';
import { AUDIO_CONSTANTS, UI_CONSTANTS } from '@/constants/player';

interface UploadForm {
    title: string;
    genre: string;
    track_number?: number;
    initialVersionType: VersionType;
    versionName: string;
}

interface UserProfile {
    id: string;
    username: string;
    avatar_url?: string | null;
}


const ACCEPTED_AUDIO_TYPES = AUDIO_CONSTANTS.SUPPORTED_FORMATS;

export default function Upload() {
    const { userProfile, user } = useAuth();
    const { isDarkColorScheme } = useColorScheme();
    const [form, setForm] = useState<UploadForm>({
        title: '',
        genre: '',
        track_number: 1,
        initialVersionType: VersionType.DEMO,
        versionName: 'Version initiale',
    });
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Initialiser l'utilisateur actuel dans la liste des artistes sélectionnés
    useEffect(() => {
        if (user && userProfile && selectedUsers.length === 0) {
            const currentUser: UserProfile = {
                id: user.id,
                username: userProfile.username || '',
                avatar_url: userProfile.avatar_url || null,
            };
            setSelectedUsers([currentUser]);
        }
    }, [user, userProfile]);

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
        if (selectedUsers.length === 0) {
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

        try {
            if (!selectedFile?.assets?.[0] || !user) {
                throw new Error('Fichier ou utilisateur manquant');
            }

            const file = selectedFile.assets[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `audio/${fileName}`;

            setUploadProgress(20);

            // Upload to Supabase Storage
            const fileBlob = {
                uri: file.uri,
                type: file.mimeType,
                name: file.name,
            };

            const { error: uploadError } = await supabase.storage
                .from('files')
                .upload(filePath, fileBlob as any, {
                    contentType: file.mimeType
                });

            if (uploadError) throw uploadError;

            setUploadProgress(60);

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('files')
                .getPublicUrl(filePath);

            setUploadProgress(80);

            // Create track record
            const trackPayload = {
                title: form.title,
                user_id: selectedUsers[0].id, // Premier artiste comme propriétaire principal
                album_id: selectedAlbum ? selectedAlbum.id : null,
                track_number: selectedAlbum && form.track_number ? form.track_number : null,
                file_url: publicUrl,
                genre: form.genre ? [form.genre] : null,
                duration: 0, // Duration will be extracted during audio processing
                is_published: true,
            };

            const { data: track, error: trackError } = await supabase
                .from('tracks')
                .insert(trackPayload)
                .select()
                .single();

            if (trackError) throw trackError;

            setUploadProgress(80);

            // Créer la première version avec les colonnes requises
            const versionPayload = {
                track_id: track.id,
                version_name: form.versionName,
                version_type: form.initialVersionType,
                version_number: 'v1.0',
                file_url: publicUrl,
                duration: 0,
                file_size: file.size || 0,
                quality: '320kbps',
                is_primary: true,
                is_public: true,
                version_notes: `Type: ${form.initialVersionType} - Première version uploadée`,
            };

            const { error: versionError } = await supabase
                .from('track_versions')
                .insert(versionPayload);

            if (versionError) throw versionError;

            setUploadProgress(100);
            setSuccess(true);

            // Reset form
            setForm({
                title: '',
                genre: '',
                track_number: 1,
                initialVersionType: VersionType.DEMO,
                versionName: 'Version initiale',
            });
            setSelectedFile(null);
            setSelectedUsers([]);
            setSelectedAlbum(null);
            setUploadProgress(0);

            const albumText = selectedAlbum
                ? ` dans l'album "${selectedAlbum.title}"`
                : '';

            Alert.alert(
                'Upload réussi !',
                `Le morceau "${form.title}"${albumText} a été ajouté avec la version "${form.versionName}" (${form.initialVersionType}).`,
                [{ text: 'OK' }]
            );
        } catch (err) {
            setError('Erreur lors de l\'upload. Veuillez réessayer.');
        } finally {
            setIsUploading(false);
        }
    };

    // Handler pour la sélection d'album
    const handleAlbumSelected = (album: Album) => {
        setSelectedAlbum(album);
        
        // Calculer automatiquement le prochain numéro de track
        const nextTrackNumber = (album.tracks_count || 0) + 1;
        setForm(prev => ({ ...prev, track_number: nextTrackNumber }));
    };

    const insets = useSafeAreaInsets();

    return (
        <>
            <ScrollView
                className="flex-1 bg-background"
                style={{ paddingTop: insets.top + 8 }}
                contentContainerStyle={{
                    paddingBottom: UI_CONSTANTS.CONTENT_PADDING_BOTTOM,
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
                                    color={selectedFile?.assets?.[0] ? '#ffffff' : (isDarkColorScheme ? '#9ca3af' : '#6b7280')}
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
                                    MP3, WAV, FLAC sont supportés{'\n'}Taille max: {AUDIO_CONSTANTS.MAX_FILE_SIZE_MB}MB
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

                        {/* User Selector - Artistes collaborateurs */}
                        <UserSelector
                            selectedUsers={selectedUsers}
                            onSelectionChange={setSelectedUsers}
                            label="Artistes collaborateurs"
                            placeholder="Sélectionner les artistes..."
                        />

                        {/* Album Selection (optionnel) */}
                        <AlbumPicker
                            selectedAlbum={selectedAlbum}
                            onAlbumSelected={handleAlbumSelected}
                            onAlbumCleared={() => setSelectedAlbum(null)}
                            label="Album (optionnel)"
                            placeholder="Sélectionner un album..."
                        />

                        {/* Genre et Track Number */}
                        {selectedAlbum ? (
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
                                        label="N° de piste"
                                        value={form.track_number?.toString() || ''}
                                        onChangeText={(text) => setForm(prev => ({ ...prev, track_number: parseInt(text) || 1 }))}
                                        placeholder="1"
                                        keyboardType="numeric"
                                        maxLength={3}
                                    />
                                </View>
                            </View>
                        ) : (
                            <Input
                                label="Genre"
                                value={form.genre}
                                onChangeText={(text) => setForm(prev => ({ ...prev, genre: text }))}
                                placeholder="Rock, Pop, Jazz..."
                                leftIcon="radio"
                            />
                        )}

                        {/* Version Settings */}
                        <View>
                            <Text className="text-sm font-medium text-foreground mb-3">
                                Version initiale
                            </Text>
                            <View className="space-y-3">
                                {/* Version Name */}
                                <Input
                                    label="Nom de la version"
                                    value={form.versionName}
                                    onChangeText={(text) => setForm(prev => ({ ...prev, versionName: text }))}
                                    placeholder="Ex: Version initiale"
                                    leftIcon="create-outline"
                                />
                                
                                {/* Version Type Selector */}
                                <View>
                                    <Text className="text-sm font-medium text-foreground mb-2">
                                        Type de version
                                    </Text>
                                    <ScrollView 
                                        horizontal 
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ paddingHorizontal: 4 }}
                                    >
                                        <View className="flex-row gap-2">
                                            {[
                                                { type: VersionType.DEMO, label: 'Demo', icon: 'create-outline' },
                                                { type: VersionType.ROUGH_MIX, label: 'Rough Mix', icon: 'build-outline' },
                                                { type: VersionType.FINAL_MIX, label: 'Final Mix', icon: 'checkmark-circle-outline' },
                                                { type: VersionType.LIVE, label: 'Live', icon: 'mic-outline' },
                                                { type: VersionType.ACOUSTIC, label: 'Acoustic', icon: 'musical-note-outline' },
                                            ].map((versionType) => (
                                                <Pressable
                                                    key={versionType.type}
                                                    onPress={() => setForm(prev => ({ ...prev, initialVersionType: versionType.type }))}
                                                    style={{
                                                        paddingHorizontal: 16,
                                                        paddingVertical: 12,
                                                        borderRadius: 12,
                                                        borderWidth: 1,
                                                        borderColor: form.initialVersionType === versionType.type 
                                                            ? '#10b981' 
                                                            : (isDarkColorScheme ? '#374151' : '#d1d5db'),
                                                        backgroundColor: form.initialVersionType === versionType.type 
                                                            ? (isDarkColorScheme ? '#064e3b20' : '#d1fae520')
                                                            : 'transparent',
                                                        minWidth: 80,
                                                    }}
                                                >
                                                    <View className="items-center">
                                                        <Ionicons
                                                            name={versionType.icon as any}
                                                            size={20}
                                                            color={form.initialVersionType === versionType.type 
                                                                ? '#10b981' 
                                                                : (isDarkColorScheme ? '#9ca3af' : '#6b7280')}
                                                            style={{ marginBottom: 4 }}
                                                        />
                                                        <Text 
                                                            className={cn(
                                                                "text-xs font-medium text-center",
                                                                form.initialVersionType === versionType.type 
                                                                    ? "text-primary" 
                                                                    : "text-muted-foreground"
                                                            )}
                                                        >
                                                            {versionType.label}
                                                        </Text>
                                                    </View>
                                                </Pressable>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            </View>
                        </View>

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
                                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
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
                                    <Ionicons name="alert-circle" size={20} color="#ef4444" />
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
                                        <Animated.View style={{ marginRight: 8 }}>
                                            <Ionicons name="sync" size={20} color="#ffffff" />
                                        </Animated.View>
                                        <Text className="text-white font-semibold text-base">
                                            Upload en cours...
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload" size={20} color="#ffffff" style={{ marginRight: 8 }} />
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

        </>
    );
}