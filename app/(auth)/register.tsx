import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '~/components/ui/text';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/provider/AuthProvider';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { signUp, loading, error, clearError } = useAuth();
  const { invitationCode } = useLocalSearchParams<{ invitationCode: string }>();

  const { control, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormData>(
    {
      defaultValues: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      },
    }
  );
  const password = watch("password");

  const onSubmit = async (data: RegisterFormData) => {
    clearError();

    if (data.password !== data.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await signUp(data.email, data.password, {
        username: data.username,
      });

      // Mark invitation code as used if provided
      if (invitationCode) {
        // TODO: Mark invitation code as used in database
      }

      // Navigate to home directly for now (bypass profile setup)
      router.replace('/home');
    } catch (error) {
      Alert.alert(
        'Erreur d\'inscription',
        'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.'
      );
    }
  };

  return (
    <ScrollView
      className="flex-1 px-6"
      style={{
        // paddingTop: insets.top + 40,
        paddingBottom: insets.bottom + 25,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <Image
        source={require("@/assets/images/logo.svg")}
        contentFit="contain"
        style={{
          width: "70%",
          height: 50,
          alignSelf: 'center',
          marginBottom: 30,
        }}
      />

      {/* Title */}
      <View className="gap-4 mb-8">
        <Text className="text-3xl font-bold text-center">
          Créer un compte
        </Text>
        <Text className="text-center text-muted-foreground text-lg">
          Rejoignez la communauté musicale de vos amis
        </Text>
      </View>


      {/* Form */}
      <View className="gap-4">

        <Controller
          control={control}
          rules={{
            required: 'Le nom d\'utilisateur est requis',
            minLength: {
              value: 3,
              message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <Input
                className={errors.username ? 'border-red-500' : ''}
                placeholder="Nom d'utilisateur"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
                autoComplete="username"
              />
              {errors.username && (
                <Text className="text-red-500 mt-1">
                  {errors.username.message}
                </Text>
              )}
            </View>
          )}
          name="username"
        />

        <Controller
          control={control}
          rules={{
            required: 'L\'email est requis',
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: 'Veuillez entrer un email valide',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <Input
                className={errors.email ? 'border-red-500' : ''}
                placeholder="Email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {errors.email && (
                <Text className="text-red-500 mt-1">
                  {errors.email.message}
                </Text>
              )}
            </View>
          )}
          name="email"
        />

        <Controller
          control={control}
          rules={{
            required: 'Le mot de passe est requis',
            minLength: {
              value: 6,
              message: 'Le mot de passe doit contenir au moins 6 caractères',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <Input
                className={errors.password ? 'border-red-500' : ''}
                placeholder="Mot de passe"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
                autoComplete="password"
              />
              {errors.password && (
                <Text className="text-red-500 mt-1">
                  {errors.password.message}
                </Text>
              )}
            </View>
          )}
          name="password"
        />

        <Controller
          control={control}
          rules={{
            required: 'Veuillez confirmer votre mot de passe',
            validate: (value) =>
              value === password || 'Les mots de passe ne correspondent pas',
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <Input
                className={errors.confirmPassword ? 'border-red-500' : ''}
                placeholder="Confirmer le mot de passe"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
                autoComplete="password"
              />
              {errors.confirmPassword && (
                <Text className="text-red-500 mt-1">
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>
          )}
          name="confirmPassword"
        />

        {/* Error message */}
        {error && (
          <Text className="text-red-500 text-center">
            {error}
          </Text>
        )}

        {/* Submit button */}
        <Button
          className="w-full mt-6"
          style={{ height: 60, borderRadius: 30 }}
          disabled={loading}
          onPress={handleSubmit(onSubmit)}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-foreground text-lg font-bold">
              Créer mon compte
            </Text>
          )}
        </Button>
      </View>

      {/* Link to login */}
      <View className="flex-row justify-center gap-2 mt-6">
        <Text className="text-muted-foreground">
          Déjà un compte ?
        </Text>
        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text className="text-primary font-semibold">
            Se connecter
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}