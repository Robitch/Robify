import { Stack, Tabs } from 'expo-router'
import { useAuth } from '../../provider/AuthProvider'
import React from 'react'
import { StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { FloatingPlayer } from '~/components/FloatingPlayer'
import { MusicPlayer } from '~/components/MusicPlayer'
import { Button } from '~/components/ui/button'
import { Image } from 'expo-image'
import { useColorScheme } from '~/lib/useColorScheme'

// Simple stack layout within the authenticated area
const TabsLayout = () => {
  const { signOut } = useAuth()
  const { isDarkColorScheme } = useColorScheme()

  return (
    <>

      <Tabs
        screenOptions={{
          // Disable headers by default to save space
          headerShown: false,

          // Tab bar styling
          tabBarActiveTintColor: '#10b981', // Primary green color
          tabBarInactiveTintColor: '#6b7280', // Gray color
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginBottom: 4,
          },
          tabBarStyle: {
            backgroundColor: isDarkColorScheme ? '#000000' : '#ffffff',
            borderTopWidth: 1,
            borderTopColor: isDarkColorScheme ? '#374151' : '#f3f4f6',
            paddingTop: 8,
            paddingBottom: 8,
            height: 70,
            // Hide tab bar when keyboard is visible
            display: 'flex',
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          // Hide tab bar when keyboard appears
          tabBarHideOnKeyboard: true,
        }}>
        <Tabs.Screen
          name="(songs)"
          options={{
            title: 'Musique',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="musical-notes-sharp" size={size} className={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="home"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} className={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} className={color} />,
          }}
        />
        <Tabs.Screen
          name="upload"
          options={{
            title: 'Upload',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cloud-upload-outline" size={size} className={color} />
            ),
          }}
        />
      </Tabs>
      {/* <FloatingPlayer className="absolute bottom-14 left-0 right-0" /> */}
      <FloatingPlayer
        style={{
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: 78, // Adjusted for new tab bar height
        }}
      />
      <MusicPlayer />

    </>
  )
}

export default TabsLayout
