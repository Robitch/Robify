import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '~/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Artists() {
    const insets = useSafeAreaInsets();

    return (
        <ScrollView
            className="flex-1 bg-background"
            style={{ paddingTop: insets.top + 16 }}
            contentContainerStyle={{
                paddingBottom: 120, // Space for floating player + tabs
            }}
            showsVerticalScrollIndicator={false}
        >
            <View className="p-6">
                <Text className="text-2xl font-bold mb-4">
                    Artistes
                </Text>
                <Text className="text-muted-foreground">
                    Découvrez tous les artistes de votre cercle musical.
                </Text>

                {/* TODO: Implement artists list */}
                <View className="mt-8 p-8 bg-muted/20 rounded-lg items-center">
                    <Text className="text-lg font-semibold mb-2">
                        Bientôt disponible
                    </Text>
                    <Text className="text-center text-muted-foreground">
                        La liste des artistes sera disponible une fois que vos amis commenceront à uploader leur musique.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}