import { Stack } from 'expo-router';
import { Button } from '~/components/ui/button';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '~/components/ui/text';
import { cssInterop } from 'nativewind';
import { useRouter } from 'expo-router';
import { options } from '~/lib/useBackButton';

export default function OnboardingLayout() {
    const router = useRouter();

    // cssInterop(Ionicons, {
    //     className: {
    //         target: 'color',
    //         nativeStyleToProp: { color: true },
    //     },
    // });

    return (
        <Stack screenOptions={{
            headerShown: false,
            animation: 'slide_from_right'
        }}>
            <Stack.Screen name="get-started" />
            <Stack.Screen name="invitation-code" />
            <Stack.Screen name="auth-options" />
            <Stack.Screen name="choose-theme" />
        </Stack>
    );
}