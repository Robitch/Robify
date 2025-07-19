import "~/global.css";
import { useEffect } from "react";
import { useFonts } from "expo-font";

import { playbackService } from "@/constants/playbackService";
import TrackPlayer from "react-native-track-player";

import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import * as SplashScreen from 'expo-splash-screen';
import { Slot, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Platform } from "react-native";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import { PortalHost } from "@rn-primitives/portal";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import { AuthProvider, useAuth } from "@/provider/AuthProvider";
import { useSegments, useRouter } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSetupTrackPlayer } from "~/hooks/useSetupTrackPlayer";




const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

SplashScreen.preventAutoHideAsync();


const InitialLayout = () => {
  const { session, initialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();



  useEffect(() => {
    if (!initialized) return;

    // Check if the path/url is in the (auth) group
    const inAuthGroup = segments[0] === "(tabs)";

    if (session && !inAuthGroup) {
      // Redirect authenticated users to the main app
      router.replace("/home");
    } else if (!session) {
      // Redirect unauthenticated users to the onboarding flow
      router.replace("/(onboarding)/get-started");
    }
  }, [session, initialized]);



  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_right' }} />
      {/* <Stack.Screen name="(auth)/index" options={{ animation: 'slide_from_right' }} /> */}
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />

      <Stack.Screen
        name="PlayerScreen"
        options={{
          presentation: 'card',
          gestureEnabled: true,
          gestureDirection: 'vertical',
          animationDuration: 100,
          headerShown: false,
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="ProfileSetup"
        options={{
          presentation: 'card',
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="(modals)/addToPlaylist"
        options={{
          presentation: 'modal',
          // headerStyle: {
          //   backgroundColor: colors.background,
          // },
          headerTitle: 'Add to playlist',
          // headerTitleStyle: {
          //   color: colors.text,
          // },
        }}
      />
    </Stack>
  );
};

export default function RootLayout() {
  const hasMounted = React.useRef(false);
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);
  const [isPlayerReady, setIsPlayerReady] = React.useState(false);

  const [loaded, error] = useFonts({
    "Satoshi-Regular": require("~/assets/fonts/Satoshi-Regular.otf"),
    "Satoshi-Bold": require("~/assets/fonts/Satoshi-Bold.otf"),
    "Satoshi-Medium": require("~/assets/fonts/Satoshi-Medium.otf"),
    "Satoshi-Light": require("~/assets/fonts/Satoshi-Light.otf"),
    "Satoshi-Black": require("~/assets/fonts/Satoshi-Black.otf"),
  });

  useIsomorphicLayoutEffect(() => {
    if (hasMounted.current) {
      return;
    }

    if (Platform.OS === "web") {
      // Adds the background color to the html element to prevent white background on overscroll.
      document.documentElement.classList.add("bg-background");
    }
    setAndroidNavigationBar(colorScheme);
    setIsColorSchemeLoaded(true);
    hasMounted.current = true;
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useSetupTrackPlayer({
    onLoad: () => {
      setIsPlayerReady(true);
    },
  });

  if ((!loaded && !error) || !isColorSchemeLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          {/* <SafeAreaView style={{ flex: 1 }}> */}
          <StatusBar style={isDarkColorScheme ? "light" : "dark"} backgroundColor="transparent" />
          <InitialLayout />
          <PortalHost />
          {/* </SafeAreaView> */}
        </GestureHandlerRootView>
      </ThemeProvider>
    </AuthProvider>
  );
}

const useIsomorphicLayoutEffect =
  Platform.OS === "web" && typeof window === "undefined"
    ? React.useEffect
    : React.useLayoutEffect;
