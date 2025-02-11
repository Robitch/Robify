import React, { useEffect, useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { View } from "react-native"
import { Text } from "./ui/text"
import { FileUp } from "@/lib/icons/FileUp"
import { cn } from "@/lib/utils"
import { decode } from 'base64-arraybuffer'
import FileSystem from 'expo-file-system'

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

        // open file 
        const result = await DocumentPicker.getDocumentAsync({
            // type: 'audio/*, video/*, image/*',
            copyToCacheDirectory: true,
        });
        if (result.canceled) return

        setMusic(result.assets[0])
    }


    const uploadMusic = async () => {
        if (!music) return

        console.log("Music", music)
        const infos = await FileSystem.getInfoAsync(music.uri)
        console.log("Information", infos)
        if (!infos.exists) return

        // during 2 seconds, update progress
        // const interval = setInterval(() => {
        //     setProgress(progress + 10)
        // }, 2000)
        console.log("Downloading fil")
        // get SAF url
        // const SAF_URL = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(music.uri)
        // const base64 = await FileSystem.readAsStringAsync(music.uri, { encoding: "base64" })
        // console.log("Uploading file ", base64)
        // const filePath = `${FileSystem.documentDirectory}${music.name}`
        // await FileSystem.writeAsStringAsync(filePath, base64, { encoding: FileSystem.EncodingType.Base64 })



        // const { data, error } = await supabase.storage.from('files').upload(music.name, decode(file), { contentType: music.mimeType })
        // const { data, error } = await supabase.storage.from('files').upload(music.name, decode(music.uri), { contentType: music.mimeType })
        const base64 = await FileSystem.readAsStringAsync(music.uri, { encoding: 'base64' });
        // const filePath = `${user!.id}/${new Date().getTime()}.${music.mimeType?.toUpperCase().split('/')[1]}`;
        // const contentType = music.mimeType?.toUpperCase().split('/')[1] === 'MP3' ? 'audio/mpeg' : 'video/mp4';
        console.log("Base64", base64)
        const contentType = music.mimeType
        const response = await supabase.storage.from('files').upload(music.name, decode(base64), { contentType });
        console.log(music.name, response)

        if (response) {
            setProgress(100)
            setMusic(null)
            loadFiles()
        }
    }



    const resetMusic = () => {
        setMusic(null)
        setProgress(0)
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
