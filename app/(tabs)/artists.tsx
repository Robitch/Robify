import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

import { Text } from '~/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useColorScheme } from '~/lib/useColorScheme';
import { UI_CONSTANTS } from '@/constants/player';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 220;

interface Artist {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  tracks_count: number;
  created_at: string;
  latest_track?: {
    title: string;
    created_at: string;
  };
}

interface ArtistCardProps {
  artist: Artist;
  onPress: (artist: Artist) => void;
  index: number;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onPress, index }) => {
  const scale = useSharedValue(1);
  const { isDarkColorScheme } = useColorScheme();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getAvatarGradient = (username: string) => {
    const gradients = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
      ['#fa709a', '#fee140'],
      ['#a8edea', '#fed6e3'],
      ['#ffecd2', '#fcb69f'],
      ['#ff8a80', '#ffb74d'],
    ];

    const hash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    return gradients[Math.abs(hash) % gradients.length];
  };

  const gradientColors = getAvatarGradient(artist.username);

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <TouchableOpacity
        onPress={() => onPress(artist)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View
          style={[animatedStyle]}
          className="bg-white dark:bg-gray-800 rounded-3xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <View className="flex-row items-center">
            {/* Avatar avec gradient */}
            <View className="mr-4">
              {artist.avatar_url ? (
                <View className="w-16 h-16 rounded-2xl overflow-hidden">
                  <Image
                    source={{ uri: artist.avatar_url }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                </View>
              ) : (
                <LinearGradient
                  colors={gradientColors}
                  className="w-16 h-16 rounded-2xl items-center justify-center"
                >
                  <Text className="text-white text-lg font-bold">
                    {artist.username.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}

              {/* Badge de statut */}
              <View
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 items-center justify-center"
                style={{ backgroundColor: gradientColors[0] }}
              >
                <Ionicons name="musical-note" size={12} color="white" />
              </View>
            </View>

            {/* Informations artiste */}
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-lg font-bold text-gray-900 dark:text-white mr-2">
                  @{artist.username}
                </Text>
                {artist.tracks_count > 5 && (
                  <View className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                    <Text className="text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                      Productif
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center mb-2">
                <Ionicons name="musical-notes" size={14} color="#10b981" />
                <Text className="text-green-600 dark:text-green-400 text-sm font-medium ml-1">
                  {artist.tracks_count} morceau{artist.tracks_count > 1 ? 'x' : ''}
                </Text>
              </View>

              {artist.latest_track && (
                <View className="flex-row items-center">
                  <Ionicons name="time" size={12} color="#6b7280" />
                  <Text className="text-gray-500 dark:text-gray-400 text-xs ml-1" numberOfLines={1}>
                    Dernier: "{artist.latest_track.title}"
                  </Text>
                </View>
              )}

              {/* {artist.bio && (
                <Text className="text-gray-600 dark:text-gray-400 text-sm mt-1" numberOfLines={2}>
                  {artist.bio}
                </Text>
              )} */}
            </View>

            {/* Flèche avec animation */}
            <View className="ml-3">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${gradientColors[0]}20` }}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={gradientColors[0]}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface CategoryCardProps {
  title: string;
  count: number;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  delay?: number;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  count,
  description,
  icon,
  color,
  onPress,
  delay = 0
}) => (
  <Animated.View entering={ZoomIn.delay(delay).springify()}>
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
      style={{ width: width * 0.35 }}
    >
      <View
        className="w-12 h-12 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: `${color}20` }}
      >
        <Ionicons name={icon} size={24} color={color} />
      </View>

      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {count}
      </Text>

      <Text className="text-sm font-medium text-gray-900 dark:text-white mb-1">
        {title}
      </Text>

      <Text className="text-xs text-gray-500 dark:text-gray-400">
        {description}
      </Text>
    </TouchableOpacity>
  </Animated.View>
);

export default function Artists() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const { isDarkColorScheme } = useColorScheme();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    fetchArtists();
  }, []);

  useEffect(() => {
    // Filtrer les artistes selon la recherche
    if (searchQuery.trim() === '') {
      setFilteredArtists(artists);
    } else {
      const filtered = artists.filter(artist =>
        artist.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (artist.bio && artist.bio.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredArtists(filtered);
    }
  }, [searchQuery, artists]);

  const fetchArtists = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);

      // Récupérer tous les utilisateurs avec leurs derniers morceaux
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, username, avatar_url, bio, created_at');

      if (usersError) throw usersError;

      // Compter les tracks et récupérer le dernier morceau pour chaque utilisateur
      const artistsWithDetails = await Promise.all(
        usersData.map(async (user) => {
          // Compter les tracks
          const { count, error: countError } = await supabase
            .from('tracks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          // Récupérer le dernier morceau
          const { data: latestTrack } = await supabase
            .from('tracks')
            .select('title, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...user,
            tracks_count: count || 0,
            latest_track: latestTrack || undefined
          };
        })
      );

      // Filtrer seulement ceux qui ont des tracks et trier par nombre de morceaux
      const filteredArtists = artistsWithDetails
        .filter(artist => artist.tracks_count > 0)
        .sort((a, b) => b.tracks_count - a.tracks_count);

      setArtists(filteredArtists as Artist[]);
    } catch (err) {
      setError('Erreur lors du chargement des artistes');
      console.error('Error fetching artists:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchArtists(true);
  };

  const handleArtistPress = (artist: Artist) => {
    router.push(`/artist/${artist.id}`);
  };

  // Stats calculées
  const totalTracks = artists.reduce((sum, artist) => sum + artist.tracks_count, 0);
  const productiveArtists = artists.filter(artist => artist.tracks_count > 5).length;
  const newArtists = artists.filter(artist => {
    const createdAt = new Date(artist.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdAt > thirtyDaysAgo;
  }).length;

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
        <Animated.View style={[headerAnimatedStyle]} className="rounded-e-3xl overflow-hidden">
          <LinearGradient
            colors={['#a8edea', '#fed6e3', '#ffecd2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="relative"
            style={{ height: HEADER_HEIGHT }}
          >
            {/* Header Content */}
            <View
              className="flex-1 justify-end pb-6 px-6"
              style={{ paddingTop: insets.top + 20 }}
            >
              <Animated.View entering={FadeInDown.delay(200).springify()}>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="people" size={28} color="rgba(107, 114, 128, 0.8)" />
                  <Text className="text-gray-600 text-lg font-medium ml-2">
                    Communauté
                  </Text>
                </View>
                <Text className="text-gray-800 text-3xl font-bold mb-2">
                  Nos Artistes
                </Text>
                <Text className="text-gray-700 text-base">
                  Découvrez les talents de votre cercle musical
                </Text>
              </Animated.View>

              {/* Search Bar */}
              <Animated.View
                entering={FadeInUp.delay(400).springify()}
                className="mt-6"
              >
                <View className="bg-white/30 backdrop-blur-md rounded-2xl p-4 flex-row items-center">
                  <Ionicons name="search" size={20} color="rgba(107, 114, 128, 0.8)" />
                  <TextInput
                    className="text-gray-700 ml-3 flex-1"
                    placeholder="Rechercher un artiste..."
                    placeholderTextColor="rgba(107, 114, 128, 0.6)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color="rgba(107, 114, 128, 0.6)" />
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Statistiques */}
        {/* <View className="px-6 -mt-6 mb-8">
          <Animated.View
            entering={FadeInUp.delay(100).springify()}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Aperçu de la communauté
            </Text>

            <View className="flex-row justify-between">
              <CategoryCard
                title="Artistes"
                count={artists.length}
                description="Total actifs"
                icon="people"
                color="#10b981"
                onPress={() => { }}
                delay={200}
              />

              <CategoryCard
                title="Morceaux"
                count={totalTracks}
                description="Dans la bibliothèque"
                icon="musical-notes"
                color="#3b82f6"
                onPress={() => { }}
                delay={300}
              />
            </View>

            <View className="flex-row justify-between mt-4">
              <CategoryCard
                title="Productifs"
                count={productiveArtists}
                description="Plus de 5 morceaux"
                icon="trending-up"
                color="#8b5cf6"
                onPress={() => { }}
                delay={400}
              />

              <CategoryCard
                title="Nouveaux"
                count={newArtists}
                description="Ce mois-ci"
                icon="star"
                color="#f59e0b"
                onPress={() => { }}
                delay={500}
              />
            </View>
          </Animated.View>
        </View> */}

        {/* Liste des artistes */}
        <View className="p-6">
          {/* <Animated.View
            entering={FadeInRight.delay(600).springify()}
            className="flex-row items-center justify-between mb-6"
          >
            <View>
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                {searchQuery ? 'Résultats de recherche' : 'Tous les artistes'}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {filteredArtists.length} artiste{filteredArtists.length > 1 ? 's' : ''} trouvé{filteredArtists.length > 1 ? 's' : ''}
              </Text>
            </View>
          </Animated.View> */}

          {isLoading ? (
            <Animated.View
              entering={FadeInDown.delay(700).springify()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 items-center border border-gray-100 dark:border-gray-700"
            >
              <Ionicons name="disc" size={48} color="#9ca3af" />
              <Text className="text-gray-500 dark:text-gray-400 mt-4">
                Chargement des artistes...
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
          ) : filteredArtists.length === 0 ? (
            <Animated.View
              entering={FadeInDown.delay(700).springify()}
              className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 items-center border border-purple-200 dark:border-purple-800"
            >
              <Ionicons name="people-outline" size={48} color="#8b5cf6" />
              <Text className="text-purple-900 dark:text-purple-300 font-semibold mt-4 text-center">
                {searchQuery ? 'Aucun artiste trouvé' : 'Aucun artiste pour l\'instant'}
              </Text>
              <Text className="text-purple-700 dark:text-purple-400 text-center mt-2 mb-4">
                {searchQuery
                  ? `Aucun résultat pour "${searchQuery}"`
                  : 'Les artistes apparaîtront quand vos amis commenceront à uploader!'
                }
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  onPress={() => router.push('/upload')}
                  className="bg-purple-500 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-semibold">
                    Soyez le premier !
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          ) : (
            <View>
              {filteredArtists.map((artist, index) => (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  onPress={handleArtistPress}
                  index={index}
                />
              ))}
            </View>
          )}
        </View>

        {/* Call to Action pour inviter */}
        {artists.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(1000).springify()}
            className="mx-6 mb-8 rounded-3xl overflow-hidden"
          >
            <LinearGradient
              colors={['#a8edea', '#fed6e3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-3xl p-6"
            >
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text className="text-gray-800 text-xl font-bold mb-2">
                    Agrandissez le cercle !
                  </Text>
                  <Text className="text-gray-700 text-sm mb-4">
                    Plus d'artistes = plus de découvertes musicales incroyables.
                  </Text>
                  <TouchableOpacity
                    onPress={() => void 0}
                    className="bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl self-start"
                  >
                    <Text className="text-gray-800 font-semibold">
                      Inviter des amis
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="ml-4">
                  <Ionicons name="person-add" size={64} color="rgba(107, 114, 128, 0.6)" />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}
      </Animated.ScrollView>
    </View>
  );
}