import { Link, Stack } from "expo-router";
import { View } from "react-native";
import { Text } from "~/components/ui/text";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-lg font-semibold mb-4">
          This screen doesn't exist.
        </Text>

        <Link href="/">
          <Text className="text-blue-500 underline">Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}
