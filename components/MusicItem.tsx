import { FileObject } from '@supabase/storage-js'
import { Image, View, TouchableOpacity } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useState, useEffect, useRef } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

// Music item component that displays the music from Supabase Storage and a delte button
export default function MusicItem({
    item,
    userId,
    onRemoveMusic,

}: {
    item: FileObject
    userId: string
    onRemoveMusic: () => void
}) {
    const [music, setMusic] = useState<string>('')
    // const player = useAudioPlayer(music)

    useEffect(() => {
        const getMusicUrl = async () => {
            const { data } = await supabase.storage.from('files').getPublicUrl(item.name)
            setMusic(data.publicUrl)
        }
        getMusicUrl()
    }, [])

    const audioRef = useRef<Audio.Sound | null>(null);

    async function playSound() {
        const { sound } = await Audio.Sound.createAsync({ uri: music });
        audioRef.current = sound;
        await sound.playAsync();
    }

    useEffect(() => {
        // playSound();


        // cleanup - important! avoids memory leaks
        return () => {
            // audio.current can be null if you click through too fast,
            // so that the audio doesn't have time to load
            if (audioRef.current !== null) {
                audioRef.current.unloadAsync();
            }
        }
    });






    return (
        <View className="flex-row items-center gap-2">
            <Text className="flex-1">{item.name}</Text>

            <Button onPress={playSound}><Text>Play</Text></Button>
            {/* Delete music button */}
            <TouchableOpacity onPress={onRemoveMusic}>
                <Ionicons name="trash-outline" size={20} color={'#fff'} />
            </TouchableOpacity>
        </View>
    )
}

