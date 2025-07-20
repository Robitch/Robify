import React from "react";
import { View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "@/provider/AuthProvider";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Profile() {
    const { user, userProfile, signOut } = useAuth();
    const insets = useSafeAreaInsets();

    console.log('User Profile:', userProfile);

    const handleSignOut = () => {
        Alert.alert(
            "Déconnexion",
            "Êtes-vous sûr de vouloir vous déconnecter ?",
            [
                { text: "Annuler", style: "cancel" },
                { text: "Déconnexion", onPress: signOut, style: "destructive" }
            ]
        );
    };

    if (!userProfile) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text>Chargement du profil...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-background"
            style={{ paddingTop: insets.top + 16 }}
            contentContainerStyle={{
                paddingBottom: 120, // Space for floating player + tabs
            }}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View className="p-6 items-center">
                {/* Avatar */}
                <View className="w-32 h-32 rounded-full bg-muted justify-center items-center mb-4">
                    {userProfile.avatar_url ? (
                        <Image
                            source={{ uri: userProfile.avatar_url }}
                            style={{ width: 128, height: 128, borderRadius: 64 }}
                        />
                    ) : (
                        <Ionicons name="person" size={60} className="text-muted-foreground" />
                    )}
                </View>

                {/* Name and username */}
                <Text className="text-2xl font-bold text-center mb-2">
                    {userProfile.full_name}
                </Text>
                <Text className="text-lg text-muted-foreground mb-2">
                    @{userProfile.username}
                </Text>

                {/* Artist badge - all users are artists */}
                <View className="px-3 py-1 rounded-full mb-4 bg-primary/20">
                    <Text className="text-sm font-semibold text-primary">
                        🎵 Artiste
                    </Text>
                </View>

                {/* Bio */}
                {userProfile.bio && (
                    <Text className="text-center text-muted-foreground mb-4">
                        {userProfile.bio}
                    </Text>
                )}

                {/* Location */}
                {userProfile.location && (
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="location" size={16} className="text-muted-foreground mr-2" />
                        <Text className="text-muted-foreground">
                            {userProfile.location}
                        </Text>
                    </View>
                )}

                {/* Edit Profile Button */}
                <Button
                    variant="outline"
                    className="w-full mb-4"
                    onPress={() => router.push('/profile-setup')}
                >
                    <Text>Modifier le profil</Text>
                </Button>
            </View>

            {/* Stats Section (if artist) */}
            {/* Stats Section - all users are artists */}
            {true && (
                <View className="px-6 py-4 border-t border-muted">
                    <Text className="text-lg font-semibold mb-3">
                        Statistiques
                    </Text>
                    <View className="flex-row justify-around">
                        <View className="items-center">
                            <Text className="text-2xl font-bold">0</Text>
                            <Text className="text-muted-foreground">Morceaux</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-2xl font-bold">0</Text>
                            <Text className="text-muted-foreground">Écoutes</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-2xl font-bold">0</Text>
                            <Text className="text-muted-foreground">Abonnés</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Social Links */}
            {(userProfile.website || userProfile.instagram || userProfile.spotify) && (
                <View className="px-6 py-4 border-t border-muted">
                    <Text className="text-lg font-semibold mb-3">
                        Liens
                    </Text>
                    <View className="gap-3">
                        {userProfile.website && (
                            <TouchableOpacity className="flex-row items-center">
                                <Ionicons name="globe" size={20} className="text-muted-foreground mr-3" />
                                <Text className="text-primary">
                                    {userProfile.website}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {userProfile.instagram && (
                            <TouchableOpacity className="flex-row items-center">
                                <Ionicons name="logo-instagram" size={20} className="text-muted-foreground mr-3" />
                                <Text className="text-primary">
                                    {userProfile.instagram}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {userProfile.spotify && (
                            <TouchableOpacity className="flex-row items-center">
                                <Ionicons name="musical-note" size={20} className="text-muted-foreground mr-3" />
                                <Text className="text-primary">
                                    {userProfile.spotify}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* Account Section */}
            <View className="px-6 py-4 border-t border-muted">
                <Text className="text-lg font-semibold mb-3">
                    Compte
                </Text>
                <View className="gap-3">
                    <TouchableOpacity className="flex-row items-center justify-between py-2">
                        <View className="flex-row items-center">
                            <Ionicons name="settings" size={20} className="text-muted-foreground mr-3" />
                            <Text>Paramètres</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center justify-between py-2">
                        <View className="flex-row items-center">
                            <Ionicons name="people" size={20} className="text-muted-foreground mr-3" />
                            <Text>Inviter des amis</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center justify-between py-2">
                        <View className="flex-row items-center">
                            <Ionicons name="help-circle" size={20} className="text-muted-foreground mr-3" />
                            <Text>Aide</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Sign Out Button */}
            <View className="px-6 py-4">
                <Button
                    variant="outline"
                    className="w-full border-red-500"
                    onPress={handleSignOut}
                >
                    <Text className="text-red-500">Se déconnecter</Text>
                </Button>
            </View>

            {/* User Info (for debugging) */}
            <View className="px-6 py-4 border-t border-muted">
                <Text className="text-sm text-muted-foreground">
                    Email: {user?.email}
                </Text>
                <Text className="text-sm text-muted-foreground">
                    Membre depuis: {new Date(userProfile.created_at).toLocaleDateString()}
                </Text>
            </View>
        </ScrollView>
    );
}
