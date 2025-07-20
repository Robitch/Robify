import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  ScrollView, 
  Pressable, 
  Alert,
  Animated 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useColorScheme } from '~/lib/useColorScheme';
import { cn } from '~/lib/utils';
import { UserSelector } from '@/components/UserSelector';
import { 
  VersionType, 
  VersionUploadData,
  TrackVersion 
} from '@/types';
import { useVersions } from '@/hooks/useVersions';
import { supabase } from '@/lib/supabase';

interface VersionUploadModalProps {
  visible: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
  onVersionCreated?: (version: TrackVersion) => void;
}

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string | null;
}

const VERSION_TYPES = [
  { value: VersionType.DEMO, label: 'Demo', icon: 'create-outline' },
  { value: VersionType.ROUGH_MIX, label: 'Rough Mix', icon: 'build-outline' },
  { value: VersionType.FINAL_MIX, label: 'Final Mix', icon: 'checkmark-circle-outline' },
  { value: VersionType.REMASTER, label: 'Remaster', icon: 'diamond-outline' },
  { value: VersionType.REMIX, label: 'Remix', icon: 'shuffle-outline' },
  { value: VersionType.RADIO_EDIT, label: 'Radio Edit', icon: 'radio-outline' },
  { value: VersionType.EXTENDED_MIX, label: 'Extended Mix', icon: 'time-outline' },
  { value: VersionType.LIVE, label: 'Live', icon: 'mic-outline' },
  { value: VersionType.ACOUSTIC, label: 'Acoustic', icon: 'musical-note-outline' },
  { value: VersionType.INSTRUMENTAL, label: 'Instrumental', icon: 'piano-outline' },
];

const ACCEPTED_AUDIO_TYPES = [
  'audio/mpeg',  // MP3
  'audio/wav',   // WAV
  'audio/flac',  // FLAC
  'audio/m4a',   // M4A
];

export default function VersionUploadModal({
  visible,
  onClose,
  trackId,
  trackTitle,
  onVersionCreated
}: VersionUploadModalProps) {
  const { isDarkColorScheme } = useColorScheme();
  const { createVersion, loading, error } = useVersions();
  
  const [form, setForm] = useState({
    version_name: '',
    version_type: VersionType.DEMO,
    version_notes: '',
    is_public: true,
  });
  
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      resetForm();
      loadExistingCollaborators();
    }
  }, [visible]);

  // Charger les collaborateurs existants du track
  const loadExistingCollaborators = async () => {
    try {
      const { data: collaborations, error } = await supabase
        .from('collaborations')
        .select(`
          user_id,
          user_profiles!collaborations_user_id_fkey (
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('track_id', trackId);

      if (error) throw error;

      const existingCollaborators = collaborations?.map(collab => ({
        id: collab.user_profiles.id,
        full_name: collab.user_profiles.full_name,
        username: collab.user_profiles.username,
        avatar_url: collab.user_profiles.avatar_url,
      })) || [];

      setSelectedUsers(existingCollaborators);
    } catch (error) {
      console.error('Error loading collaborators:', error);
      // En cas d'erreur, on garde une liste vide pour ne pas bloquer l'utilisateur
      setSelectedUsers([]);
    }
  };

  const resetForm = () => {
    setForm({
      version_name: '',
      version_type: VersionType.DEMO,
      version_notes: '',
      is_public: true,
    });
    setSelectedFile(null);
    setSelectedUsers([]);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ACCEPTED_AUDIO_TYPES,
      });

      if (!result.canceled) {
        setSelectedFile(result);
      }
    } catch (err) {
      console.error('Error picking file:', err);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const validateForm = (): boolean => {
    if (!selectedFile || selectedFile.canceled || !selectedFile.assets?.[0]) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier audio');
      return false;
    }
    if (!form.version_name.trim()) {
      Alert.alert('Erreur', 'Le nom de la version est requis');
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    const file = selectedFile!.assets![0];
    
    const uploadData: VersionUploadData = {
      version_name: form.version_name,
      version_type: form.version_type,
      version_notes: form.version_notes,
      is_public: form.is_public,
      collaborators: selectedUsers.map(u => u.id),
      file: {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'audio/mpeg',
        size: file.size || 0,
      },
    };

    setIsUploading(true);
    
    try {
      const newVersion = await createVersion(trackId, uploadData);
      
      if (newVersion) {
        Alert.alert(
          'Succès !', 
          `La version "${form.version_name}" a été créée avec succès.`,
          [{ 
            text: 'OK', 
            onPress: () => {
              onVersionCreated?.(newVersion);
              onClose();
            }
          }]
        );
      }
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Erreur', 'Échec de l\'upload. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
    }
  };

  const selectedTypeInfo = VERSION_TYPES.find(t => t.value === form.version_type);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">
              Nouvelle version
            </Text>
            <Text className="text-sm text-muted-foreground">
              {trackTitle}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="p-2 -mr-2"
            disabled={isUploading}
          >
            <Ionicons 
              name="close" 
              size={24} 
              color={isDarkColorScheme ? '#9ca3af' : '#6b7280'} 
            />
          </Pressable>
        </View>

        <ScrollView 
          className="flex-1 p-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
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
              padding: 24,
              marginBottom: 20,
            }}
            onPress={pickFile}
            disabled={isUploading}
          >
            <View className="items-center">
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: selectedFile?.assets?.[0] 
                    ? '#10b981' 
                    : (isDarkColorScheme ? '#374151' : '#e5e7eb'),
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name={selectedFile?.assets?.[0] ? "checkmark" : "cloud-upload-outline"}
                  size={24}
                  color={selectedFile?.assets?.[0] ? '#ffffff' : (isDarkColorScheme ? '#9ca3af' : '#6b7280')}
                />
              </View>

              <Text className={cn(
                "text-base font-medium mb-1",
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
                  MP3, WAV, FLAC, M4A
                </Text>
              )}
            </View>
          </Pressable>

          {/* Form Fields */}
          <View className="space-y-4">
            {/* Version Name */}
            <Input
              label="Nom de la version"
              value={form.version_name}
              onChangeText={(text) => setForm(prev => ({ ...prev, version_name: text }))}
              placeholder="Ex: Final Mix v2"
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
                  {VERSION_TYPES.map((type) => (
                    <Pressable
                      key={type.value}
                      onPress={() => setForm(prev => ({ ...prev, version_type: type.value }))}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: form.version_type === type.value 
                          ? '#10b981' 
                          : (isDarkColorScheme ? '#374151' : '#d1d5db'),
                        backgroundColor: form.version_type === type.value 
                          ? (isDarkColorScheme ? '#064e3b20' : '#d1fae520')
                          : 'transparent',
                        minWidth: 80,
                      }}
                    >
                      <View className="items-center">
                        <Ionicons
                          name={type.icon as any}
                          size={20}
                          color={form.version_type === type.value 
                            ? '#10b981' 
                            : (isDarkColorScheme ? '#9ca3af' : '#6b7280')}
                          style={{ marginBottom: 4 }}
                        />
                        <Text 
                          className={cn(
                            "text-xs font-medium text-center",
                            form.version_type === type.value 
                              ? "text-primary" 
                              : "text-muted-foreground"
                          )}
                        >
                          {type.label}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Version Notes */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Notes de version (optionnel)
              </Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: isDarkColorScheme ? '#374151' : '#d1d5db',
                  borderRadius: 12,
                  backgroundColor: isDarkColorScheme ? '#1f2937' : '#ffffff',
                }}
              >
                <Input
                  value={form.version_notes}
                  onChangeText={(text) => setForm(prev => ({ ...prev, version_notes: text }))}
                  placeholder="Ex: Ajout d'une guitare lead, nouveau mixage..."
                  multiline
                  numberOfLines={3}
                  style={{ 
                    borderWidth: 0,
                    minHeight: 80,
                    textAlignVertical: 'top',
                    paddingTop: 12
                  }}
                />
              </View>
            </View>

            {/* Artistes */}
            <UserSelector
              selectedUsers={selectedUsers}
              onSelectionChange={setSelectedUsers}
              label="Artistes (optionnel)"
              placeholder="Ajouter des artistes..."
            />

            {/* Public/Private Toggle */}
            <Pressable
              onPress={() => setForm(prev => ({ ...prev, is_public: !prev.is_public }))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                borderRadius: 12,
                backgroundColor: isDarkColorScheme ? '#1f2937' : '#f8fafc',
                borderWidth: 1,
                borderColor: isDarkColorScheme ? '#374151' : '#e5e7eb',
              }}
            >
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">
                  Version publique
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {form.is_public 
                    ? 'Visible par tous vos amis' 
                    : 'Visible uniquement par vous'}
                </Text>
              </View>
              <View
                style={{
                  width: 50,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: form.is_public ? '#10b981' : '#6b7280',
                  justifyContent: 'center',
                  paddingHorizontal: 3,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#ffffff',
                    transform: [{ translateX: form.is_public ? 20 : 0 }],
                  }}
                />
              </View>
            </Pressable>

            {/* Upload Progress */}
            {isUploading && (
              <View
                style={{
                  backgroundColor: isDarkColorScheme ? '#1f2937' : '#f8fafc',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-medium text-foreground">
                    Upload en cours...
                  </Text>
                  <Ionicons name="sync" size={16} color="#10b981" />
                </View>
                <Text className="text-xs text-muted-foreground">
                  Création de votre nouvelle version
                </Text>
              </View>
            )}

            {/* Error Display */}
            {error && (
              <View
                style={{
                  backgroundColor: '#fef2f2',
                  borderColor: '#ef4444',
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="alert-circle" size={16} color="#ef4444" />
                  <Text className="text-red-700 font-medium ml-2 flex-1">
                    {error}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View 
          style={{
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: isDarkColorScheme ? '#374151' : '#e5e7eb',
            backgroundColor: isDarkColorScheme ? '#111827' : '#ffffff',
          }}
        >
          <Button
            onPress={handleUpload}
            disabled={isUploading || !selectedFile?.assets?.[0] || !form.version_name.trim()}
            style={{
              height: 50,
              borderRadius: 12,
              backgroundColor: (!selectedFile?.assets?.[0] || !form.version_name.trim() || isUploading)
                ? (isDarkColorScheme ? '#374151' : '#d1d5db')
                : '#10b981',
            }}
          >
            <View className="flex-row items-center justify-center">
              {isUploading ? (
                <>
                  <Ionicons name="sync" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text className="text-white font-semibold text-base">
                    Création...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text className="text-white font-semibold text-base">
                    Créer la version
                  </Text>
                </>
              )}
            </View>
          </Button>
        </View>
      </View>
    </Modal>
  );
}