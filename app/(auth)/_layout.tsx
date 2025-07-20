import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '~/provider/AuthProvider';


export default function AuthLayout() {
    const router = useRouter();
    const { session } = useAuth();

    useEffect(() => {
        if (session) {
            router.replace("/home");
        }
    }, [session]);

    return (
        <Stack screenOptions={{ title: '' }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
        </Stack >
    );
}