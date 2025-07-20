import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useColorScheme } from '~/lib/useColorScheme';
import { Input } from '~/components/ui/input';
import { Switch } from 'react-native';
import { VersionType } from '~/types';
import { VERSION_TYPES, ACCEPTED_AUDIO_TYPES } from '~/constants/version-types';
import { cn } from '~/lib/utils';

interface AddVersionFormProps {
  trackId: string;
  showForm: boolean;
  onToggleForm: () => void;
  onVersionCreated: () => void;
  isUploading: boolean;
  onUpload: (data: {
    version_name: string;
    version_type: VersionType;
    version_notes: string;
    is_public: boolean;
    collaborators: string[];
    file: {
      uri: string;
      name: string;
      type: string;
      size: number;
    };
  }) => Promise<void>;
}

export default function AddVersionForm({
  trackId,
  showForm,
  onToggleForm,
  onVersionCreated,
  isUploading,
  onUpload
}: AddVersionFormProps) {
  const { isDarkColorScheme } = useColorScheme();

  const [uploadForm, setUploadForm] = useState({
    version_name: '',
    version_type: VersionType.DEMO,
    version_notes: '',
    is_public: true,
  });

  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);

  const resetUploadForm = () => {
    setUploadForm({
      version_name: '',
      version_type: VersionType.DEMO,
      version_notes: '',
      is_public: true,
    });
    setSelectedFile(null);
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

  const validateUploadForm = (): boolean => {
    if (!selectedFile || selectedFile.canceled || !selectedFile.assets?.[0]) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier audio');
      return false;
    }
    if (!uploadForm.version_name.trim()) {
      Alert.alert('Erreur', 'Le nom de la version est requis');
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!validateUploadForm()) return;

    const file = selectedFile!.assets![0];

    const uploadData = {
      version_name: uploadForm.version_name,
      version_type: uploadForm.version_type,
      version_notes: uploadForm.version_notes,
      is_public: uploadForm.is_public,
      collaborators: [],
      file: {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'audio/mpeg',
        size: file.size || 0,
      },
    };

    try {
      await onUpload(uploadData);
      onVersionCreated();
      resetUploadForm();
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  if (!showForm) {
    return (
      <Pressable
        onPress={onToggleForm}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          backgroundColor: 'transparent'
        }}
      >
        <View className="flex-row items-center flex-1">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDarkColorScheme ? '#064e3b' : '#d1fae5',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}
          >
            <Ionicons name="add" size={20} color="#10b981" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">
              Ajouter une version
            </Text>
            <Text className="text-sm text-muted-foreground">
              Uploader une nouvelle version de ce morceau
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-down"
          size={20}
          color={isDarkColorScheme ? '#9ca3af' : '#6b7280'}
        />
      </Pressable>
    );
  }

  return (
    <View
      style={{
        padding: 16,
        backgroundColor: isDarkColorScheme ? '#064e3b20' : '#d1fae520'
      }}
    >
      {/* Header */}
      <Pressable
        onPress={onToggleForm}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}
      >
        <View className="flex-row items-center flex-1">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#10b981',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">
              Ajouter une version
            </Text>
            <Text className="text-sm text-muted-foreground">
              Uploader une nouvelle version de ce morceau
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-up"
          size={20}
          color={isDarkColorScheme ? '#9ca3af' : '#6b7280'}
        />
      </Pressable>

      {/* Form Content */}
      <View className="space-y-4">
        {/* File Picker */}
        <View className="items-center mb-6">
          <Pressable
            onPress={pickFile}
            disabled={isUploading}
          >
            <View className="items-center">
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: selectedFile?.assets?.[0]
                    ? '#10b981'
                    : (isDarkColorScheme ? '#374151' : '#e5e7eb'),
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Ionicons
                  name={selectedFile?.assets?.[0] ? "checkmark" : "cloud-upload-outline"}
                  size={20}
                  color={selectedFile?.assets?.[0] ? '#ffffff' : (isDarkColorScheme ? '#9ca3af' : '#6b7280')}
                />
              </View>
              <Text className="text-sm font-medium text-foreground text-center">
                {selectedFile?.assets?.[0]?.name || 'Sélectionner un fichier audio'}
              </Text>
              {selectedFile?.assets?.[0]?.size && (
                <Text className="text-xs text-muted-foreground">
                  {(selectedFile.assets[0].size / (1024 * 1024)).toFixed(1)} MB
                </Text>
              )}
            </View>
          </Pressable>
        </View>

        {/* Version Name */}
        <Input
          value={uploadForm.version_name}
          onChangeText={(text) => setUploadForm(prev => ({ ...prev, version_name: text }))}
          placeholder="Nom de la version (ex: Mix Final, Version acoustique...)"
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
                  onPress={() => setUploadForm(prev => ({ ...prev, version_type: type.value }))}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: uploadForm.version_type === type.value
                      ? '#10b981'
                      : (isDarkColorScheme ? '#374151' : '#d1d5db'),
                    backgroundColor: uploadForm.version_type === type.value
                      ? (isDarkColorScheme ? '#064e3b20' : '#d1fae520')
                      : 'transparent',
                    minWidth: 70,
                  }}
                >
                  <View className="items-center">
                    <Ionicons
                      name={type.icon as any}
                      size={16}
                      color={uploadForm.version_type === type.value
                        ? '#10b981'
                        : (isDarkColorScheme ? '#9ca3af' : '#6b7280')}
                      style={{ marginBottom: 2 }}
                    />
                    <Text
                      className={cn(
                        "text-xs font-medium text-center",
                        uploadForm.version_type === type.value
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
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isDarkColorScheme ? '#374151' : '#e5e7eb',
            }}
          >
            <Input
              value={uploadForm.version_notes}
              onChangeText={(text) => setUploadForm(prev => ({ ...prev, version_notes: text }))}
              placeholder="Ex: Ajout d'une guitare lead, nouveau mixage..."
              multiline
              numberOfLines={2}
              style={{
                borderWidth: 0,
                minHeight: 60,
                textAlignVertical: 'top',
                paddingTop: 8
              }}
            />
          </View>
        </View>

        {/* Public/Private Toggle */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isDarkColorScheme ? '#374151' : '#e5e7eb',
          }}
        >
          <View className="flex-1">
            <Text className="text-sm font-medium text-foreground">
              Version publique
            </Text>
            <Text className="text-xs text-muted-foreground">
              {uploadForm.is_public
                ? 'Visible par tous vos amis'
                : 'Visible uniquement par vous'}
            </Text>
          </View>
          <Switch
            value={uploadForm.is_public}
            onValueChange={(value) => setUploadForm(prev => ({ ...prev, is_public: value }))}
            trackColor={{
              false: isDarkColorScheme ? '#374151' : '#d1d5db',
              true: '#10b981'
            }}
            thumbColor={uploadForm.is_public ? '#ffffff' : (isDarkColorScheme ? '#9ca3af' : '#f3f4f6')}
            ios_backgroundColor={isDarkColorScheme ? '#374151' : '#d1d5db'}
          />
        </View>


        {/* Upload Button */}
        <Pressable
          onPress={handleUpload}
          disabled={isUploading || !selectedFile?.assets?.[0] || !uploadForm.version_name.trim()}
          style={{
            backgroundColor: (!isUploading && selectedFile?.assets?.[0] && uploadForm.version_name.trim())
              ? '#10b981'
              : (isDarkColorScheme ? '#374151' : '#e5e7eb'),
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <Text
            className={cn(
              "font-semibold",
              (!isUploading && selectedFile?.assets?.[0] && uploadForm.version_name.trim())
                ? "text-white"
                : "text-muted-foreground"
            )}
          >
            {isUploading ? 'Upload en cours...' : 'Créer la version'}
          </Text>
        </Pressable>
      </View>

    </View>
  );
}