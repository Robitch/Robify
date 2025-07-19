import { View } from "react-native";
import { Image, ImageBackground } from "expo-image";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, router } from "expo-router";

export default function GetStarted() {
  const insets = useSafeAreaInsets();
  return (
    <ImageBackground
      source={{
        uri: "https://www.lillelanuit.com/wp-content/uploads/2022/03/cd44d18bb193d4acff0954a6c9f8b876_announced_benplg-cavepo-roubaix.jpg"
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

      {/* Title */}
      <Text className="text-3xl font-semibold capitalize">Enjoy listening to music</Text>
      {/* Paragraph */}
      <Text className="text-xl text-center text-muted-foreground">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sagittis enim purus sed phasellus. Cursus ornare id scelerisque aliquam.</Text>
      {/* Button */}
      <Link href="/invitation-code" asChild>
        <Button className="w-full" style={{ height: 92, borderRadius: 30 }}><Text className="text-foreground" style={{ fontSize: 21, fontWeight: "bold" }}>Commencer</Text></Button>
      </Link>
    </ImageBackground>
  );
}
