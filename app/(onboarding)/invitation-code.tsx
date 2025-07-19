import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { router } from 'expo-router';
import { Text } from '~/components/ui/text';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/provider/AuthProvider';

interface InvitationFormData {
  code: string;
}

export default function InvitationCode() {
  const insets = useSafeAreaInsets();
  const { checkInvitationCode, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<InvitationFormData>();

  const onSubmit = async (data: InvitationFormData) => {
    setIsChecking(true);
    
    try {
      const isValid = await checkInvitationCode(data.code);
      
      if (isValid) {
        // Store invitation code temporarily and proceed to registration
        // You might want to use a global state or async storage here
        router.push({
          pathname: '/auth-options',
          params: { invitationCode: data.code }
        });
      } else {
        Alert.alert(
          'Code invalide',
          'Le code d\'invitation que vous avez entré est invalide ou a déjà été utilisé. Contactez un ami pour obtenir un nouveau code.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la vérification du code. Veuillez réessayer.'
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View
      className="flex-1 justify-center px-6 gap-10"
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

      {/* Content */}
      <View className="gap-6">
        <View className="gap-4">
          <Text className="text-3xl font-bold text-center">
            Code d'invitation
          </Text>
          <Text className="text-center text-muted-foreground text-lg">
            Robify est une application privée. Demandez un code d'invitation à l'un de vos amis musiciens pour rejoindre la communauté.
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            rules={{
              required: 'Le code d\'invitation est requis',
              minLength: {
                value: 6,
                message: 'Le code doit contenir au moins 6 caractères',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View>
                <Input
                  className={`text-center text-lg ${errors.code ? 'border-red-500' : ''}`}
                  placeholder="Entrez votre code d'invitation"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="characters"
                  autoComplete="off"
                  style={{ letterSpacing: 2 }}
                />
                {errors.code && (
                  <Text className="text-red-500 mt-1 text-center">
                    {errors.code.message}
                  </Text>
                )}
              </View>
            )}
            name="code"
          />

          <Button
            className="w-full"
            style={{ height: 60, borderRadius: 30 }}
            disabled={isChecking || loading}
            onPress={handleSubmit(onSubmit)}
          >
            <Text className="text-foreground text-lg font-bold">
              {isChecking ? 'Vérification...' : 'Vérifier le code'}
            </Text>
          </Button>
        </View>
      </View>

      {/* Help section */}
      <View className="gap-3">
        <Text className="text-center text-muted-foreground">
          Vous n'avez pas de code d'invitation ?
        </Text>
        <Text className="text-center text-sm text-muted-foreground">
          Demandez à un ami qui utilise déjà Robify de vous en envoyer un depuis son profil.
        </Text>
      </View>
    </View>
  );
}