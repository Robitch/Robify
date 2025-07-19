import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { router } from 'expo-router';
import { Text } from '~/components/ui/text';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/provider/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface ProfileSetupFormData {
  bio: string;
  location: string;
  website: string;
  instagram: string;
  spotify: string;
}

export default function ProfileSetup() {
  const insets = useSafeAreaInsets();
  const { updateProfile, userProfile, loading } = useAuth();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<ProfileSetupFormData>();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const onSubmit = async (data: ProfileSetupFormData) => {
    setIsUploading(true);
    
    try {
      await updateProfile({
        bio: data.bio || undefined,
        location: data.location || undefined,
        website: data.website || undefined,
        instagram: data.instagram || undefined,
        spotify: data.spotify || undefined,
        avatar_url: avatarUri || undefined,
      });
      
      Alert.alert(
        'Profil configuré !',
        'Votre profil a été configuré avec succès. Bienvenue sur Robify !',
        [
          {
            text: 'Continuer',
            onPress: () => router.replace('/home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la configuration du profil.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const skipSetup = () => {
    Alert.alert(
      'Passer cette étape ?',
      'Vous pourrez toujours configurer votre profil plus tard depuis les paramètres.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Passer',
          onPress: () => router.replace('/home'),
        },
      ]
    );
  };

  return (
    <ScrollView 
      className="flex-1 px-6"
      style={{
        paddingTop: insets.top + 40,
        paddingBottom: insets.bottom + 25,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="gap-4 mb-8">
        <Text className="text-3xl font-bold text-center">
          Configurez votre profil
        </Text>
        <Text className="text-center text-muted-foreground text-lg">
          Aidez vos amis à vous reconnaître et à découvrir votre univers musical
        </Text>
      </View>

      {/* Avatar Section */}
      <View className="items-center mb-8">
        <TouchableOpacity
          onPress={pickImage}
          className="w-32 h-32 rounded-full bg-muted justify-center items-center mb-4"
        >
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{ width: 128, height: 128, borderRadius: 64 }}
            />
          ) : (
            <View className="w-32 h-32 rounded-full bg-muted justify-center items-center">
              <Ionicons name="person" size={40} className="text-muted-foreground" />
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={pickImage} className="flex-row items-center gap-2">
          <Ionicons name="camera" size={20} className="text-primary" />
          <Text className="text-primary font-semibold">
            {avatarUri ? 'Changer la photo' : 'Ajouter une photo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View className="gap-4">
        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <Text className="text-sm font-semibold mb-2">
                Bio {userProfile?.role === 'artist' && '(Décrivez votre style musical)'}
              </Text>
              <Input
                className="h-24"
                placeholder={
                  userProfile?.role === 'artist' 
                    ? "Artiste hip-hop de Paris, je mélange les sonorités urbaines avec des influences jazz..."
                    : "Passionné de musique, j'adore découvrir de nouveaux artistes et styles..."
                }
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
                textAlignVertical="top"
                style={{ paddingTop: 12 }}
              />
            </View>
          )}
          name="bio"
        />

        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <Text className="text-sm font-semibold mb-2">
                Localisation
              </Text>
              <Input
                placeholder="Paris, France"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            </View>
          )}
          name="location"
        />

        {userProfile?.role === 'artist' && (
          <>
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <Text className="text-sm font-semibold mb-2">
                    Site web
                  </Text>
                  <Input
                    placeholder="https://monsite.com"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
              )}
              name="website"
            />

            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <Text className="text-sm font-semibold mb-2">
                    Instagram
                  </Text>
                  <Input
                    placeholder="@moncompte"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                  />
                </View>
              )}
              name="instagram"
            />

            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <Text className="text-sm font-semibold mb-2">
                    Spotify
                  </Text>
                  <Input
                    placeholder="Nom d'artiste sur Spotify"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                </View>
              )}
              name="spotify"
            />
          </>
        )}

        {/* Submit button */}
        <Button
          className="w-full mt-6"
          style={{ height: 60, borderRadius: 30 }}
          disabled={isUploading || loading}
          onPress={handleSubmit(onSubmit)}
        >
          <Text className="text-foreground text-lg font-bold">
            {isUploading ? 'Configuration...' : 'Finaliser mon profil'}
          </Text>
        </Button>

        {/* Skip button */}
        <TouchableOpacity onPress={skipSetup} className="mt-4">
          <Text className="text-center text-muted-foreground">
            Passer cette étape
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}