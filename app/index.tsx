import { LoginForm } from "@/components/LoginForm";
import { View } from "react-native";
import { Image } from "expo-image";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center">
      {/* <View className="h-20 w-96"> */}
      <Image
        source={require("@/assets/images/logo.svg")}
        contentFit="contain"
        style={{
          width: "50%",
          height: 150,
        }}
      />
      {/* </View> */}
      <LoginForm />
    </View>
  );
}
