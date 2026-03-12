import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ds } from '../../src/components/designSystem';

const meta = {
  index: { label: 'Today', active: 'radio', idle: 'radio-outline' },
  history: { label: 'Archive', active: 'albums', idle: 'albums-outline' },
  crew: { label: 'Crew', active: 'grid', idle: 'grid-outline' },
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
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: Math.max(12, insets.bottom || 12),
            height: 76,
            paddingHorizontal: 10,
            paddingTop: 8,
            paddingBottom: 10,
            borderTopWidth: 0,
            borderRadius: 26,
            backgroundColor: 'rgba(8, 17, 30, 0.94)',
            borderWidth: 1,
            borderColor: ds.colors.strokeStrong,
            ...ds.shadow.card,
          },
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
                  <Ionicons name={(focused ? routeMeta.active : routeMeta.idle) as any} size={18} color={focused ? ds.colors.text : ds.colors.textSoft} />
                </View>
                <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{routeMeta.label}</Text>
              </Pressable>
            );
          },
        };
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="history" options={{ title: 'Archive' }} />
      <Tabs.Screen name="crew" options={{ title: 'Crew' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 20,
  },
  tabButtonFocused: { backgroundColor: ds.colors.cardMuted },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.input,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
  },
  iconWrapFocused: { backgroundColor: ds.colors.accentSoft, borderColor: ds.colors.accentSoftStrong },
  tabLabel: { color: ds.colors.textSoft, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  tabLabelFocused: { color: ds.colors.text },
});
