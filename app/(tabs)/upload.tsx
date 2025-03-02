import React, { useState } from 'react';
import { ScrollView, Pressable, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';

interface UploadForm {
    title: string;
    artist: string;
    genre: string;
    year: string;
}

const ACCEPTED_AUDIO_TYPES = [
    'audio/mpeg',  // MP3
    'audio/wav',   // WAV
    'audio/flac',  // FLAC
];

export default function Upload() {
    const [form, setForm] = useState<UploadForm>({
        title: '',
        artist: '',
        genre: '',
        year: '',
    });
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
    const [isUploading, setIsUploading] = useState(false);
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
        if (!form.title || !form.artist) {
            setError('Le titre et l\'artiste sont requis');
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
            if (!selectedFile?.assets?.[0]) {
                throw new Error('Aucun fichier sélectionné');
            }

            const file = selectedFile.assets[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `audio/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('files')
                .upload(filePath, file, {
                    contentType: file.mimeType
                });

            if (uploadError) throw uploadError;

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('files')
                .getPublicUrl(filePath);

            // Create artist if doesn't exist
            const { data: artistData, error: artistError } = await supabase
                .from('artists')
                .upsert([
                    { name: form.artist }
                ])
                .select()
                .single();

            if (artistError) throw artistError;

            // Create track record
            const { error: trackError } = await supabase
                .from('tracks')
                .insert([
                    {
                        title: form.title,
                        artist_id: artistData.id,
                        file_url: publicUrl,
                        duration: 0, // TODO: Implement duration extraction
                    }
                ]);

            if (trackError) throw trackError;

            setSuccess(true);
            setForm({ title: '', artist: '', genre: '', year: '' });
            setSelectedFile(null);
        } catch (err) {
            setError('Erreur lors de l\'upload. Veuillez réessayer.');
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <ScrollView className="flex-1  p-4">
            {/* <BlurView intensity={80} className="absolute inset-0" /> */}
            <View className=" p-4 rounded-lg shadow-md">
                <Text className="text-2xl font-bold mb-4">Uploader un morceau</Text>

                <Pressable
                    className="flex items-center justify-center p-8  border-2 border-dashed rounded-lg mb-4"
                    onPress={pickFile}
                    disabled={isUploading}>
                    <Ionicons name="cloud-upload-outline" size={32} className="text-gray-500" />
                    <Text className="mt-2 text-lg ">
                        {selectedFile?.assets?.[0] ? 'Fichier sélectionné' : 'Sélectionner un fichier audio'}
                    </Text>
                    {selectedFile?.assets?.[0] && (
                        <Text className="mt-2 text-sm text-gray-500">{selectedFile.assets[0].name}</Text>
                    )}
                </Pressable>

                <View className="space-y-4">
                    <View>
                        <Text className="text-sm font-semibold  mb-1">Titre</Text>
                        <Input
                            className=" input rounded-lg"
                            value={form.title}
                            onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))}
                            placeholder="Titre du morceau"
                            placeholderTextColor="#666"
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-semibold  mb-1">Artiste</Text>
                        <Input
                            className=" input rounded-lg"
                            value={form.artist}
                            onChangeText={(text) => setForm(prev => ({ ...prev, artist: text }))}
                            placeholder="Nom de l'artiste"
                            placeholderTextColor="#666"
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-semibold  mb-1">Genre</Text>
                        <Input
                            className=" input rounded-lg"
                            value={form.genre}
                            onChangeText={(text) => setForm(prev => ({ ...prev, genre: text }))}
                            placeholder="Genre musical"
                            placeholderTextColor="#666"
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-semibold  mb-1">Année</Text>
                        <Input
                            className=" input rounded-lg"
                            value={form.year}
                            onChangeText={(text) => setForm(prev => ({ ...prev, year: text }))}
                            placeholder="Année de sortie"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                        />
                    </View>

                    {error && (
                        <Text className="text-red-500 mb-4">{error}</Text>
                    )}

                    {success && (
                        <Text className="text-green-500 mb-4">Upload réussi !</Text>
                    )}

                    <Button
                        className={`bg-black p-4 rounded-lg ${isUploading ? 'opacity-50' : ''}`}
                        onPress={handleUpload}
                        disabled={isUploading}>
                        <Text className="text-white text-center font-semibold">
                            {isUploading ? 'Upload en cours...' : 'Uploader'}
                        </Text>
                    </Button>
                </View>
            </View>
        </ScrollView>
    );
}