import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Track, TrackVersion, VersionType } from '~/types';
import TrackPlayer, { useActiveTrack, useIsPlaying } from 'react-native-track-player';
import { Image } from 'expo-image';
import { useColorScheme } from '~/lib/useColorScheme';
import { useTrackVersions } from '@/store/versionsStore';
import VersionUploadModal from './VersionUploadModal';
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

const getVersionTypeFromNotes = (notes: string | null): VersionType => {
    if (!notes) return VersionType.DEMO;
    const lowerNotes = notes.toLowerCase();
    
    if (lowerNotes.includes('final')) return VersionType.FINAL_MIX;
    if (lowerNotes.includes('remix')) return VersionType.REMIX;
    if (lowerNotes.includes('live')) return VersionType.LIVE;
    if (lowerNotes.includes('acoustic')) return VersionType.ACOUSTIC;
    if (lowerNotes.includes('rough')) return VersionType.ROUGH_MIX;
    if (lowerNotes.includes('radio')) return VersionType.RADIO_EDIT;
    if (lowerNotes.includes('extended')) return VersionType.EXTENDED_MIX;
    if (lowerNotes.includes('remaster')) return VersionType.REMASTER;
    if (lowerNotes.includes('instrumental')) return VersionType.INSTRUMENTAL;
    
    return VersionType.DEMO;
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
    const [showVersionModal, setShowVersionModal] = useState(false);
    const [activeVersion, setActiveVersion] = useState<TrackVersion | null>(null);
    const [versionsCount, setVersionsCount] = useState(0);
    const [canAddVersion, setCanAddVersion] = useState(false);
    
    // States pour animations
    const scale = useSharedValue(1);
    const playButtonScale = useSharedValue(1);
    
    // Vérifier si cette track est celle qui joue actuellement
    const isCurrentTrack = activeTrack?.url === item.file_url;
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
            
            const activeVer = versions?.find(v => v.is_primary) || versions?.[0];
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

            // Vérifier l'état actuel
            const currentActiveTrack = await TrackPlayer.getCurrentTrack();
            const state = await TrackPlayer.getState();
            
            // Si c'est la même track, juste pause/play
            if (currentActiveTrack !== null) {
                const currentTrackData = await TrackPlayer.getTrack(currentActiveTrack);
                if (currentTrackData?.url === track.file_url) {
                    if (state === 'playing') {
                        await TrackPlayer.pause();
                    } else {
                        await TrackPlayer.play();
                    }
                    return;
                }
            }
            
            // Sinon, charger la nouvelle track
            await TrackPlayer.reset();
            await TrackPlayer.add({
                id: track.id,
                url: track.file_url,
                title: track.title,
                artist: track.user_profiles?.full_name || 'Unknown Artist',
                artwork: track.artwork_url,
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
                className={`${containerPadding} rounded-2xl ${
                    isCurrentTrack 
                        ? (isDarkColorScheme ? 'bg-emerald-900/40' : 'bg-emerald-50')
                        : (isDarkColorScheme ? 'bg-gray-800/60' : 'bg-white/80')
                } shadow-sm border ${
                    isCurrentTrack 
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
                                <View className={`w-full h-full ${
                                    isDarkColorScheme ? 'bg-gray-700' : 'bg-gray-200'
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
                            className={`${compact ? 'text-base' : 'text-lg'} font-bold mb-1 ${
                                isCurrentTrack ? 'text-emerald-600' : 'text-foreground'
                            }`}
                            numberOfLines={1}
                        >
                            {item.title}
                        </Text>
                        <Text 
                            className={`${compact ? 'text-xs' : 'text-sm'} ${
                                isCurrentTrack ? 'text-emerald-500' : 'text-muted-foreground'
                            }`}
                            numberOfLines={1}
                        >
                            {item.user_profiles?.full_name || 'Unknown Artist'}
                        </Text>
                    </View>

                    {/* Play/Pause Button */}
                    <Animated.View style={playButtonAnimatedStyle}>
                        <TouchableOpacity
                            onPress={() => playTrack(item)}
                            className={`w-12 h-12 rounded-full items-center justify-center ${
                                isCurrentTrack 
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

                    {/* Version Badge */}
                    {activeVersion && (
                        <View 
                            style={{
                                backgroundColor: VERSION_TYPE_COLORS[getVersionTypeFromNotes(activeVersion.version_notes)] + '20',
                                borderColor: VERSION_TYPE_COLORS[getVersionTypeFromNotes(activeVersion.version_notes)],
                                borderWidth: 1,
                            }}
                            className="px-2 py-1 rounded-full mr-2"
                        >
                            <Text 
                                style={{
                                    color: VERSION_TYPE_COLORS[getVersionTypeFromNotes(activeVersion.version_notes)],
                                }}
                                className="text-xs font-medium"
                            >
                                {activeVersion.version_name}
                            </Text>
                            {versionsCount > 1 && (
                                <Text 
                                    style={{
                                        color: VERSION_TYPE_COLORS[getVersionTypeFromNotes(activeVersion.version_notes)],
                                    }}
                                    className="text-xs opacity-70"
                                >
                                    {' '}+{versionsCount - 1}
                                </Text>
                            )}
                        </View>
                    )}

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
                                {/* Add Version Option */}
                                {canAddVersion && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowOptionsMenu(false);
                                            setShowVersionModal(true);
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
                                                backgroundColor: '#10b981',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: 12,
                                            }}
                                        >
                                            <Ionicons name="add" size={16} color="#ffffff" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-foreground font-medium">
                                                Ajouter une version
                                            </Text>
                                            <Text className="text-muted-foreground text-xs">
                                                Créer une nouvelle version de ce morceau
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                
                                {/* View Versions Option */}
                                {versionsCount > 1 && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowOptionsMenu(false);
                                            // TODO: Navigate to versions list
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
                                                Voir toutes les versions
                                            </Text>
                                            <Text className="text-muted-foreground text-xs">
                                                {versionsCount} version{versionsCount > 1 ? 's' : ''} disponible{versionsCount > 1 ? 's' : ''}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                
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
            
            {/* Version Upload Modal */}
            <VersionUploadModal
                visible={showVersionModal}
                onClose={() => setShowVersionModal(false)}
                trackId={item.id}
                trackTitle={item.title}
                onVersionCreated={(version) => {
                    setShowVersionModal(false);
                    loadTrackVersions(); // Refresh versions
                    onVersionAdded?.(); // Callback parent
                    Alert.alert(
                        'Version ajoutée !',
                        `La version "${version.version_name}" a été ajoutée avec succès.`,
                        [{ text: 'OK' }]
                    );
                }}
            />
        </Animated.View>
    );
}
