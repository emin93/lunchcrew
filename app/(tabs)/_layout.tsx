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
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Math.max(12, insets.bottom),
          borderRadius: 28,
          backgroundColor: 'rgba(12, 18, 40, 0.94)',
          borderTopColor: 'transparent',
          borderWidth: 1,
          borderColor: ds.colors.stroke,
          paddingBottom: 10,
          paddingTop: 10,
          height: 78,
          ...ds.shadow.card,
        },
        tabBarActiveTintColor: ds.colors.text,
        tabBarInactiveTintColor: ds.colors.textSoft,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
        tabBarIconStyle: { marginBottom: 2 },
        tabBarItemStyle: { borderRadius: 20, marginHorizontal: 4 },
        tabBarActiveBackgroundColor: ds.colors.accentSoft,
        tabBarIcon: ({ color, size, focused }) => {
          const iconName =
            route.name === 'index'
              ? focused
                ? 'sparkles'
                : 'sparkles-outline'
              : route.name === 'history'
                ? focused
                  ? 'bar-chart'
                  : 'bar-chart-outline'
                : focused
                  ? 'people'
                  : 'people-outline';
          return <Ionicons name={iconName as any} size={focused ? size + 1 : size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="history" options={{ title: 'Insights' }} />
      <Tabs.Screen name="crew" options={{ title: 'Crew' }} />
    </Tabs>
  );
}
