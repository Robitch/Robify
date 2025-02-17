import * as React from "react";
import { ScrollView, View } from "react-native";
import FileUpload from "@/components/FileUpload";
import { useAuth } from "@/provider/AuthProvider";
import MusicItem from "@/components/MusicItem";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FileObject } from "@supabase/storage-js";
import { useAudioStore } from "@/store/audio";

export default function Home() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileObject[]>([]);
  const { loadTrack, play } = useAudioStore();

  useEffect(() => {
    if (!user) return;
    loadFiles();
  }, [user]);

  const loadFiles = async () => {
    const { data, error } = await supabase.storage.from("files").list();
    if (error) {
      console.error("Error loading files:", error);
    }
    if (data) {
      setFiles(data);
    }
  };



  return (
    <ScrollView className="p-6 bg-secondary">
      <FileUpload loadFiles={loadFiles} />
      <ScrollView className="p-6" contentContainerStyle={{ gap: 10 }}>
        {files.map((item) => (
          <MusicItem
            key={item.id}
            item={item}
            userId={user!.id}
            onRemoveMusic={() => void 0}
          />
        ))}
      </ScrollView>
    </ScrollView>
  );
}
