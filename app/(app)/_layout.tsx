import { Stack } from 'expo-router'
import { useAuth } from '../../provider/AuthProvider'
import React from 'react'
import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

// Simple stack layout within the authenticated area
const StackLayout = () => {
  const { signOut } = useAuth()

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="home"
      />
    </Stack>
  )
}

export default StackLayout
