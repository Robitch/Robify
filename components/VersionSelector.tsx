import React, { useState, useRef } from 'react';
import { 
  View, 
  ScrollView, 
  Pressable, 
  Modal,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';
import { cn } from '~/lib/utils';
import { TrackVersion, VersionType } from '@/types';

interface VersionSelectorProps {
  versions: TrackVersion[];
  activeVersion: TrackVersion | null;
  onVersionSelect: (version: TrackVersion) => void;
  onAddVersionPress?: () => void;
  showAddButton?: boolean;
  compact?: boolean;
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

const VERSION_TYPE_ICONS = {
  [VersionType.DEMO]: 'create-outline',
  [VersionType.ROUGH_MIX]: 'build-outline',
  [VersionType.FINAL_MIX]: 'checkmark-circle-outline',
  [VersionType.REMASTER]: 'diamond-outline',
  [VersionType.REMIX]: 'shuffle-outline',
  [VersionType.RADIO_EDIT]: 'radio-outline',
  [VersionType.EXTENDED_MIX]: 'time-outline',
  [VersionType.LIVE]: 'mic-outline',
  [VersionType.ACOUSTIC]: 'musical-note-outline',
  [VersionType.INSTRUMENTAL]: 'piano-outline',
};

export default function VersionSelector({
  versions,
  activeVersion,
  onVersionSelect,
  onAddVersionPress,
  showAddButton = true,
  compact = false
}: VersionSelectorProps) {
  const { isDarkColorScheme } = useColorScheme();
  const [showFullList, setShowFullList] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  if (versions.length === 0) {
    return null;
  }

  // Séparer les versions principales des autres
  const primaryVersions = versions.filter(v => 
    v.version_type === VersionType.FINAL_MIX || 
    v.version_type === VersionType.DEMO ||
    v.is_primary
  );
  
  const otherVersions = versions.filter(v => 
    !primaryVersions.includes(v)
  );

  const renderVersionItem = (version: TrackVersion, isActive: boolean, showDetails = false) => {
    const typeColor = VERSION_TYPE_COLORS[version.version_type] || '#6b7280';
    const typeIcon = VERSION_TYPE_ICONS[version.version_type] || 'disc-outline';
    
    return (
      <Pressable
        key={version.id}
        onPress={() => onVersionSelect(version)}
        style={{
          marginRight: compact ? 8 : 12,
          paddingHorizontal: compact ? 12 : 16,
          paddingVertical: compact ? 8 : 12,
          borderRadius: compact ? 8 : 12,
          borderWidth: isActive ? 2 : 1,
          borderColor: isActive ? typeColor : (isDarkColorScheme ? '#374151' : '#d1d5db'),
          backgroundColor: isActive 
            ? `${typeColor}20` 
            : (isDarkColorScheme ? '#1f2937' : '#ffffff'),
          minWidth: compact ? 80 : 100,
          alignItems: 'center',
        }}
      >
        {/* Version Icon & Badge */}
        <View className="items-center mb-1">
          <View className="relative">
            <Ionicons
              name={typeIcon as any}
              size={compact ? 20 : 24}
              color={isActive ? typeColor : (isDarkColorScheme ? '#9ca3af' : '#6b7280')}
            />
            {isActive && (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: typeColor,
                  borderWidth: 2,
                  borderColor: isDarkColorScheme ? '#111827' : '#ffffff',
                }}
              />
            )}
          </View>
        </View>

        {/* Version Info */}
        <Text 
          className={cn(
            "font-medium text-center",
            compact ? "text-xs" : "text-sm",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}
          numberOfLines={1}
        >
          {version.version_name}
        </Text>
        
        {!compact && (
          <Text 
            className="text-xs text-muted-foreground text-center mt-1"
            numberOfLines={1}
          >
            {version.version_number}
          </Text>
        )}

        {/* Additional Details for Full List */}
        {showDetails && (
          <View className="mt-2 w-full">
            {version.version_notes && (
              <Text 
                className="text-xs text-muted-foreground text-center"
                numberOfLines={2}
              >
                {version.version_notes}
              </Text>
            )}
            <View className="flex-row items-center justify-center mt-1">
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: version.is_public ? '#10b981' : '#6b7280',
                  marginRight: 4,
                }}
              />
              <Text className="text-xs text-muted-foreground">
                {version.is_public ? 'Public' : 'Privé'}
              </Text>
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View>
      {/* Compact Horizontal Scroll */}
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: 4,
          paddingVertical: 4
        }}
      >
        <View className="flex-row items-center">
          {/* Primary Versions */}
          {primaryVersions.map((version) => 
            renderVersionItem(version, version.id === activeVersion?.id)
          )}
          
          {/* Show More Button */}
          {otherVersions.length > 0 && (
            <Pressable
              onPress={() => setShowFullList(true)}
              style={{
                marginRight: 12,
                paddingHorizontal: 12,
                paddingVertical: compact ? 8 : 12,
                borderRadius: compact ? 8 : 12,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: isDarkColorScheme ? '#374151' : '#d1d5db',
                backgroundColor: 'transparent',
                minWidth: 60,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={compact ? 16 : 20}
                color={isDarkColorScheme ? '#9ca3af' : '#6b7280'}
              />
              <Text className="text-xs text-muted-foreground mt-1">
                +{otherVersions.length}
              </Text>
            </Pressable>
          )}
          
          {/* Add Version Button */}
          {showAddButton && onAddVersionPress && (
            <Pressable
              onPress={onAddVersionPress}
              style={{
                paddingHorizontal: 12,
                paddingVertical: compact ? 8 : 12,
                borderRadius: compact ? 8 : 12,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: '#10b981',
                backgroundColor: isDarkColorScheme ? '#064e3b20' : '#d1fae520',
                minWidth: 60,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="add"
                size={compact ? 16 : 20}
                color="#10b981"
              />
              <Text className="text-xs text-primary font-medium mt-1">
                Ajouter
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Full List Modal */}
      <Modal
        visible={showFullList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFullList(false)}
      >
        <View className="flex-1 bg-background">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-lg font-semibold text-foreground">
              Toutes les versions
            </Text>
            <Pressable
              onPress={() => setShowFullList(false)}
              className="p-2 -mr-2"
            >
              <Ionicons 
                name="close" 
                size={24} 
                color={isDarkColorScheme ? '#9ca3af' : '#6b7280'} 
              />
            </Pressable>
          </View>

          <ScrollView 
            className="flex-1 p-4"
            showsVerticalScrollIndicator={false}
          >
            {/* Active Version */}
            {activeVersion && (
              <View className="mb-6">
                <Text className="text-sm font-medium text-muted-foreground mb-3">
                  VERSION ACTIVE
                </Text>
                <View className="flex-row">
                  {renderVersionItem(activeVersion, true, true)}
                </View>
              </View>
            )}

            {/* All Versions by Type */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-muted-foreground mb-3">
                TOUTES LES VERSIONS ({versions.length})
              </Text>
              
              <View className="flex-row flex-wrap gap-3">
                {versions
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((version) => (
                    <View key={version.id} style={{ width: (Dimensions.get('window').width - 48) / 2 - 6 }}>
                      {renderVersionItem(
                        version, 
                        version.id === activeVersion?.id, 
                        true
                      )}
                    </View>
                  ))
                }
              </View>
            </View>

            {/* Add New Version */}
            {showAddButton && onAddVersionPress && (
              <View className="mb-6">
                <Text className="text-sm font-medium text-muted-foreground mb-3">
                  CRÉER UNE NOUVELLE VERSION
                </Text>
                <Pressable
                  onPress={() => {
                    setShowFullList(false);
                    onAddVersionPress();
                  }}
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: '#10b981',
                    backgroundColor: isDarkColorScheme ? '#064e3b20' : '#d1fae520',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={32}
                    color="#10b981"
                    style={{ marginBottom: 8 }}
                  />
                  <Text className="text-primary font-semibold text-base">
                    Ajouter une version
                  </Text>
                  <Text className="text-muted-foreground text-sm text-center mt-1">
                    Créez une nouvelle version de ce morceau
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}