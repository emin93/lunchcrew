import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: '#030712' },
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#0b1220',
          borderTopColor: '#1e293b',
          paddingBottom: Platform.OS === 'web' ? ('max(6px, env(safe-area-inset-bottom))' as any) : 6,
          height: Platform.OS === 'web' ? ('calc(56px + env(safe-area-inset-bottom))' as any) : 56,
        },
        tabBarActiveTintColor: '#22d3ee',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarIcon: ({ color, size, focused }) => {
          const iconName =
            route.name === 'index'
              ? focused
                ? 'checkmark-circle'
                : 'checkmark-circle-outline'
              : route.name === 'history'
                ? focused
                  ? 'time'
                  : 'time-outline'
                : focused
                  ? 'people'
                  : 'people-outline';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Vote' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="crew" options={{ title: 'Crew' }} />
    </Tabs>
  );
}
