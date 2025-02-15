import { Stack, Tabs } from 'expo-router'
import { useAuth } from '../../provider/AuthProvider'
import React from 'react'
import { StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
// Simple stack layout within the authenticated area
const TabsLayout = () => {
  const { signOut } = useAuth()

  return (
    // <Stack
    //   screenOptions={{
    //     headerShown: false,
    //   }}
    // >
    //   <Stack.Screen
    //     name="home"
    //   />
    // </Stack>
    <Tabs
      // safeAreaInsets={{
      //   bottom: 10,
      //   top: 10,
      //   left: 10,
      //   right: 10,
      // }}

      screenOptions={{
        // tabBarActiveTintColor: colors.primary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          borderRadius: 100,
          borderTopWidth: 0,
          bottom: 20,
          marginHorizontal: 20,
        },

        tabBarBackground: () => (
          <BlurView
            experimentalBlurMethod="dimezisBlurView"
            intensity={95}
            style={{
              ...StyleSheet.absoluteFillObject,
              overflow: 'hidden',
              borderRadius: 100,
            }}
          />
        ),
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={20} color={color} />,
        }}
      />
    </Tabs>
  )
}

export default TabsLayout
