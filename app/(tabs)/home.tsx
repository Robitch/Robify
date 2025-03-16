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
// import TestPlayer from "@/components/TestPlayer";

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
