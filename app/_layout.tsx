import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingScreen } from '../src/components/OnboardingScreen';
import { MonetizationModal } from '../src/components/MonetizationModal';
import { ds } from '../src/components/designSystem';
import { MONETIZATION_LAST_PROMPT_AT_KEY, MONETIZATION_WAITLIST_JOINED_KEY } from '../src/lib/helpers';
import { AppStateProvider, useAppStateContext } from '../src/state/AppStateContext';

function AppBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[ds.colors.appBg, ds.colors.appBgAlt, '#06111d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.topGlow} />
      <View style={styles.rightGlow} />
      <View style={styles.bottomGlow} />
    </View>
  );
}

function RootContent() {
  const state = useAppStateContext();

  if (!state.onboardingReady) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <AppBackdrop />
        <StatusBar style="light" />
        <View style={styles.centered}>
          <View style={styles.loadingCard}>
            <ActivityIndicator color={ds.colors.accent} />
            <Text style={styles.helper}>Loading LunchCrew…</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!state.onboardingDone) {
    return <OnboardingScreen onSubmitName={(name) => void state.completeOnboarding(name)} onSkip={() => void state.completeOnboarding()} buildLabel={state.BUILD_LABEL} />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, Platform.OS === 'web' && styles.safeAreaWeb]} edges={['top', 'left', 'right']}>
      <AppBackdrop />
      <StatusBar style="light" />
      <View style={styles.navigatorWrap}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </View>

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
  safeArea: { flex: 1, backgroundColor: ds.colors.appBg },
  safeAreaWeb: { minHeight: '100dvh' as any },
  navigatorWrap: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingCard: {
    minWidth: 220,
    borderRadius: ds.radius.xl,
    paddingHorizontal: 22,
    paddingVertical: 18,
    backgroundColor: ds.colors.card,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    alignItems: 'center',
    gap: 10,
    ...ds.shadow.card,
  },
  helper: { color: ds.colors.textMuted, fontSize: 14, fontWeight: '600' },
  topGlow: {
    position: 'absolute',
    top: -150,
    left: -90,
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: 'rgba(122, 227, 195, 0.12)',
  },
  rightGlow: {
    position: 'absolute',
    top: -80,
    right: -70,
    width: 300,
    height: 300,
    borderRadius: 300,
    backgroundColor: 'rgba(246, 212, 122, 0.08)',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: -120,
    left: '20%' as any,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(132, 174, 218, 0.08)',
  },
});
