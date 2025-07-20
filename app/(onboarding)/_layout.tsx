import { Stack } from 'expo-router';

export default function OnboardingLayout() {

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