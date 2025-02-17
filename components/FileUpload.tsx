import React, { useEffect, useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { View } from "react-native"
import { Text } from "./ui/text"
import { FileUp } from "@/lib/icons/FileUp"
import { cn } from "@/lib/utils"
import { decode, encode } from 'base64-arraybuffer'
import FileSystem, { copyAsync, makeDirectoryAsync, cacheDirectory, getInfoAsync, readAsStringAsync } from 'expo-file-system'
import { File } from 'expo-file-system/next'

import { useAuth } from "~/provider/AuthProvider"
import { supabase } from "~/lib/supabase"
import * as DocumentPicker from 'expo-document-picker';
import { Music2 } from "~/lib/icons/Music2"
import { Progress } from "./ui/progress"
import { Badge } from "./ui/badge"

export default function FileUpload({ loadFiles }: { loadFiles: () => void }) {
    const [isPressed, setIsPressed] = useState(false)
    const [music, setMusic] = useState<DocumentPicker.DocumentPickerAsset | null>(null)
    const [progress, setProgress] = useState(0)

    const onSelectMusic = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'audio/*',
            copyToCacheDirectory: false,
        });
        if (result.canceled) return

        setMusic(result.assets[0])
    }

    const createCacheFile = async ({ name, uri }: { name: string, uri: string }) => {
        if (!(await getInfoAsync(cacheDirectory + "uploads/")).exists) {
            await makeDirectoryAsync(cacheDirectory + "uploads/");
        }
        const cacheFilePath = cacheDirectory + "uploads/" + name;
        await copyAsync({ from: uri, to: cacheFilePath });
        return cacheFilePath;
    }


    const uploadMusic = async () => {
        if (!music) return

        console.log("Music", music.uri)
        const file = await createCacheFile({ name: music.name, uri: music.uri })
        const base64 = await readAsStringAsync(file, { encoding: 'base64' })
        const { data, error } = await supabase.storage.from('files').upload(music.name, decode(base64), { contentType: music.mimeType })

        if (data) {
            setProgress(100)
            setMusic(null)
            loadFiles()
        }
    }


    const resetMusic = () => {
        setMusic(null)
        setProgress(0)
        loadFiles()
    }

    return (
        <Card>
            <CardContent className="p-6 space-y-4">


                {!music ? (
                    <View onTouchStart={() => { setIsPressed(true) }} onTouchEnd={() => { setIsPressed(false); onSelectMusic() }} className={cn("border-2 border-dashed border-foreground rounded-lg flex flex-col gap-1 p-6 items-center", isPressed && "border-muted-foreground")}>
                        <FileUp size={30} className={cn("mb-3 text-foreground", isPressed && "text-muted-foreground")} />
                        <Text className={cn("text-sm  font-medium", isPressed && "text-muted-foreground")}>Drag and drop a file or click to browse</Text>
                        <Text className={cn("text-xs", isPressed && "text-muted-foreground")}>PDF, image, video, or audio</Text>
                    </View>
                ) : (


                    <View className="gap-4 bg-secondary rounded-lg p-5 ">
                        <View className="flex-row justify-between items-center">
                            <Music2 size={26} className="text-foreground" />
                            <Badge className="text-sm py-1 px-3 border-foreground" variant="outline">
                                <Text className="">{music.mimeType?.toUpperCase().split('/')[1]}</Text>
                            </Badge>
                        </View>


                        <Text className="text-lg font-semibold">{music.name}</Text>

                        {progress > 0 &&
                            <>
                                <Progress
                                    value={progress}
                                    className="h-2 bg-input"
                                />
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-sm">{progress > 0 ? `${progress.toFixed(2)}/7.32 MB` : ''}</Text>
                                </View>
                            </>
                        }

                    </View>
                )}

            </CardContent>
            <CardFooter>
                <Button variant="ghost" onPress={resetMusic}><Text>R</Text></Button>
                <Button className="flex-1" disabled={!music} onPress={uploadMusic}><Text>Upload</Text></Button>
            </CardFooter>
        </Card>
    )
}
