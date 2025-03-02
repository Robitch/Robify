// app/(onboarding)/auth-options.js - Choix entre login et register
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '~/components/ui/button';

export default function AuthOptions() {
    const insets = useSafeAreaInsets();


    return (
        <View className="flex-1 items-center justify-center px-6 gap-14" style={{ paddingTop: insets.top + 80, paddingBottom: insets.bottom + 25 }}>
            {/* Logo */}
            <Image
                source={require("@/assets/images/logo.svg")}
                contentFit="contain"
                style={{
                    width: "70%",
                    height: 50,
                }}
            />

            <View className="gap-7">
                {/* Title */}
                <Text className="text-3xl text-foreground font-semibold capitalize">Enjoy listening to music</Text>
                {/* Paragraph */}
                <Text className="text-xl text-center text-muted-foreground">Spotify is a proprietary Swedish audio streaming and media services provider</Text>
            </View>


            {/* Button */}
            <View className='flex-row gap-10'>
                <Link href="/(auth)/register" asChild>
                    <Button className='flex-1' style={{ height: 73, borderRadius: 30 }}><Text className="text-foreground" style={{ fontSize: 21, fontWeight: "bold" }}>Register</Text></Button>
                </Link>
                <Link href="/(auth)/login" asChild>
                    <Button variant="link" className='flex-1' style={{ height: 73, borderRadius: 30 }}><Text className="text-foreground" style={{ fontSize: 21, fontWeight: "bold" }}>Sign in</Text></Button>
                </Link>
            </View>
        </View>
    );
}