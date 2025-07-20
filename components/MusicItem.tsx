import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Track, TrackVersion, VersionType } from '~/types';
import TrackPlayer, { useActiveTrack, useIsPlaying } from 'react-native-track-player';
import { Image } from 'expo-image';
import { useColorScheme } from '~/lib/useColorScheme';
import { useTrackVersions } from '@/store/versionsStore';
import VersionManagerModal from './VersionManagerModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/provider/AuthProvider';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface MusicItemProps {
    item: Track;
    onRemoveMusic: () => void;
    showArtwork?: boolean;
    compact?: boolean;
    onVersionAdded?: () => void;
}

const VERSION_TYPE_COLORS = {
    [VersionType.DEMO]: '#f59e0b',
    [VersionType.ROUGH_MIX]: '#8b5cf6',
    [VersionType.FINAL_MIX]: '#10b981',
    [VersionType.REMASTER]: '#06b6d4',
    [VersionType.REMIX]: '#ec4899',
    [VersionType.RADIO_EDIT]: '#f97316',
    [VersionType.EXTENDED_MIX]: '#3b82f6',
    [VersionType.LIVE]: '#ef4444',
    [VersionType.ACOUSTIC]: '#84cc16',
    [VersionType.INSTRUMENTAL]: '#6366f1',
};


export default function MusicItem({
    item,
    onRemoveMusic,
    showArtwork = true,
    compact = false,
    onVersionAdded,
}: MusicItemProps) {
    const { isDarkColorScheme } = useColorScheme();
    const { user } = useAuth();
    const activeTrack = useActiveTrack();
    const { playing } = useIsPlaying();

    // States for version management
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [showVersionManagerModal, setShowVersionManagerModal] = useState(false);
    const [activeVersion, setActiveVersion] = useState<TrackVersion | null>(null);
    const [versionsCount, setVersionsCount] = useState(0);
    const [canAddVersion, setCanAddVersion] = useState(false);

    // States pour animations
    const scale = useSharedValue(1);
    const playButtonScale = useSharedValue(1);

    // Vérifier si cette track est celle qui joue actuellement
    // Prendre en compte l'URL de la version active ou de la track originale
    const isCurrentTrack = activeTrack?.url === item.file_url ||
        (activeVersion && activeTrack?.url === activeVersion.file_url);
    const isPlaying = isCurrentTrack && playing;

    // Load track versions on mount
    useEffect(() => {
        loadTrackVersions();
    }, [item.id]);

    const loadTrackVersions = async () => {
        try {
            const { data: versions, error } = await supabase
                .from('track_versions')
                .select('*')
                .eq('track_id', item.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Type cast version_type to VersionType enum
            const typedVersions = versions?.map(version => ({
                ...version,
                version_type: version.version_type as VersionType
            })) as TrackVersion[];

            const activeVer = typedVersions?.find(v => v.is_primary) || typedVersions?.[0];
            setActiveVersion(activeVer || null);
            setVersionsCount(versions?.length || 0);

            // Vérifier si l'utilisateur peut ajouter une version (propriétaire ou collaborateur)
            setCanAddVersion(item.user_id === user?.id);

        } catch (error) {
            console.error('Error loading versions:', error);
        }
    };

    // Animations
    const itemAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const playButtonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: playButtonScale.value }],
    }));

    const playTrack = async (track: Track) => {
        try {
            // Animation du bouton
            playButtonScale.value = withSpring(0.8, { damping: 15 }, () => {
                playButtonScale.value = withSpring(1, { damping: 15 });
            });

            // Récupérer la version par défaut ou la dernière version disponible
            const { data: versions, error } = await supabase
                .from('track_versions')
                .select('*')
                .eq('track_id', track.id)
                .order('created_at', { ascending: false });

            // Trouver la version par défaut ou prendre la dernière
            let trackToPlay = track;
            let versionToPlay = null;

            if (!error && versions && versions.length > 0) {
                versionToPlay = versions.find(v => v.is_primary) || versions[0];
                if (versionToPlay) {
                    trackToPlay = {
                        ...track,
                        file_url: versionToPlay.file_url,
                        duration: versionToPlay.duration,
                        title: `${track.title} (${versionToPlay.version_name})`
                    };
                }
            }

            // Vérifier l'état actuel
            const currentActiveTrack = await TrackPlayer.getCurrentTrack();
            const state = await TrackPlayer.getState();

            // Si c'est la même track, juste pause/play
            if (currentActiveTrack !== null) {
                const currentTrackData = await TrackPlayer.getTrack(currentActiveTrack);
                if (currentTrackData?.url === trackToPlay.file_url) {
                    if (state === 'playing') {
                        await TrackPlayer.pause();
                    } else {
                        await TrackPlayer.play();
                    }
                    return;
                }
            }

            // Sinon, charger la nouvelle track avec la bonne version
            await TrackPlayer.reset();
            await TrackPlayer.add({
                id: versionToPlay ? `${track.id}_${versionToPlay.id}` : track.id,
                url: trackToPlay.file_url,
                title: trackToPlay.title,
                artist: track.user_profiles?.username || 'Unknown Artist',
                artwork: track.artwork_url,
                duration: trackToPlay.duration || 0,
            });
            await TrackPlayer.play();

        } catch (error) {
            console.error('Error playing track:', error);
        }
    };

    const handlePress = () => {
        scale.value = withSpring(0.98, { damping: 15 }, () => {
            scale.value = withSpring(1, { damping: 15 });
        });
        playTrack(item);
    };

    const containerPadding = compact ? 'p-3' : 'p-4';
    const artworkSize = compact ? 'w-12 h-12' : 'w-16 h-16';

    return (
        <Animated.View style={itemAnimatedStyle}>
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.7}
                className={`${containerPadding} rounded-2xl ${isCurrentTrack
                    ? (isDarkColorScheme ? 'bg-emerald-900/40' : 'bg-emerald-50')
                    : (isDarkColorScheme ? 'bg-gray-800/60' : 'bg-white/80')
                    } shadow-sm border ${isCurrentTrack
                        ? 'border-emerald-500/30'
                        : (isDarkColorScheme ? 'border-gray-700/50' : 'border-gray-200/50')
                    }`}
            >
                <View className="flex-row items-center">
                    {/* Artwork */}
                    {showArtwork && (
                        <View className={`${artworkSize} rounded-xl overflow-hidden mr-4`}>
                            {item.artwork_url ? (
                                <Image
                                    source={{ uri: item.artwork_url }}
                                    className="w-full h-full"
                                    contentFit="cover"
                                />
                            ) : (
                                <View className={`w-full h-full ${isDarkColorScheme ? 'bg-gray-700' : 'bg-gray-200'
                                    } items-center justify-center`}>
                                    <Ionicons
                                        name="musical-note"
                                        size={compact ? 16 : 20}
                                        className="text-muted-foreground"
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    {/* Track Info */}
                    <View className="flex-1 min-w-0 mr-3">
                        <Text
                            className={`${compact ? 'text-base' : 'text-lg'} font-bold mb-1 ${isCurrentTrack ? 'text-emerald-600' : 'text-foreground'
                                }`}
                            numberOfLines={1}
                        >
                            {item.title}
                        </Text>
                        <Text
                            className={`${compact ? 'text-xs' : 'text-sm'} ${isCurrentTrack ? 'text-emerald-500' : 'text-muted-foreground'
                                }`}
                            numberOfLines={1}
                        >
                            @{item.user_profiles?.username || 'Unknown Artist'}
                        </Text>
                    </View>

                    {/* Version Badge */}
                    {activeVersion && (
                        <View
                            style={{
                                backgroundColor: VERSION_TYPE_COLORS[activeVersion.version_type] + '20',
                                borderColor: VERSION_TYPE_COLORS[activeVersion.version_type],
                                borderWidth: 1,
                            }}
                            className="px-2 py-1 rounded-full mr-2"
                        >
                            <Text
                                style={{
                                    color: VERSION_TYPE_COLORS[activeVersion.version_type],
                                }}
                                className="text-xs font-medium"
                            >
                                {activeVersion.version_name}
                            </Text>
                        </View>
                    )}


                    {/* Play/Pause Button */}
                    <Animated.View style={playButtonAnimatedStyle}>
                        <TouchableOpacity
                            onPress={() => playTrack(item)}
                            className={`w-12 h-12 rounded-full items-center justify-center ${isCurrentTrack
                                ? 'bg-emerald-500'
                                : (isDarkColorScheme ? 'bg-gray-700' : 'bg-gray-100')
                                }`}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={isPlaying ? "pause" : "play"}
                                size={20}
                                className={isCurrentTrack ? "text-white" : "text-foreground"}
                                style={{ marginLeft: isPlaying ? 0 : 2 }}
                            />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* More Options */}
                    <TouchableOpacity
                        onPress={() => setShowOptionsMenu(true)}
                        className="w-10 h-10 items-center justify-center ml-2"
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="ellipsis-horizontal"
                            size={18}
                            className="text-muted-foreground"
                        />
                    </TouchableOpacity>
                </View>

            </TouchableOpacity>

            {/* Options Menu Modal */}
            <Modal
                visible={showOptionsMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowOptionsMenu(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
                    activeOpacity={1}
                    onPress={() => setShowOptionsMenu(false)}
                >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
                        <TouchableOpacity activeOpacity={1}>
                            <View
                                style={{
                                    backgroundColor: isDarkColorScheme ? '#1f2937' : '#ffffff',
                                    borderRadius: 16,
                                    padding: 4,
                                    minWidth: 200,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 8,
                                }}
                            >

                                {/* View Versions Option */}
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowOptionsMenu(false);
                                        setShowVersionManagerModal(true);
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: 16,
                                        borderRadius: 12,
                                    }}
                                    activeOpacity={0.7}
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
                                </TouchableOpacity>

                                {/* Remove Option */}
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowOptionsMenu(false);
                                        onRemoveMusic();
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: 16,
                                        borderRadius: 12,
                                    }}
                                    activeOpacity={0.7}
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
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Version Manager Modal */}
            <VersionManagerModal
                visible={showVersionManagerModal}
                onClose={() => setShowVersionManagerModal(false)}
                track={item}
                onVersionUpdated={() => {
                    loadTrackVersions(); // Refresh versions after changes
                }}
            />
        </Animated.View>
    );
}
