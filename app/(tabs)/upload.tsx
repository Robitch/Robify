import React, { useState, useEffect } from 'react';
import { ScrollView, Pressable, View, Alert, Modal, TouchableOpacity, Dimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  ZoomIn,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface UploadForm {
    title: string;
    genre: string;
    track_number?: number;
    initialVersionType: VersionType;
    versionName: string;
    description?: string;
    bpm?: number;
    key?: string;
    mood?: string;
}

interface UserProfile {
    id: string;
    username: string;
    avatar_url?: string | null;
}


const ACCEPTED_AUDIO_TYPES = AUDIO_CONSTANTS.SUPPORTED_FORMATS;

// Fonction pour extraire la durée d'un fichier audio
const getAudioDuration = async (uri: string): Promise<number> => {
    try {
        const sound = new Audio.Sound();
        await sound.loadAsync({ uri });
        const status = await sound.getStatusAsync();
        await sound.unloadAsync();
        
        if (status.isLoaded && status.durationMillis) {
            return Math.round(status.durationMillis / 1000); // Convertir en secondes
        }
        return 0;
    } catch (error) {
        console.warn('Erreur lors de l\'extraction de la durée:', error);
        return 0;
    }
};

export default function Upload() {
    const { userProfile, user } = useAuth();
    const { isDarkColorScheme } = useColorScheme();
    const [form, setForm] = useState<UploadForm>({
        title: '',
        genre: '',
        track_number: 1,
        initialVersionType: VersionType.DEMO,
        versionName: 'Version initiale',
        description: '',
        bpm: undefined,
        key: '',
        mood: '',
    });
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
    const [selectedArtwork, setSelectedArtwork] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showUserSelector, setShowUserSelector] = useState(false);
    const [showAlbumPicker, setShowAlbumPicker] = useState(false);

    // Animations
    const progressScale = useSharedValue(0);
    const advancedRotation = useSharedValue(0);

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
                type: Array.from(ACCEPTED_AUDIO_TYPES),
            });

            if (result.canceled) {
                return;
            }

            setSelectedFile(result);
            // set le nom du fichier dans le formulaire
            setForm(prev => ({ ...prev, title: result.assets[0].name.split('.').slice(0, -1).join('.') }));
            setError(null);
        } catch (err) {
            setError('Erreur lors de la sélection du fichier');
        }
    };

    const pickArtwork = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setSelectedArtwork(result.assets[0]);
            }
        } catch (err) {
            setError('Erreur lors de la sélection de l\'image');
        }
    };

    // Animation pour les paramètres avancés
    const toggleAdvanced = () => {
        setShowAdvanced(!showAdvanced);
        advancedRotation.value = withSpring(showAdvanced ? 0 : 180);
    };

    const advancedIconStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${advancedRotation.value}deg` }],
    }));

    const progressAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: progressScale.value }],
    }));

    useEffect(() => {
        if (uploadProgress > 0) {
            progressScale.value = withSpring(1);
        } else {
            progressScale.value = withSpring(0);
        }
    }, [uploadProgress]);

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

            setUploadProgress(70);

            // Upload artwork if selected
            let artworkUrl = null;
            if (selectedArtwork) {
                try {
                    const artworkExt = selectedArtwork.uri.split('.').pop() || 'jpg';
                    const artworkFileName = `${Date.now()}.${artworkExt}`;
                    const artworkPath = `artwork/${artworkFileName}`;

                    // Create a blob from the artwork
                    const artworkBlob = {
                        uri: selectedArtwork.uri,
                        type: selectedArtwork.mimeType || 'image/jpeg',
                        name: artworkFileName,
                    };

                    const { error: artworkUploadError } = await supabase.storage
                        .from('album-artwork')
                        .upload(artworkPath, artworkBlob as any, {
                            contentType: selectedArtwork.mimeType || 'image/jpeg'
                        });

                    if (artworkUploadError) {
                        console.warn('Erreur lors de l\'upload de l\'artwork:', artworkUploadError);
                    } else {
                        // Get the public URL for the artwork
                        const { data: { publicUrl: artworkPublicUrl } } = supabase.storage
                            .from('album-artwork')
                            .getPublicUrl(artworkPath);
                        
                        artworkUrl = artworkPublicUrl;
                        console.log('Artwork uploadée avec succès:', artworkUrl);
                    }
                } catch (artworkError) {
                    console.warn('Erreur lors de l\'upload de l\'artwork:', artworkError);
                }
            }

            setUploadProgress(75);

            // Extract audio duration
            const audioDuration = await getAudioDuration(file.uri);
            console.log('Durée audio extraite:', audioDuration, 'secondes');

            setUploadProgress(80);

            // Create track record
            const trackPayload = {
                title: form.title,
                user_id: selectedUsers[0].id, // Premier artiste comme propriétaire principal
                album_id: selectedAlbum ? selectedAlbum.id : null,
                track_number: selectedAlbum && form.track_number ? form.track_number : null,
                file_url: publicUrl,
                artwork_url: artworkUrl,
                genre: form.genre ? [form.genre] : null,
                duration: audioDuration,
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
                duration: audioDuration,
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
                description: '',
                bpm: undefined,
                key: '',
                mood: '',
            });
            setSelectedFile(null);
            setSelectedArtwork(null);
            setSelectedUsers([]);
            setSelectedAlbum(null);
            setUploadProgress(0);
            setShowAdvanced(false);
            advancedRotation.value = 0;

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
        <View className="flex-1 bg-gray-50 dark:bg-gray-900">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: UI_CONSTANTS.CONTENT_PADDING_BOTTOM + 20,
                }}
            >
                {/* Hero Header avec Gradient */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2', '#f093fb']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="relative"
                        style={{ paddingTop: insets.top + 20, paddingBottom: 40 }}
                    >
                        {/* Pattern Background */}
                        <View className="absolute inset-0 opacity-10">
                            <View className="flex-row flex-wrap">
                                {Array.from({ length: 30 }).map((_, i) => (
                                    <View
                                        key={i}
                                        className="w-6 h-6 m-1 rounded-full bg-white/20"
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Header Content */}
                        <View className="px-6 pt-4">
                            <Text className="text-white text-3xl font-bold mb-2">
                                Nouveau morceau
                            </Text>
                            <Text className="text-white/90 text-base">
                                Partagez votre musique avec vos amis
                            </Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Main Content */}
                <View className="px-6 -mt-6">
                    {/* Upload Card */}
                    <Animated.View
                        entering={FadeInUp.delay(200).springify()}
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6"
                    >
                        {/* File Upload Zone */}
                        <View className="p-6">
                            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                📁 Fichier audio
                            </Text>
                            <Pressable
                                style={{
                                    borderWidth: 2,
                                    borderStyle: 'dashed',
                                    borderColor: selectedFile?.assets?.[0]
                                        ? '#10b981'
                                        : isDarkColorScheme ? '#374151' : '#d1d5db',
                                    borderRadius: 20,
                                    backgroundColor: selectedFile?.assets?.[0]
                                        ? (isDarkColorScheme ? '#064e3b20' : '#d1fae520')
                                        : (isDarkColorScheme ? '#1f293720' : '#f9fafb'),
                                    padding: 32,
                                }}
                                onPress={pickFile}
                                disabled={isUploading}
                            >
                                <View className="items-center">
                                    <LinearGradient
                                        colors={selectedFile?.assets?.[0] ? ['#10b981', '#059669'] : ['#e5e7eb', '#d1d5db']}
                                        className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
                                    >
                                        <Ionicons
                                            name={selectedFile?.assets?.[0] ? "checkmark" : "cloud-upload-outline"}
                                            size={28}
                                            color={selectedFile?.assets?.[0] ? '#ffffff' : '#6b7280'}
                                        />
                                    </LinearGradient>

                                    <Text className={cn(
                                        "text-lg font-semibold mb-2",
                                        selectedFile?.assets?.[0] ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
                                    )}>
                                        {selectedFile?.assets?.[0] ? 'Fichier sélectionné' : 'Choisir un fichier audio'}
                                    </Text>

                                    {selectedFile?.assets?.[0] ? (
                                        <View className="items-center">
                                            <Text className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                                {selectedFile.assets[0].name}
                                            </Text>
                                            <Text className="text-xs text-gray-500 dark:text-gray-400">
                                                {(selectedFile.assets[0].size! / 1024 / 1024).toFixed(1)} MB
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                            MP3, WAV, FLAC sont supportés{'\n'}Taille max: {AUDIO_CONSTANTS.MAX_FILE_SIZE_MB}MB
                                        </Text>
                                    )}
                                </View>
                            </Pressable>
                        </View>
                    </Animated.View>

                    {/* Basic Info Card */}
                    <Animated.View
                        entering={FadeInUp.delay(300).springify()}
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6"
                    >
                        <View className="p-6">
                            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                🎵 Informations principales
                            </Text>
                            
                            {/* Title */}
                            <View className="mb-4">
                                <Input
                                    label="Titre du morceau"
                                    value={form.title}
                                    onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))}
                                    placeholder="Ex: Sunset Boulevard"
                                    leftIcon="musical-note"
                                    error={error && !form.title ? "Le titre est requis" : undefined}
                                />
                            </View>

                            {/* Artists Selection */}
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Artistes collaborateurs
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowUserSelector(true)}
                                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 flex-row items-center justify-between"
                                >
                                    <View className="flex-row items-center flex-1">
                                        <Ionicons name="people-outline" size={20} color="#6b7280" className="mr-3" />
                                        <View className="flex-1">
                                            {selectedUsers.length > 0 ? (
                                                <Text className="text-gray-900 dark:text-white font-medium">
                                                    {selectedUsers.map(u => u.username).join(', ')}
                                                </Text>
                                            ) : (
                                                <Text className="text-gray-500 dark:text-gray-400">
                                                    Sélectionner les artistes...
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </View>

                            {/* Album Selection */}
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Album (optionnel)
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowAlbumPicker(true)}
                                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 flex-row items-center justify-between"
                                >
                                    <View className="flex-row items-center flex-1">
                                        <Ionicons name="albums-outline" size={20} color="#6b7280" className="mr-3" />
                                        <View className="flex-1">
                                            {selectedAlbum ? (
                                                <Text className="text-gray-900 dark:text-white font-medium">
                                                    {selectedAlbum.title}
                                                </Text>
                                            ) : (
                                                <Text className="text-gray-500 dark:text-gray-400">
                                                    Sélectionner un album...
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </View>

                            {/* Genre */}
                            <View className="mb-4">
                                <Input
                                    label="Genre"
                                    value={form.genre}
                                    onChangeText={(text) => setForm(prev => ({ ...prev, genre: text }))}
                                    placeholder="Rock, Pop, Jazz..."
                                    leftIcon="radio"
                                />
                            </View>

                            {/* Track Number (if album selected) */}
                            {selectedAlbum && (
                                <View className="mb-4">
                                    <Input
                                        label="N° de piste"
                                        value={form.track_number?.toString() || ''}
                                        onChangeText={(text) => setForm(prev => ({ ...prev, track_number: parseInt(text) || 1 }))}
                                        placeholder="1"
                                        keyboardType="numeric"
                                        maxLength={3}
                                    />
                                </View>
                            )}
                        </View>
                    </Animated.View>

                    {/* Artwork Card */}
                    <Animated.View
                        entering={FadeInUp.delay(400).springify()}
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6"
                    >
                        <View className="p-6">
                            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                🎨 Artwork (optionnel)
                            </Text>
                            
                            <TouchableOpacity
                                onPress={pickArtwork}
                                className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden"
                            >
                                {selectedArtwork ? (
                                    <View className="relative">
                                        <Image
                                            source={{ uri: selectedArtwork.uri }}
                                            style={{ width: '100%', height: 200 }}
                                            contentFit="cover"
                                        />
                                        <View className="absolute inset-0 bg-black/20 items-center justify-center">
                                            <View className="bg-white/90 dark:bg-gray-800/90 rounded-xl px-4 py-2">
                                                <Text className="text-sm font-medium text-gray-900 dark:text-white">
                                                    Toucher pour changer
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    <View className="h-32 items-center justify-center">
                                        <LinearGradient
                                            colors={['#667eea', '#764ba2']}
                                            className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
                                        >
                                            <Ionicons name="image-outline" size={28} color="white" />
                                        </LinearGradient>
                                        <Text className="text-gray-900 dark:text-white font-medium">
                                            Ajouter une image
                                        </Text>
                                        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Format carré recommandé
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Advanced Settings */}
                    <Animated.View
                        entering={FadeInUp.delay(500).springify()}
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6"
                    >
                        <TouchableOpacity
                            onPress={toggleAdvanced}
                            className="p-6 flex-row items-center justify-between"
                        >
                            <View className="flex-row items-center">
                                <LinearGradient
                                    colors={['#8b5cf6', '#a855f7']}
                                    className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                                >
                                    <Ionicons name="settings-outline" size={18} color="white" />
                                </LinearGradient>
                                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                                    Paramètres avancés
                                </Text>
                            </View>
                            <Animated.View style={advancedIconStyle}>
                                <Ionicons name="chevron-down" size={20} color="#6b7280" />
                            </Animated.View>
                        </TouchableOpacity>

                        {showAdvanced && (
                            <Animated.View
                                entering={FadeInDown.springify()}
                                className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700"
                            >
                                <View className="pt-4 space-y-4">
                                    {/* Version Settings */}
                                    <View>
                                        <Text className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                            Version initiale
                                        </Text>
                                        
                                        <View className="mb-4">
                                            <Input
                                                label="Nom de la version"
                                                value={form.versionName}
                                                onChangeText={(text) => setForm(prev => ({ ...prev, versionName: text }))}
                                                placeholder="Ex: Version initiale"
                                                leftIcon="create-outline"
                                            />
                                        </View>

                                        <Text className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                            Type de version
                                        </Text>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            className="mb-4"
                                        >
                                            <View className="flex-row gap-3">
                                                {[
                                                    { type: VersionType.DEMO, label: 'Demo', icon: 'create-outline', color: '#3b82f6' },
                                                    { type: VersionType.ROUGH_MIX, label: 'Rough Mix', icon: 'build-outline', color: '#f59e0b' },
                                                    { type: VersionType.FINAL_MIX, label: 'Final Mix', icon: 'checkmark-circle-outline', color: '#10b981' },
                                                    { type: VersionType.LIVE, label: 'Live', icon: 'mic-outline', color: '#ef4444' },
                                                    { type: VersionType.ACOUSTIC, label: 'Acoustic', icon: 'musical-note-outline', color: '#8b5cf6' },
                                                ].map((versionType) => (
                                                    <TouchableOpacity
                                                        key={versionType.type}
                                                        onPress={() => setForm(prev => ({ ...prev, initialVersionType: versionType.type }))}
                                                        className={cn(
                                                            "px-4 py-3 rounded-xl border items-center min-w-20",
                                                            form.initialVersionType === versionType.type
                                                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                                : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                                                        )}
                                                    >
                                                        <Ionicons
                                                            name={versionType.icon as any}
                                                            size={20}
                                                            color={form.initialVersionType === versionType.type ? '#10b981' : versionType.color}
                                                            style={{ marginBottom: 4 }}
                                                        />
                                                        <Text
                                                            className={cn(
                                                                "text-xs font-medium text-center",
                                                                form.initialVersionType === versionType.type
                                                                    ? "text-green-600 dark:text-green-400"
                                                                    : "text-gray-600 dark:text-gray-400"
                                                            )}
                                                        >
                                                            {versionType.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </ScrollView>
                                    </View>

                                    {/* Description */}
                                    <View>
                                        <Input
                                            label="Description"
                                            value={form.description || ''}
                                            onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
                                            placeholder="Décrivez votre morceau..."
                                            leftIcon="document-text-outline"
                                            multiline
                                            numberOfLines={3}
                                        />
                                    </View>

                                    {/* Musical Info */}
                                    <View className="flex-row gap-3">
                                        <View className="flex-1">
                                            <Input
                                                label="BPM"
                                                value={form.bpm?.toString() || ''}
                                                onChangeText={(text) => setForm(prev => ({ ...prev, bpm: parseInt(text) || undefined }))}
                                                placeholder="120"
                                                keyboardType="numeric"
                                                leftIcon="speedometer-outline"
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Input
                                                label="Tonalité"
                                                value={form.key || ''}
                                                onChangeText={(text) => setForm(prev => ({ ...prev, key: text }))}
                                                placeholder="C Major"
                                                leftIcon="musical-notes-outline"
                                            />
                                        </View>
                                    </View>

                                    {/* Mood */}
                                    <View>
                                        <Input
                                            label="Ambiance"
                                            value={form.mood || ''}
                                            onChangeText={(text) => setForm(prev => ({ ...prev, mood: text }))}
                                            placeholder="Énergique, Mélancolique, Joyeux..."
                                            leftIcon="happy-outline"
                                        />
                                    </View>
                                </View>
                            </Animated.View>
                        )}
                    </Animated.View>

                    {/* Upload Progress */}
                    {isUploading && uploadProgress > 0 && (
                        <Animated.View
                            style={progressAnimatedStyle}
                            className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6"
                        >
                            <View className="p-6">
                                <View className="flex-row items-center mb-4">
                                    <LinearGradient
                                        colors={['#10b981', '#059669']}
                                        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                                    >
                                        <Ionicons name="cloud-upload" size={18} color="white" />
                                    </LinearGradient>
                                    <Text className="text-lg font-bold text-gray-900 dark:text-white">
                                        Upload en cours...
                                    </Text>
                                    <Text className="text-lg font-bold text-green-600 dark:text-green-400 ml-auto">
                                        {Math.round(uploadProgress)}%
                                    </Text>
                                </View>
                                <View className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <Animated.View
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${uploadProgress}%`,
                                            backgroundColor: '#10b981',
                                        }}
                                    />
                                </View>
                            </View>
                        </Animated.View>
                    )}

                    {/* Success/Error Messages */}
                    {success && (
                        <Animated.View
                            entering={ZoomIn.springify()}
                            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 mb-6"
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                                <Text className="text-green-700 dark:text-green-400 font-semibold ml-3">
                                    Upload réussi !
                                </Text>
                            </View>
                        </Animated.View>
                    )}

                    {error && !isUploading && (
                        <Animated.View
                            entering={ZoomIn.springify()}
                            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6"
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="alert-circle" size={24} color="#ef4444" />
                                <Text className="text-red-700 dark:text-red-400 font-semibold ml-3 flex-1">
                                    {error}
                                </Text>
                            </View>
                        </Animated.View>
                    )}

                    {/* Upload Button */}
                    <Animated.View
                        entering={FadeInUp.delay(600).springify()}
                        className="mb-6"
                    >
                        <TouchableOpacity
                            onPress={handleUpload}
                            disabled={isUploading || (!selectedFile?.assets?.[0])}
                            className={cn(
                                "rounded-2xl h-14 overflow-hidden",
                                (!selectedFile?.assets?.[0] || isUploading) && "opacity-50"
                            )}
                        >
                            <LinearGradient
                                colors={(!selectedFile?.assets?.[0] || isUploading)
                                    ? ['#9ca3af', '#6b7280']
                                    : ['#667eea', '#764ba2']}
                                className="flex-1 flex-row items-center justify-center"
                            >
                                {isUploading ? (
                                    <>
                                        <Animated.View style={{ marginRight: 12 }}>
                                            <Ionicons name="sync" size={24} color="#ffffff" />
                                        </Animated.View>
                                        <Text className="text-white font-bold text-lg">
                                            Upload en cours...
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload" size={24} color="#ffffff" style={{ marginRight: 12 }} />
                                        <Text className="text-white font-bold text-lg">
                                            Publier le morceau
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ScrollView>

            {/* User Selector Modal */}
            <Modal
                visible={showUserSelector}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View className="flex-1 bg-gray-50 dark:bg-gray-900">
                    <UserSelector
                        selectedUsers={selectedUsers}
                        onSelectionChange={setSelectedUsers}
                        label="Artistes collaborateurs"
                        placeholder="Sélectionner les artistes..."
                    />
                    <View className="p-6">
                        <TouchableOpacity
                            onPress={() => setShowUserSelector(false)}
                            className="bg-blue-500 rounded-2xl h-12 items-center justify-center"
                        >
                            <Text className="text-white font-bold text-lg">
                                Confirmer
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Album Picker Modal */}
            <Modal
                visible={showAlbumPicker}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View className="flex-1 bg-gray-50 dark:bg-gray-900">
                    <AlbumPicker
                        selectedAlbum={selectedAlbum}
                        onAlbumSelected={handleAlbumSelected}
                        onAlbumCleared={() => setSelectedAlbum(null)}
                        label="Album (optionnel)"
                        placeholder="Sélectionner un album..."
                    />
                    <View className="p-6">
                        <TouchableOpacity
                            onPress={() => setShowAlbumPicker(false)}
                            className="bg-blue-500 rounded-2xl h-12 items-center justify-center"
                        >
                            <Text className="text-white font-bold text-lg">
                                Confirmer
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}