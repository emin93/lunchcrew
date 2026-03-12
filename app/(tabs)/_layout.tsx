import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ds } from '../../src/components/designSystem';

const meta = {
  index: { label: 'Today', active: 'sparkles', idle: 'sparkles-outline' },
  history: { label: 'Insights', active: 'stats-chart', idle: 'stats-chart-outline' },
  crew: { label: 'Crew', active: 'people', idle: 'people-outline' },
} as const;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => {
        const routeMeta = meta[route.name as keyof typeof meta];

        return {
          headerShown: false,
          sceneStyle: { backgroundColor: ds.colors.appBg },
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            position: 'absolute',
            left: 18,
            right: 18,
            bottom: Math.max(14, insets.bottom || 14),
            height: 82,
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: 10,
            borderTopWidth: 0,
            borderRadius: 30,
            backgroundColor: 'rgba(8, 13, 30, 0.92)',
            borderWidth: 1,
            borderColor: ds.colors.strokeStrong,
            ...ds.shadow.card,
          },
          tabBarShowLabel: false,
          tabBarItemStyle: { marginHorizontal: 2 },
          tabBarButton: (props) => {
            const focused = props.accessibilityState?.selected;
            return (
              <Pressable
                onPress={props.onPress}
                onLongPress={props.onLongPress}
                accessibilityState={props.accessibilityState}
                accessibilityRole={props.accessibilityRole}
                accessibilityLabel={props.accessibilityLabel}
                testID={props.testID}
                style={[styles.tabButton, focused && styles.tabButtonFocused]}
              >
                <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
                  <Ionicons
                    name={(focused ? routeMeta.active : routeMeta.idle) as any}
                    size={20}
                    color={focused ? ds.colors.text : ds.colors.textSoft}
                  />
                </View>
                <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{routeMeta.label}</Text>
              </Pressable>
            );
          },
        };
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="history" options={{ title: 'Insights' }} />
      <Tabs.Screen name="crew" options={{ title: 'Crew' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 24,
    paddingVertical: 8,
  },
  tabButtonFocused: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  iconWrapFocused: {
    backgroundColor: ds.colors.accentSoft,
    borderColor: ds.colors.accentSoftStrong,
    ...ds.shadow.glow,
  },
  tabLabel: {
    color: ds.colors.textSoft,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tabLabelFocused: {
    color: ds.colors.text,
  },
});
