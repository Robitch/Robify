import * as React from "react";
import { Pressable, ScrollView, View, RefreshControl } from "react-native";
import FileUpload from "@/components/FileUpload";
import { useAuth } from "@/provider/AuthProvider";
import MusicItem from "@/components/MusicItem";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FileObject } from "@supabase/storage-js";
import { useAudioStore } from "@/store/audio";
import { Track } from "~/types";
import MusicPlayer from "../MusicPlayer";
import { Text } from "~/components/ui/text";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import TestPlayer from "@/components/TestPlayer";

type SortField = 'title' | 'artist' | 'duration';
type SortOrder = 'asc' | 'desc';

export default function Home() {
  // const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // if (!user) return;
    fetchTracks()
  }, [sortField, sortOrder]);

  const fetchTracks = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      const { data, error: fetchError } = await supabase
        .from('tracks')
        .select(`
          *,
          user_profiles!tracks_main_artist_id_fkey (
            full_name,
            username
          )
        `)
        .order(sortField, { ascending: sortOrder === 'asc' });

      if (fetchError) throw fetchError;

      setTracks(data || []);
      console.log('Tracks:', data);
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

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        style={{
          paddingTop: insets.top + 16,
        }}
        contentContainerStyle={{
          paddingBottom: 120, // Space for floating player + tabs
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={["#10b981"]}
          />
        }
      >
        {/* Header */}
        {/* <View className="flex-row justify-between items-center px-4 pt-12 pb-2">
          <Pressable className="w-10 h-10 justify-center items-center">
            <Ionicons name="search" size={24} className="text-foreground" />
          </Pressable>

          <Image
            source={require("@/assets/images/logo.svg")}
            contentFit="contain"
            style={{
              width: 120,
              height: 36
            }}
            className="opacity-0"
          />

          <Pressable className="w-10 h-10 justify-center items-center">
            <Ionicons name="ellipsis-vertical" size={24} className="text-foreground" />
          </Pressable>
        </View> */}

        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Vos morceaux
          </Text>
          <Text className="text-base text-muted-foreground">
            {tracks.length} morceau{tracks.length > 1 ? 's' : ''} disponible{tracks.length > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Tracks List */}
        <View className="px-6">
          {isLoading ? (
            <View className="py-8">
              <Text className="text-center text-muted-foreground">Chargement...</Text>
            </View>
          ) : error ? (
            <View className="py-8">
              <Text className="text-center text-destructive">{error}</Text>
            </View>
          ) : tracks.length === 0 ? (
            <View className="py-8">
              <Text className="text-center text-muted-foreground">
                Aucun morceau trouvé. Uploadez votre première musique !
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {tracks.map((track) => (
                <MusicItem
                  key={track.id}
                  item={track}
                  onRemoveMusic={() => void 0}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>


  );
}
