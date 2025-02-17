import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "./ui/text";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Image } from "expo-image";
import { Play } from "@/lib/icons/Play";
import { Pause } from "@/lib/icons/Pause";
import { Progress } from "./ui/progress";
import { AudioLines } from "@/lib/icons/AudioLines";
import { router } from "expo-router";
import { useAudioStore } from "@/store/audio";

export function FloatingPlayer({ className }: { className: string }) {
    const { currentTrack, isPlaying, play, pause, position, duration } = useAudioStore();
    const progress = duration > 0 ? (position / duration) * 100 : 0;

    if (!currentTrack) return null;

    return (
        <TouchableOpacity onPress={() => router.push("/player")} className={cn("bg-primary", className)}>
            <View className="p-3 flex-row items-center gap-5">
                {/* Image de la chanson */}
                <View className="relative">
                    <Image
                        source="https://picsum.photos/200/300"
                        contentFit="cover"
                        style={{
                            height: "100%",
                            aspectRatio: 1,
                            objectFit: "cover",
                            borderRadius: 5
                        }}
                    />
                    {isPlaying && (
                        <View className="absolute bg-black/50 w-full h-full flex items-center justify-center">
                            <AudioLines className="text-foreground" strokeWidth={2.5} size={24} />
                        </View>
                    )}
                </View>
                {/* Colonne avec titre et artiste */}
                <View className="flex-1">
                    <Text className="text-white text-lg font-bold">{currentTrack?.title || "Song Title"}</Text>
                    <Text className="text-white text-sm">{currentTrack?.author || "Artist Name"}</Text>
                </View>
                {/* Bouton de lecture/pause */}
                <Button onPress={isPlaying ? pause : play}>
                    {isPlaying ? <Pause className="text-foreground" strokeWidth={2.5} size={24} /> : <Play className="text-foreground" strokeWidth={2.5} size={24} />}
                </Button>
            </View>
            <Progress className="w-full" style={{ height: 2 }} value={progress} max={100} />
        </TouchableOpacity>
    );
}
