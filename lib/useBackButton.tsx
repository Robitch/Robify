import { Ionicons } from '@expo/vector-icons';
import { Button } from '~/components/ui/button';
import { router } from 'expo-router';
import { cssInterop } from 'nativewind';
import { Image } from 'expo-image';


export const options = {
    headerTitleAlign: "center",
    headerShown: true,
    headerTransparent: true,
    headerTitle() {
        return (
            <Image
                source={require("@/assets/images/logo.svg")}
                contentFit="contain"
                style={{
                    width: "70%",
                    height: 50,
                }} />
        );
    },
    headerLeft() {
        return (
            <Button
                onPress={() => router.dismiss(1)}
                variant="icon" size="icon" className="bg-gray-600/5 w-10 h-10 aspect-square rounded-full active:bg-gray-600/20">
                <Ionicons name='chevron-back' size={24} className='text-foreground' />
            </Button>
        );
    }
};