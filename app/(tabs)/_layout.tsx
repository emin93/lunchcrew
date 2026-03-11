import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: '#030712' },
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: Math.max(10, insets.bottom),
          borderRadius: 18,
          backgroundColor: 'rgba(15,20,44,0.92)',
          borderTopColor: 'transparent',
          borderWidth: 1,
          borderColor: '#3a4279',
          paddingBottom: 6,
          height: 62,
        },
        tabBarActiveTintColor: '#8be9ff',
        tabBarInactiveTintColor: '#8a96b8',
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
