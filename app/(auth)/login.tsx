import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { router } from 'expo-router';
import { Text } from '~/components/ui/text';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/provider/AuthProvider';

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const insets = useSafeAreaInsets();
  const { signIn, loading, error, clearError } = useAuth();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    clearError();

    try {
      await signIn(data.email, data.password);
      // Navigation will be handled by the auth state change in _layout.tsx
    } catch (error) {
      Alert.alert(
        'Erreur de connexion',
        'Vérifiez vos identifiants et réessayez.'
      );
    }
  };

  return (
    <View
      className="flex-1 justify-center px-6 gap-8"
      style={{
        paddingTop: insets.top + 80,
        paddingBottom: insets.bottom + 25,
      }}
    >
      {/* Logo */}
      <Image
        source={require("@/assets/images/logo.svg")}
        contentFit="contain"
        style={{
          width: "70%",
          height: 50,
          alignSelf: 'center',
        }}
      />

      {/* Title */}
      <View className="gap-4">
        <Text className="text-3xl font-bold text-center">
          Connexion
        </Text>
        <Text className="text-center text-muted-foreground text-lg">
          Connectez-vous pour accéder à votre musique
        </Text>
      </View>

      {/* Form */}
      <View className="gap-4">
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

        {/* Error message */}
        {error && (
          <Text className="text-red-500 text-center">
            {error}
          </Text>
        )}

        {/* Submit button */}
        <Button
          className="w-full"
          style={{ height: 60, borderRadius: 30 }}
          disabled={loading}
          onPress={handleSubmit(onSubmit)}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-foreground text-lg font-bold">
              Se connecter
            </Text>
          )}
        </Button>
      </View>

      {/* Link to register */}
      <View className="flex-row justify-center gap-2">
        <Text className="text-muted-foreground">
          Pas encore de compte ?
        </Text>
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text className="text-primary font-semibold">
            S'inscrire
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

