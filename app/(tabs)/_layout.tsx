import { Stack, Tabs } from 'expo-router'
import { useAuth } from '../../provider/AuthProvider'
import React from 'react'
import { StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
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
          name="home"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="artists"
          options={{
            title: 'Artistes',
            tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="upload"
          options={{
            title: 'Upload',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cloud-upload-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  )
}

export default TabsLayout
