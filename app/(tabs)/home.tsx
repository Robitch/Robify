import * as React from "react";
import { ScrollView, View } from "react-native";
import FileUpload from "@/components/FileUpload";
import { useAuth } from "@/provider/AuthProvider";
import MusicItem from "@/components/MusicItem";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FileObject } from "@supabase/storage-js";
import { useAudioStore } from "@/store/audio";
import { Track } from "~/types";
import MusicControl from 'react-native-music-control';


type SortField = 'title' | 'artist' | 'duration';
type SortOrder = 'asc' | 'desc';

export default function Home() {
  // const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // MusicControl.setNowPlaying({
  //   title: 'Billie Jean',
  //   artwork: 'https://i.imgur.com/e1cpwdo.png', // URL or RN's image require()
  //   artist: 'Michael Jackson',
  //   album: 'Thriller',
  //   genre: 'Post-disco, Rhythm and Blues, Funk, Dance-pop',
  //   duration: 294, // (Seconds)
    //   description: '', // Android Only
  //   color: 0xffffff, // Android Only - Notification Color
  //   colorized: true, // Android 8+ Only - Notification Color extracted from the artwork. Set to false to use the color property instead
  //   date: '1983-01-02T00:00:00Z', // Release Date (RFC 3339) - Android Only
  //   rating: 84, // Android Only (Boolean or Number depending on the type)
  //   notificationIcon: 'my_custom_icon', // Android Only (String), Android Drawable resource name for a custom notification icon
  //   isLiveStream: true, // iOS Only (Boolean), Show or hide Live Indicator instead of seekbar on lock screen for live streams. Default value is false.
  // })

  useEffect(() => {
    // if (!user) return;
    fetchTracks()
  }, [sortField, sortOrder]);

  const fetchTracks = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('tracks')
        .select(`
          *,
          artists (
            name
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
    }
  };



  return (
    <ScrollView className="p-6 bg-secondary">
      {/* <FileUpload loadFiles={loadFiles} /> */}
      <ScrollView className="p-6" contentContainerStyle={{ gap: 10 }}>
        {tracks.map((item) => (
          <MusicItem
            key={item.id}
            item={item}
            // userId={user!.id}
            onRemoveMusic={() => void 0}
          />
        ))}
      </ScrollView>
    </ScrollView>
  );
}
