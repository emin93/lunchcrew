import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingScreen } from '../src/components/OnboardingScreen';
import { MonetizationModal } from '../src/components/MonetizationModal';
import { MONETIZATION_LAST_PROMPT_AT_KEY, MONETIZATION_WAITLIST_JOINED_KEY } from '../src/lib/helpers';
import { AppStateProvider, useAppStateContext } from '../src/state/AppStateContext';

function RootContent() {
  const state = useAppStateContext();

  if (!state.onboardingReady) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.centered}>
          <ActivityIndicator color="#22d3ee" />
          <Text style={styles.helper}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!state.onboardingDone) {
    return (
      <OnboardingScreen
        onSubmitName={(name) => void state.completeOnboarding(name)}
        onSkip={() => void state.completeOnboarding()}
        buildLabel={state.BUILD_LABEL}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, Platform.OS === 'web' && styles.safeAreaWeb]} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>

      <MonetizationModal
        visible={state.showMonetizationModal}
        workspaceId={state.workspace?.id}
        deviceId={state.deviceId}
        onClose={() => {
          void AsyncStorage.setItem(MONETIZATION_LAST_PROMPT_AT_KEY, String(Date.now()));
          state.setShowMonetizationModal(false);
        }}
        onJoined={() => {
          void AsyncStorage.setItem(MONETIZATION_WAITLIST_JOINED_KEY, '1');
          void AsyncStorage.setItem(MONETIZATION_LAST_PROMPT_AT_KEY, String(Date.now()));
          state.setShowMonetizationModal(false);
        }}
      />
    </SafeAreaView>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <RootContent />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#030712' },
  safeAreaWeb: { minHeight: '100dvh' as any },
  helper: { color: '#94a3b8', fontSize: 13 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
});
