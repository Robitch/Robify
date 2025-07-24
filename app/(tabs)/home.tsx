import React, { useState, useEffect, useRef } from "react";
import {
  Pressable,
  ScrollView,
  View,
  RefreshControl,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  Platform
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  SlideInLeft,
  ZoomIn,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

import MusicItem from "@/components/MusicItem";
import { supabase } from "@/lib/supabase";
import { Track } from "~/types";
import { Text } from "~/components/ui/text";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UI_CONSTANTS } from '@/constants/player';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useLibraryStore } from '@/store/libraryStore';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  delay?: number;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, color, onPress, delay = 0 }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="items-center"
      >
        <Animated.View
          style={[
            animatedStyle,
            {
              backgroundColor: `${color}20`,
              borderWidth: 1,
              borderColor: `${color}40`,
            }
          ]}
          className="w-16 h-16 rounded-2xl items-center justify-center mb-2 shadow-lg"
        >
          <Ionicons name={icon} size={28} color={color} />
        </Animated.View>
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: string;
  onActionPress?: () => void;
  delay?: number;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  onActionPress,
  delay = 0
}) => (
  <Animated.View
    entering={FadeInRight.delay(delay).springify()}
    className="flex-row items-center justify-between mb-4"
  >
    <View className="flex-1">
      <Text className="text-xl font-bold text-gray-900 dark:text-white">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {subtitle}
        </Text>
      )}
    </View>
    {action && onActionPress && (
      <TouchableOpacity
        onPress={onActionPress}
        className="flex-row items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-full"
      >
        <Text className="text-blue-600 dark:text-blue-400 font-medium text-sm mr-1">
          {action}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
      </TouchableOpacity>
    )}
  </Animated.View>
);

interface StatsCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  delay?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, delay = 0 }) => (
  <Animated.View entering={ZoomIn.delay(delay).springify()}>
    <View
      className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
      style={{ minWidth: width * 0.25 }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: `${color}20` }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </Text>
      <Text className="text-xs text-gray-600 dark:text-gray-400">
        {title}
      </Text>
    </View>
  </Animated.View>
);

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');

  const { initializeFavorites, favoriteTracks } = useFavoritesStore();
  const { stats, initializeLibrary } = useLibraryStore();

  // Animation pour le header
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT / 2, HEADER_HEIGHT],
      [1, 0.7, 0.3],
    );

    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -HEADER_HEIGHT / 3],
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bonjour');
    else if (hour < 18) setGreeting('Bon après-midi');
    else setGreeting('Bonsoir');

    fetchTracks();
    initializeFavorites();
    initializeLibrary();
  }, []);

  const fetchTracks = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);

      const { data, error: fetchError } = await supabase
        .from('tracks')
        .select(`
          *,
          user_profiles(username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;
      setTracks(data || []);
    } catch (err) {
      setError('Erreur lors du chargement des morceaux');
      console.error('Error fetching tracks:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchTracks(true);
  };

  const recentTracks = tracks.slice(0, 5);
  const trendingTracks = tracks.slice(0, 3);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={["#10b981"]}
            progressViewOffset={insets.top}
          />
        }
      // contentContainerStyle={{
      //   paddingBottom: UI_CONSTANTS.CONTENT_PADDING_BOTTOM + 20,
      // }}
      >
        {/* Hero Header avec Gradient */}
        <Animated.View style={[headerAnimatedStyle]}>
          <LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="relative"
            style={{ height: HEADER_HEIGHT, marginTop: -insets.top }}
          >
            {/* Pattern Background */}
            <View className="absolute inset-0 opacity-10">
              <View className="flex-row flex-wrap">
                {Array.from({ length: 50 }).map((_, i) => (
                  <Animated.View
                    key={i}
                    entering={FadeInUp.delay(i * 50).springify()}
                    className="w-8 h-8 m-1 rounded-full bg-white/20"
                  />
                ))}
              </View>
            </View>

            {/* Header Content */}
            <View
              className="flex-1 justify-end pb-8 px-6"
              style={{ paddingTop: insets.top + 20 }}
            >
              <Animated.View entering={FadeInDown.delay(200).springify()}>
                <Text className="text-white/80 text-lg font-medium mb-2">
                  {greeting} 👋
                </Text>
                <Text className="text-white text-3xl font-bold mb-2">
                  Découvrez de nouveaux sons
                </Text>
                <Text className="text-white/90 text-base">
                  Votre musique collaborative vous attend
                </Text>
              </Animated.View>

              {/* Search Bar */}
              <Animated.View
                entering={FadeInUp.delay(400).springify()}
                className="mt-6"
              >
                <TouchableOpacity
                  onPress={() => void 0}
                  className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex-row items-center"
                >
                  <Ionicons name="search" size={20} color="white" />
                  <Text className="text-white/80 ml-3 flex-1">
                    Rechercher des morceaux, artistes...
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions */}
        <View className="px-6 -mt-8 mb-8">
          <Animated.View
            entering={FadeInUp.delay(100).springify()}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <View className="flex-row justify-around">
              <QuickAction
                icon="add-circle-outline"
                label="Upload"
                color="#10b981"
                onPress={() => router.push('/upload')}
                delay={200}
              />
              <QuickAction
                icon="library-outline"
                label="Bibliothèque"
                color="#3b82f6"
                onPress={() => router.push('/library')}
                delay={300}
              />
              <QuickAction
                icon="people-outline"
                label="Artistes"
                color="#8b5cf6"
                onPress={() => router.push('/artists')}
                delay={400}
              />
              <QuickAction
                icon="heart-outline"
                label="Favoris"
                color="#ef4444"
                onPress={() => router.push('/library/favorites')}
                delay={500}
              />
            </View>
          </Animated.View>
        </View>

        {/* Stats Cards */}
        <View className="px-6 mb-8">
          <SectionHeader
            title="Vos statistiques"
            subtitle="Aperçu de votre activité musicale"
            delay={300}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-4">
              <StatsCard
                title="Morceaux"
                value={tracks.length.toString()}
                icon="musical-notes"
                color="#10b981"
                delay={400}
              />
              <StatsCard
                title="Favoris"
                value={(favoriteTracks?.length || 0).toString()}
                icon="heart"
                color="#ef4444"
                delay={500}
              />
              <StatsCard
                title="Artistes"
                value={(stats?.totalArtists || 0).toString()}
                icon="people"
                color="#8b5cf6"
                delay={600}
              />
              <StatsCard
                title="Albums"
                value={(stats?.totalAlbums || 0).toString()}
                icon="list"
                color="#f59e0b"
                delay={700}
              />
            </View>
          </ScrollView>
        </View>

        {/* Trending Now */}
        {trendingTracks.length > 0 && (
          <View className="px-6 mb-8">
            <SectionHeader
              title="Tendances du moment"
              subtitle="Les morceaux les plus populaires"
              action="Voir tout"
              onActionPress={() => void 0}
              delay={400}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-4">
                {trendingTracks.map((track, index) => (
                  <Animated.View
                    key={track.id}
                    entering={SlideInLeft.delay(500 + index * 100).springify()}
                    className="w-48"
                  >
                    <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                      <View className="h-32 bg-gradient-to-br from-blue-400 to-purple-500 items-center justify-center">
                        {track.artwork_url ? (
                          <Image
                            source={{ uri: track.artwork_url }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                          />
                        ) : (
                          <Ionicons name="musical-notes" size={40} color="white" />
                        )}
                      </View>
                      <View className="p-4">
                        <Text className="font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
                          {track.title}
                        </Text>
                        <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1" numberOfLines={1}>
                          {track.user_profiles?.username || 'Artiste inconnu'}
                        </Text>
                        <View className="flex-row items-center mt-2">
                          <Ionicons name="play" size={12} color="#10b981" />
                          <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            {Math.floor(Math.random() * 1000)} écoutes
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Recent Tracks */}
        <View className="px-6 mb-8">
          <SectionHeader
            title="Ajouts récents"
            subtitle={`${recentTracks.length} nouveaux morceaux`}
            action="Voir tout"
            onActionPress={() => router.push('/library')}
            delay={600}
          />

          {isLoading ? (
            <Animated.View
              entering={FadeInDown.delay(700).springify()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 items-center border border-gray-100 dark:border-gray-700"
            >
              <Ionicons name="disc" size={48} color="#9ca3af" />
              <Text className="text-gray-500 dark:text-gray-400 mt-4">
                Chargement des morceaux...
              </Text>
            </Animated.View>
          ) : error ? (
            <Animated.View
              entering={FadeInDown.delay(700).springify()}
              className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 items-center border border-red-200 dark:border-red-800"
            >
              <Ionicons name="warning" size={48} color="#ef4444" />
              <Text className="text-red-600 dark:text-red-400 mt-4 text-center">
                {error}
              </Text>
            </Animated.View>
          ) : recentTracks.length === 0 ? (
            <Animated.View
              entering={FadeInDown.delay(700).springify()}
              className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 items-center border border-blue-200 dark:border-blue-800"
            >
              <Ionicons name="cloud-upload" size={48} color="#3b82f6" />
              <Text className="text-blue-900 dark:text-blue-300 font-semibold mt-4 text-center">
                Aucun morceau pour l'instant
              </Text>
              <Text className="text-blue-700 dark:text-blue-400 text-center mt-2 mb-4">
                Uploadez votre première musique pour commencer !
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/upload')}
                className="bg-blue-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">
                  Commencer l'upload
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View className="space-y-3">
              {recentTracks.map((track, index) => (
                <Animated.View
                  key={track.id}
                  entering={FadeInDown.delay(700 + index * 100).springify()}
                >
                  <MusicItem
                    item={track}
                    onRemoveMusic={() => void 0}
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </View>

        {/* Call to Action */}
        <Animated.View
          entering={FadeInUp.delay(1000).springify()}
          className="mx-6 mb-8 rounded-3xl overflow-hidden"
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-6"
          >
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text className="text-white text-xl font-bold mb-2">
                  Invitez vos amis !
                </Text>
                <Text className="text-white/90 text-sm mb-4">
                  Partagez vos créations musicales avec votre cercle d'amis musiciens.
                </Text>
                <TouchableOpacity
                  onPress={() => void 0}
                  className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl self-start"
                >
                  <Text className="text-white font-semibold">
                    Inviter maintenant
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="ml-4">
                <Ionicons name="people" size={64} color="rgba(255,255,255,0.6)" />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}