import * as React from "react";
import { ScrollView, View } from "react-native";
import Animated, {
  FadeInUp,
  FadeOutDown,
  LayoutAnimationConfig,
} from "react-native-reanimated";
import { Info } from "~/lib/icons/Info";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Text } from "~/components/ui/text";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { router } from "expo-router";
import FileUpload from "@/components/FileUpload";
import { useAuth } from "@/provider/AuthProvider";
import MusicItem from "~/components/MusicItem";
import { useState } from "react";
import { useEffect } from "react";
import { supabase } from "~/lib/supabase";
import { FileObject } from '@supabase/storage-js'
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import MusicPlayer from "@/components/MusicPlayer";


const GITHUB_AVATAR_URI =
  "https://i.pinimg.com/originals/ef/a2/8d/efa28d18a04e7fa40ed49eeb0ab660db.jpg";

export default function Home() {
  const [progress, setProgress] = React.useState(78);
  const { signOut } = useAuth();
  const { user } = useAuth();
  const [files, setFiles] = useState<FileObject[]>([])


  useEffect(() => {
    if (!user) return;

    loadFiles();
  }, [user])

  const loadFiles = async () => {
    const { data } = await supabase.storage.from('files').list()
    // console.log("data", data)
    if (data) {
      setFiles(data)
    }
  }


  const getMusicUrl = async (name: string) => {
    const { data } = await supabase.storage.from('files').getPublicUrl(name)
    console.log(data)
  }

  function updateProgressValue() {
    setProgress(Math.floor(Math.random() * 100));
  }

  return (
    <ScrollView className="p-6 bg-secondary/30">
      {/* <Card className="w-full max-w-sm p-6 rounded-2xl">
        <CardHeader className="items-center">
          <Avatar alt="Rick Sanchez's Avatar" className="w-24 h-24">
            <AvatarImage source={{ uri: GITHUB_AVATAR_URI }} />
            <AvatarFallback>
              <Text>RS</Text>
            </AvatarFallback>
          </Avatar>
          <View className="p-3" />
          <CardTitle className="pb-2 text-center">Rick Sanchez</CardTitle>
          <View className="flex-row">
            <CardDescription className="text-base font-semibold">
              Scientist
            </CardDescription>
            <Tooltip delayDuration={150}>
              <TooltipTrigger className="px-2 pb-0.5 active:opacity-50">
                <Info
                  size={14}
                  strokeWidth={2.5}
                  className="w-4 h-4 text-foreground/70"
                />
              </TooltipTrigger>
              <TooltipContent className="py-2 px-4 shadow">
                <Text className="native:text-lg">Freelance</Text>
              </TooltipContent>
            </Tooltip>
          </View>
        </CardHeader> */}
      {/* <CardContent>
          <View className="flex-row justify-around gap-3">
            <View className="items-center">
              <Text className="text-sm text-muted-foreground">Dimension</Text>
              <Text className="text-xl font-semibold">C-137</Text>
            </View>
            <View className="items-center">
              <Text className="text-sm text-muted-foreground">Age</Text>
              <Text className="text-xl font-semibold">70</Text>
            </View>
            <View className="items-center">
              <Text className="text-sm text-muted-foreground">Species</Text>
              <Text className="text-xl font-semibold">Human</Text>
            </View>
          </View>
        </CardContent>
        <CardFooter className="flex-col gap-3 pb-0">
          <View className="flex-row items-center overflow-hidden">
            <Text className="text-sm text-muted-foreground">Productivity:</Text>
            <LayoutAnimationConfig skipEntering>
              <Animated.View
                key={progress}
                entering={FadeInUp}
                exiting={FadeOutDown}
                className="w-11 items-center"
              >
                <Text className="text-sm font-bold text-destructive">
                  {progress}%
                </Text>
              </Animated.View>
            </LayoutAnimationConfig>
          </View>
          <Progress
            value={progress}
            className="h-2"
            indicatorClassName="bg-destructive"
          />
          <View />
          <Button
            variant="outline"
            className="shadow shadow-foreground/5"
            onPress={updateProgressValue}
          >
            <Text>Update</Text>
          </Button>
        </CardFooter> */}
      {/* <Button onPress={signOut}>
          <Text>Logout</Text>
        </Button>
      </Card> */}
      <FileUpload loadFiles={loadFiles} />
      {/* <MusicPlayer />  */}

      {/* <View className="flex-1 justify-center items-center gap-5 p-6">
        <Text>Files</Text>
        {files.map((item, index) => (
          <MusicItem
            key={item.id}
            item={item}
            userId={user!.id}
            onRemoveMusic={() => void 0}
          />
        ))}
      </View> */}

      <ScrollView className="p-6" contentContainerStyle={{ gap: 10 }}>
        {files.map((item, index) => (
          <MusicItem
            key={item.id}
            item={item}
            userId={user!.id}
            onRemoveMusic={() => void 0}
          />
          // <Text>{item.name}</Text>
          // <Text key={item.name}>{JSON.stringify(item)}</Text>
        ))}
      </ScrollView>
    </ScrollView>
  );
}
