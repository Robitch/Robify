// app/index.js - Point d'entrée
import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
    // État pour suivre si nous sommes en train de vérifier le statut
    const [isLoading, setIsLoading] = useState(true);
    const [destination, setDestination] = useState<string>("");

    useEffect(() => {
        async function checkStatus() {
            try {
                // Vérifier si c'est la première visite
                const hasVisited = await AsyncStorage.getItem('hasVisited');

                // Vérifier si l'utilisateur est connecté
                const userToken = await AsyncStorage.getItem('userToken');

                if (!hasVisited) {
                    // Première visite, diriger vers onboarding
                    await AsyncStorage.setItem('hasVisited', 'true');
                    setDestination('/(onboarding)/get-started');
                } else if (userToken) {
                    await AsyncStorage.setItem('userToken', '');
                    // Utilisateur connecté, diriger vers l'app
                    setDestination('/(tabs)/home');
                } else {
                    // Utilisateur non connecté, diriger vers login/register options
                    setDestination('/(onboarding)/auth-options');
                }
            } catch (error) {
                console.error('Error checking status:', error);
                // En cas d'erreur, diriger vers onboarding par défaut
                setDestination('/(onboarding)/get-started');
            } finally {
                setIsLoading(false);
            }
        }

        checkStatus();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <Redirect href={destination as any} />;
}