import { Stack } from 'expo-router';
import React from 'react';

export default function LibraryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="favorites" />
      <Stack.Screen name="downloads" />
      <Stack.Screen name="history" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="search" />
    </Stack>
  );
}