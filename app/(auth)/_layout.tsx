import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
// import { useAuth } from '@/provider/AuthProvider';
import { options } from '~/lib/useBackButton';


export default function AuthLayout() {
    // const router = useRouter();
    // const { session } = useAuth();

    // useEffect(() => {
    //     if (session) {
    //         router.replace("/home");
    //     }
    // }, [session]);

    return (
        <Stack screenOptions={{}}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
        </Stack >
    );
}