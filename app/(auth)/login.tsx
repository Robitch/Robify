import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '~/lib/utils';

export default function Login() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            // Ici, vous ferez votre appel API pour authentifier l'utilisateur
            // Exemple simulé:
            const userToken = '';

            // Stocker le token
            await AsyncStorage.setItem('userToken', userToken);

            // Rediriger vers l'application
            router.replace('/home');
        } catch (error) {
            console.error('Login failed:', error);
            // Gérer l'erreur (afficher un message, etc.)
        }
    };


    return (
        <View style={[styles.container, { paddingTop: insets.top + 25, paddingBottom: insets.bottom + 25, paddingLeft: 25, paddingRight: 25 }]}>
            <Text style={styles.title}>Connexion</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Button title="Se connecter" onPress={handleLogin} />

            <Button
                title="Retour"
                onPress={() => router.back()}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#CCCCCC',
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 10,
    },
});

