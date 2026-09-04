import React from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useColors } from '@/hooks/useColors';

export default function TabLayout() {
  const c = useColors();
  const dark = useColorScheme() === 'dark';
  const ios = Platform.OS === 'ios';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.mutedForeground,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: ios ? 'transparent' : c.card,
          borderTopWidth: 1,
          borderTopColor: c.border,
          elevation: 0,
          ...(Platform.OS === 'web' ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          ios ? (
            <BlurView
              intensity={100}
              tint={dark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: c.card },
              ]}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schools"
        options={{
          title: 'المدارس',
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="visits"
        options={{
          title: 'الزيارات',
          tabBarIcon: ({ color }) => (
            <Feather name="camera" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'الأعمال',
          tabBarIcon: ({ color }) => (
            <Feather name="check-square" size={21} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
