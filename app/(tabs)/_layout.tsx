import { Stack, Tabs } from 'expo-router'
import { useAuth } from '../../provider/AuthProvider'
import React from 'react'
import { StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { FloatingPlayer } from '~/components/FloatingPlayer'
import { MusicPlayer } from '~/components/MusicPlayer'
// Simple stack layout within the authenticated area
const TabsLayout = () => {
  const { signOut } = useAuth()

  return (
    <>

      <Tabs
        screenOptions={{
          // tabBarActiveTintColor: colors.primary,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerShown: false,
          // tabBarStyle: {
          //   position: 'absolute',
          //   borderRadius: 100,
          //   borderTopWidth: 0,
          //   bottom: 20,
          //   marginHorizontal: 20,
          // },

          // tabBarBackground: () => (
          //   <BlurView
          //     experimentalBlurMethod="dimezisBlurView"
          //     intensity={95}
          //     style={{
          //       ...StyleSheet.absoluteFillObject,
          //       overflow: 'hidden',
          //       borderRadius: 100,
          //     }}
          //   />
          // ),
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: () => <Ionicons name="home" size={20} className='text-foreground' />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: () => <Ionicons name="person" size={20} className="text-foreground" />,
          }}
        />
        <Tabs.Screen
          name="upload"
          options={{
            title: 'Upload',
            tabBarIcon: () => (
              <Ionicons name="cloud-upload-outline" size={20} className='text-foreground' />
            ),
          }}
        />
      </Tabs>
      {/* <FloatingPlayer className="absolute bottom-14 left-0 right-0" /> */}
      <MusicPlayer />

    </>
  )
}

export default TabsLayout
