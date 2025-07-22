import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '~/components/ui/text';
import { ReactionType } from '~/types/library';
import { useColorScheme } from '~/lib/useColorScheme';

const reactionIcons: Record<ReactionType, keyof typeof Ionicons.glyphMap> = {
    like: 'thumbs-up',
    fire: 'flame',
    heart: 'heart',
    mind_blown: 'nuclear'
};
const reactionColors: Record<ReactionType, string> = {
    like: '#3b82f6', // blue
    fire: '#f97316', // orange
    heart: '#ef4444', // red
    mind_blown: '#8b5cf6', // purple
};

interface MoreOptionsDropdownProps {
    track: any; // Replace with actual track type
    onRemoveMusic: () => void;
    showVersionManager: () => void;
    canAddVersion: boolean;
    onVersionAdded?: () => void;
    isCurrentTrack: boolean | null;
    versionsCount?: number;
}

const MoreOptionsDropdown = (
    {
        track,
        onRemoveMusic,
        showVersionManager,
        canAddVersion,
        onVersionAdded,
        isCurrentTrack,
        versionsCount = 0
    }: MoreOptionsDropdownProps) => {
    const { isDarkColorScheme } = useColorScheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <TouchableOpacity
                    className="w-10 h-10 items-center justify-center ml-2"
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="ellipsis-vertical"
                        size={18}
                        color={isCurrentTrack ? '#ffffff' : '#6b7280'}
                    />
                </TouchableOpacity>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuItem
                    onPress={() => {
                        // Le FavoriteButton gérera l'action - on pourrait déclencher l'action ici
                    }}
                    className="flex-row items-center p-3 justify-around border-b border-gray-200 dark:border-gray-700"
                >
                    {(Object.keys(reactionIcons) as ReactionType[]).map((type) => (
                        <TouchableOpacity
                            key={type}
                            onPress={() => {
                                // handleToggleFavorite(type);
                                // setShowReactionPicker(false);
                            }}
                            className="p-2 rounded-full"
                        >
                            <Ionicons
                                name={reactionIcons[type]}
                                size={24}
                                color={reactionColors[type]}
                            />
                        </TouchableOpacity>
                    ))}
                </DropdownMenuItem>
                {/* Add to Favorites Option */}
                <DropdownMenuItem
                    onPress={() => {
                        // Le FavoriteButton gérera l'action - on pourrait déclencher l'action ici
                    }}
                    className="flex-row items-center p-3"
                >
                    <View
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: '#ef444420',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                        }}
                    >
                        <Ionicons
                            name="heart"
                            size={16}
                            color="#ef4444"
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-foreground font-medium">
                            Ajouter aux favoris
                        </Text>
                        <Text className="text-muted-foreground text-xs">
                            Sauvegarder dans votre bibliothèque
                        </Text>
                    </View>
                </DropdownMenuItem>

                {/* View Versions Option */}
                <DropdownMenuItem
                    onPress={showVersionManager}
                    className="flex-row items-center p-3"
                >
                    <View
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: isDarkColorScheme ? '#374151' : '#f3f4f6',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                        }}
                    >
                        <Ionicons
                            name="list"
                            size={16}
                            color={isDarkColorScheme ? '#9ca3af' : '#6b7280'}
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-foreground font-medium">
                            Gérer les versions
                        </Text>
                        <Text className="text-muted-foreground text-xs">
                            {versionsCount} version{versionsCount > 1 ? 's' : ''} disponible{versionsCount > 1 ? 's' : ''}
                        </Text>
                    </View>
                </DropdownMenuItem>

                {/* Remove Option */}
                <DropdownMenuItem
                    onPress={onRemoveMusic}
                    className="flex-row items-center p-3"
                >
                    <View
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: '#ef444420',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                        }}
                    >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </View>
                    <View className="flex-1">
                        <Text style={{ color: '#ef4444' }} className="font-medium">
                            Supprimer
                        </Text>
                        <Text className="text-muted-foreground text-xs">
                            Retirer de la liste
                        </Text>
                    </View>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default MoreOptionsDropdown;