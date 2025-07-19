import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Modal } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '~/lib/useColorScheme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/provider/AuthProvider';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface User {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string | null;
}

interface UserSelectorProps {
    selectedUsers: User[];
    onSelectionChange: (users: User[]) => void;
    label?: string;
    placeholder?: string;
    error?: string;
}

export function UserSelector({
    selectedUsers,
    onSelectionChange,
    label = "Artistes",
    placeholder = "Sélectionner les artistes...",
    error
}: UserSelectorProps) {
    const { isDarkColorScheme } = useColorScheme();
    const { userProfile } = useAuth();
    const insets = useSafeAreaInsets();
    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('id, full_name, username, avatar_url')
                .order('full_name');

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleUser = (user: User) => {
        const isSelected = selectedUsers.find(u => u.id === user.id);
        if (isSelected) {
            onSelectionChange(selectedUsers.filter(u => u.id !== user.id));
        } else {
            onSelectionChange([...selectedUsers, user]);
        }
    };

    const removeUser = (userId: string) => {
        onSelectionChange(selectedUsers.filter(u => u.id !== userId));
    };

    const borderColor = error
        ? '#ef4444'
        : isDarkColorScheme
            ? '#374151'
            : '#e5e7eb';

    return (
        <View className="w-full">
            {label && (
                <Text className="text-sm font-medium text-foreground mb-2">
                    {label}
                </Text>
            )}

            {/* Selector Button */}
            <Pressable
                style={{
                    borderWidth: 1.5,
                    borderColor,
                    borderRadius: 12,
                    backgroundColor: isDarkColorScheme ? '#1f2937' : '#ffffff',
                    minHeight: 52,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                }}
                onPress={() => setIsOpen(true)}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                        {selectedUsers.length === 0 ? (
                            <Text className="text-muted-foreground">
                                {placeholder}
                            </Text>
                        ) : (
                            <View className="flex-row flex-wrap gap-2">
                                {selectedUsers.map((user) => (
                                    <View
                                        key={user.id}
                                        style={{
                                            backgroundColor: '#10b981',
                                            borderRadius: 20,
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        {user.avatar_url && (
                                            <Image
                                                source={{ uri: user.avatar_url }}
                                                style={{ width: 16, height: 16, borderRadius: 8 }}
                                            />
                                        )}
                                        <Text className="text-white text-sm font-medium">
                                            {user.full_name}
                                        </Text>
                                        <Pressable onPress={() => removeUser(user.id)}>
                                            <Ionicons name="close" size={14} className="text-white" />
                                        </Pressable>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                    <Ionicons
                        name="chevron-down"
                        size={20}
                        className={isDarkColorScheme ? 'text-gray-400' : 'text-gray-500'}
                    />
                </View>
            </Pressable>

            {error && (
                <Text className="text-sm mt-1 text-red-500">
                    {error}
                </Text>
            )}

            {/* Modal */}
            <Modal
                visible={isOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsOpen(false)}
            >
                <View
                    className="flex-1 bg-background"
                    style={{ paddingTop: insets.top + 8 }}
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
                        <View>
                            <Text className="text-xl font-bold text-foreground">
                                Sélectionner les artistes
                            </Text>
                            <Text className="text-sm text-muted-foreground mt-1">
                                {selectedUsers.length} sélectionné{selectedUsers.length !== 1 ? 's' : ''}
                            </Text>
                        </View>
                        <Button
                            variant="ghost"
                            size="icon"
                            onPress={() => setIsOpen(false)}
                        >
                            <Ionicons name="close" size={24} className={isDarkColorScheme ? 'text-gray-50' : 'text-gray-900'} />
                        </Button>
                    </View>

                    {/* Search */}
                    <View className="px-6 py-4">
                        <Input
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Rechercher un utilisateur..."
                            leftIcon="search"
                        />
                    </View>

                    {/* Users List */}
                    <ScrollView className="flex-1 px-6">
                        {loading ? (
                            <View className="py-8 items-center">
                                <Text className="text-muted-foreground">Chargement...</Text>
                            </View>
                        ) : filteredUsers.length === 0 ? (
                            <View className="py-8 items-center">
                                <Text className="text-muted-foreground">Aucun utilisateur trouvé</Text>
                            </View>
                        ) : (
                            <View className="gap-2">
                                {filteredUsers.map((user) => {
                                    const isSelected = selectedUsers.find(u => u.id === user.id);
                                    return (
                                        <Pressable
                                            key={user.id}
                                            style={{
                                                borderRadius: 12,
                                                padding: 16,
                                                backgroundColor: isSelected
                                                    ? (isDarkColorScheme ? '#064e3b20' : '#d1fae520')
                                                    : (isDarkColorScheme ? '#374151' : '#f9fafb'),
                                                borderWidth: isSelected ? 1.5 : 1,
                                                borderColor: isSelected ? '#10b981' : (isDarkColorScheme ? '#4b5563' : '#e5e7eb'),
                                            }}
                                            onPress={() => toggleUser(user)}
                                        >
                                            <View className="flex-row items-center gap-3">
                                                {/* Avatar */}
                                                <View
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 20,
                                                        backgroundColor: isDarkColorScheme ? '#6b7280' : '#d1d5db',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    {user.avatar_url ? (
                                                        <Image
                                                            source={{ uri: user.avatar_url }}
                                                            style={{ width: 40, height: 40, borderRadius: 20 }}
                                                        />
                                                    ) : (
                                                        <Ionicons
                                                            name="person"
                                                            size={20}
                                                            className={isDarkColorScheme ? 'text-gray-400' : 'text-gray-500'}
                                                        />
                                                    )}
                                                </View>

                                                {/* User Info */}
                                                <View className="flex-1">
                                                    <Text className="font-semibold text-foreground">
                                                        {user.full_name}
                                                    </Text>
                                                    <Text className="text-sm text-muted-foreground">
                                                        @{user.username}
                                                    </Text>
                                                </View>

                                                {/* All users are artists now - no badge needed */}

                                                {/* Selection Indicator */}
                                                <View
                                                    style={{
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: 12,
                                                        backgroundColor: isSelected ? '#10b981' : 'transparent',
                                                        borderWidth: 2,
                                                        borderColor: isSelected ? '#10b981' : (isDarkColorScheme ? '#6b7280' : '#d1d5db'),
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    {isSelected && (
                                                        <Ionicons name="checkmark" size={14} className="text-white" />
                                                    )}
                                                </View>
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View className="px-6 py-4 border-t border-border">
                        <Button
                            onPress={() => setIsOpen(false)}
                            style={{
                                height: 48,
                                borderRadius: 12,
                                backgroundColor: '#10b981',
                            }}
                        >
                            <Text className="text-white font-semibold">
                                Confirmer ({selectedUsers.length})
                            </Text>
                        </Button>
                    </View>
                </View>
            </Modal>
        </View>
    );
}