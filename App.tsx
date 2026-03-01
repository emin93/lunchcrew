import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { OnboardingScreen } from './src/components/OnboardingScreen';
import { PollPanel } from './src/components/PollPanel';
import { WorkspacePanel } from './src/components/WorkspacePanel';
import { BUILD_LABEL, ONBOARDING_SEEN_KEY } from './src/lib/helpers';
import { isConfigured } from './src/lib/supabase';
import { ONBOARDING_SLIDES } from './src/types';
import { useWorkspaceData } from './src/hooks/useWorkspaceData';
import { usePollData } from './src/hooks/usePollData';

export default function App() {
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);

  const onboardingScrollRef = useRef<ScrollView | null>(null);
  const initialized = useRef(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const {
    workspace,
    deviceId,
    loading,
    renaming,
    loadError,
    setLoadError,
    createWorkspace,
    retryWorkspaceLoad,
    renameCrew,
  } = useWorkspaceData({ enabled: onboardingReady && onboardingDone && !initialized.current });

  useEffect(() => {
    if (onboardingReady && onboardingDone && !initialized.current) {
      initialized.current = true;
    }
  }, [onboardingReady, onboardingDone]);

  const {
    poll,
    options,
    myOptionId,
    newOption,
    setNewOption,
    votingOptionId,
    addingOption,
    topChoice,
    vote,
    addOption,
    retryPollLoad,
  } = usePollData({ workspace, deviceId, onLoadError: setLoadError });

  const configError = !isConfigured
    ? 'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in runtime.'
    : null;

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
    setOnboardingDone(true);
  };

  const shareInvite = async () => {
    if (!workspace) return;
    await Share.share({
      title: 'LunchCrew Invite',
      message: `Join my LunchCrew: https://join.lunchcrew.app?code=${workspace.invite_code}`,
    });
  };

  const retryLoad = async () => {
    if (!workspace) return retryWorkspaceLoad();
    return retryPollLoad();
  };

  const createNewCrew = async () => {
    setLoadError(null);
    await createWorkspace();
  };

  useEffect(() => {
    const loadOnboarding = async () => {
      const seen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
      setOnboardingDone(seen === '1');
      setOnboardingReady(true);
    };
    void loadOnboarding();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    html.style.backgroundColor = '#030712';
    body.style.backgroundColor = '#030712';
    body.style.margin = '0';
    body.style.minHeight = '100vh';
    body.style.overflowX = 'hidden';

    if (root) {
      root.style.backgroundColor = '#030712';
      root.style.minHeight = '100vh';
    }
  }, []);

  useEffect(() => {
    if (onboardingReady && onboardingDone && !isConfigured) {
      Alert.alert('Supabase missing', 'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
    }
  }, [onboardingReady, onboardingDone]);

  if (!onboardingReady) {
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

  if (!onboardingDone) {
    return (
      <OnboardingScreen
        width={width}
        insetsTop={insets.top}
        insetsBottom={insets.bottom}
        index={onboardingIndex}
        onIndexChange={setOnboardingIndex}
        onSkip={() => void completeOnboarding()}
        onNext={() => {
          if (onboardingIndex === ONBOARDING_SLIDES.length - 1) return void completeOnboarding();
          const next = onboardingIndex + 1;
          onboardingScrollRef.current?.scrollTo({ x: width * next, animated: true });
          setOnboardingIndex(next);
        }}
        scrollRef={onboardingScrollRef}
        buildLabel={BUILD_LABEL}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.maxWidthWrap}>
            <View style={styles.hero}>
              <Text style={styles.kicker}>Lunch planning, simplified</Text>
              <Text style={styles.title}>LunchCrew</Text>
              <Text style={styles.subtitle}>Pick a spot in seconds with your team.</Text>
              <Text style={styles.buildLabel}>{BUILD_LABEL}</Text>
            </View>

            {loading && (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color="#22d3ee" />
                <Text style={styles.loadingText}>Syncing crew...</Text>
              </View>
            )}

            {configError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Config missing</Text>
                <Text style={styles.errorText}>{configError}</Text>
              </View>
            )}

            {loadError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Connection problem</Text>
                <Text style={styles.errorText}>{loadError}</Text>
                <Pressable style={styles.retryBtn} onPress={() => void retryLoad()}>
                  <Text style={styles.retryBtnText}>Retry</Text>
                </Pressable>
              </View>
            )}

            {workspace ? (
              <WorkspacePanel
              workspace={workspace}
              onShare={shareInvite}
              onRename={renameCrew}
              onCreateNewCrew={() => void createNewCrew()}
              renaming={renaming}
            />
            ) : !configError && !loadError ? (
              <Text style={styles.helper}>Setting things up…</Text>
            ) : null}

            {poll && (
              <PollPanel
                poll={poll}
                options={options}
                myOptionId={myOptionId}
                votingOptionId={votingOptionId}
                addingOption={addingOption}
                newOption={newOption}
                topChoice={topChoice}
                onVote={vote}
                onChangeNewOption={setNewOption}
                onAddOption={addOption}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, minHeight: '100%', backgroundColor: '#030712' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16, gap: 14 },
  maxWidthWrap: { width: '100%', maxWidth: 1024, alignSelf: 'center', gap: 14 },
  hero: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  kicker: { color: '#22d3ee', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: '#f8fafc', fontSize: 34, fontWeight: '800', marginTop: 2 },
  subtitle: { color: '#94a3b8', fontSize: 14, marginTop: 2 },
  buildLabel: { color: '#475569', fontSize: 11, marginTop: 8, fontWeight: '600' },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  loadingText: { color: '#67e8f9', fontSize: 13 },
  helper: { color: '#94a3b8', fontSize: 13 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  errorBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    backgroundColor: '#2b1014',
    padding: 12,
    gap: 8,
  },
  errorTitle: { color: '#fecaca', fontWeight: '800' },
  errorText: { color: '#fca5a5', fontSize: 13 },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryBtnText: { color: '#fff', fontWeight: '700' },
});
