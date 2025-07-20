import { View } from "react-native";
import { Image, ImageBackground } from "expo-image";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "~/lib/useColorScheme";
import { cn } from "~/lib/utils";
import { BlurView } from "expo-blur";
import { Link } from "expo-router";

export default function ChooseTheme() {
    const insets = useSafeAreaInsets();
    const { isDarkColorScheme, setColorScheme, colorScheme } = useColorScheme();

    function toggleColorScheme(theme: "light" | "dark") {
        setColorScheme(theme);
    }

    return (
        <ImageBackground
            source={{
                uri: "https://www.espace-malraux.fr/wp-content/uploads/2019/11/JokAir-1080x1620-1.jpg"
            }}
            style={{
                flex: 1,
                justifyContent: "space-between",
                alignItems: "center",
                gap: 25,
                paddingTop: insets.top + 80,
                paddingBottom: insets.bottom + 25,
                paddingLeft: 25,
                paddingRight: 25,
            }}
            imageStyle={{
                opacity: 0.5,
            }}
        >
            {/* Logo */}
            <Image
                source={require("@/assets/images/logo.svg")}
                contentFit="contain"
                style={{
                    width: "90%",
                    height: 50,
                }}
            />

            {/* Spacer */}
            <View className="flex-1" />

            {/* Choose your theme */}
            <View className="flex-1 gap-10">
                <Text className="text-2xl text-center font-semibold capitalize">Choose your theme</Text>
                <View className="flex-row gap-10">
                    {["light", "dark"].map((theme) => (
                        <View key={theme} className="items-center justify-center">
                            {/* <BlurView className="rounded-full overflow-hidden " experimentalBlurMethod="dimezisBlurView" blurReductionFactor={0.5} intensity={5}> */}
                            <Button variant="icon" size="icon" className={cn("w-20 h-20 aspect-square rounded-full active:bg-gray-600/20", colorScheme === theme && "border-primary border-2")} onPress={() => toggleColorScheme(theme as "light" | "dark")}>
                                <Ionicons name={theme === "light" ? "sunny-outline" : "moon-outline"} size={32} className={theme === colorScheme ? "text-primary" : "text-foreground"} />
                            </Button>
                            {/* </BlurView> */}
                            <Text className="font-semibold capitalize pt-5">{theme} theme</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Button */}
            <Link href="/" asChild>
                <Button className="w-full" style={{ height: 92, borderRadius: 30 }}><Text className="text-foreground" style={{ fontSize: 21, fontWeight: "bold" }}>Continue</Text></Button>
            </Link>
        </ImageBackground>
    );
}
