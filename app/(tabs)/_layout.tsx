import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ds } from '../../src/components/designSystem';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: ds.colors.appBg },
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: Math.max(10, insets.bottom),
          borderRadius: 20,
          backgroundColor: ds.colors.shell,
          borderTopColor: 'transparent',
          borderWidth: 1,
          borderColor: ds.colors.stroke,
          paddingBottom: 8,
          paddingTop: 8,
          height: 68,
        },
        tabBarActiveTintColor: ds.colors.accent,
        tabBarInactiveTintColor: ds.colors.textSoft,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size, focused }) => {
          const iconName =
            route.name === 'index'
              ? focused
                ? 'sparkles'
                : 'sparkles-outline'
              : route.name === 'history'
                ? focused
                  ? 'analytics'
                  : 'analytics-outline'
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
