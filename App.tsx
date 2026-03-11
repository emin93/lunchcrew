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
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { OnboardingScreen } from './src/components/OnboardingScreen';
import { PollPanel } from './src/components/PollPanel';
import { HistoryPanel } from './src/components/HistoryPanel';
import { WorkspacePanel } from './src/components/WorkspacePanel';
import { MonetizationModal } from './src/components/MonetizationModal';
import {
  BUILD_LABEL,
  DISPLAY_NAME_KEY,
  LOCATION_PROMPT_SEEN_KEY,
  MONETIZATION_LAST_PROMPT_AT_KEY,
  MONETIZATION_WAITLIST_JOINED_KEY,
  normalizeDisplayName,
  ONBOARDING_SEEN_KEY,
} from './src/lib/helpers';
import { isConfigured } from './src/lib/supabase';
import { useWorkspaceData } from './src/hooks/useWorkspaceData';
import { usePollData } from './src/hooks/usePollData';
import { trackEvent } from './src/lib/analytics';

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [requestLocation, setRequestLocation] = useState(false);
  const [showMonetizationModal, setShowMonetizationModal] = useState(false);
  const [show30DayHistory, setShow30DayHistory] = useState(false);
  const [screen, setScreen] = useState<'vote' | 'history' | 'crew'>('vote');
  const [scrollY, setScrollY] = useState(0);

  const initialized = useRef(false);

  const {
    workspace,
    deviceId,
    member,
    loading,
    renaming,
    savingName,
    loadError,
    setLoadError,
    createWorkspace,
    retryWorkspaceLoad,
    renameCrew,
    saveDisplayName,
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
    suggestions,
    loadingSuggestions,
    selectedSuggestion,
    setSelectedSuggestion,
    history7Days,
    history30Days,
    leaderboard,
  } = usePollData({ workspace, deviceId, onLoadError: setLoadError, requestLocation });

  const { width } = useWindowDimensions();
  const desktopNav = Platform.OS === 'web' && width >= 980;
  const compactHeader = scrollY > 32;

  const screenMeta = {
    vote: {
      ribbon: 'LIVE POLL',
      title: 'Decide lunch in one clean sweep',
      subtitle: 'Fast voting with momentum, clear winners, and less decision fatigue.',
    },
    history: {
      ribbon: 'CREW INTEL',
      title: 'Trends, streaks, and repeat winners',
      subtitle: 'See what actually wins and keep the best picks in rotation.',
    },
    crew: {
      ribbon: 'CREW CONTROL',
      title: 'People, invites, and identity',
      subtitle: 'Manage your LunchCrew with the same polished flow as voting.',
    },
  } as const;

  const configError = !isConfigured
    ? 'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in runtime.'
    : null;

  const completeOnboarding = async (name?: string) => {
    const trimmed = normalizeDisplayName(name || '');
    if (trimmed) await AsyncStorage.setItem(DISPLAY_NAME_KEY, trimmed);
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
    setOnboardingDone(true);
  };

  const shareInvite = async () => {
    if (!workspace) return;
    const inviteLink = `https://join.lunchcrew.app?code=${workspace.invite_code}`;

    try {
      await Share.share({
        title: 'LunchCrew Invite',
        message: `Join my LunchCrew: ${inviteLink}`,
      });
      void trackEvent('invite_shared', { workspace_id: workspace.id, method: 'native_share' }, deviceId);
      return;
    } catch {
      // Fallback to clipboard for web and environments without Share support.
    }

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(inviteLink);
        Alert.alert('Invite link copied', 'Paste it in chat to invite your crew.');
        void trackEvent('invite_shared', { workspace_id: workspace.id, method: 'clipboard_fallback' }, deviceId);
      } catch {
        Alert.alert('Could not share', 'Copy this invite code manually: ' + workspace.invite_code);
      }
      return;
    }

    Alert.alert('Could not share', 'Copy this invite code manually: ' + workspace.invite_code);
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
    if (onboardingReady && onboardingDone && !isConfigured) {
      Alert.alert('Supabase missing', 'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
    }
  }, [onboardingReady, onboardingDone]);

  useEffect(() => {
    if (!onboardingReady || !onboardingDone) return;

    const askLocationPermission = async () => {
      const seen = await AsyncStorage.getItem(LOCATION_PROMPT_SEEN_KEY);
      if (seen === '1') {
        setRequestLocation(true);
        return;
      }

      // On web, go straight to browser geolocation prompt after onboarding.
      // RN Alert can be inconsistent on web and block this flow.
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(LOCATION_PROMPT_SEEN_KEY, '1');
        setRequestLocation(true);
        return;
      }

      Alert.alert(
        'Enable location for better suggestions?',
        "LunchCrew uses your location only to improve nearby autocomplete suggestions. Your location isn't stored.",
        [
          {
            text: 'Not now',
            style: 'cancel',
            onPress: async () => {
              await AsyncStorage.setItem(LOCATION_PROMPT_SEEN_KEY, '1');
            },
          },
          {
            text: 'Continue',
            onPress: async () => {
              await AsyncStorage.setItem(LOCATION_PROMPT_SEEN_KEY, '1');
              setRequestLocation(true);
            },
          },
        ],
      );
    };

    void askLocationPermission();
  }, [onboardingReady, onboardingDone]);

  useEffect(() => {
    if (!onboardingReady || !onboardingDone || !workspace?.id) return;

    const maybeShowMonetizationModal = async () => {
      const joined = await AsyncStorage.getItem(MONETIZATION_WAITLIST_JOINED_KEY);
      if (joined === '1') return;

      const now = Date.now();
      const lastPromptRaw = await AsyncStorage.getItem(MONETIZATION_LAST_PROMPT_AT_KEY);
      if (!lastPromptRaw) {
        await AsyncStorage.setItem(MONETIZATION_LAST_PROMPT_AT_KEY, String(now));
        return;
      }

      const lastPrompt = Number(lastPromptRaw);
      if (!Number.isFinite(lastPrompt)) {
        await AsyncStorage.setItem(MONETIZATION_LAST_PROMPT_AT_KEY, String(now));
        return;
      }

      const oneDayMs = 24 * 60 * 60 * 1000;
      if (now - lastPrompt >= oneDayMs) {
        setShowMonetizationModal(true);
      }
    };

    void maybeShowMonetizationModal();
  }, [onboardingReady, onboardingDone, workspace?.id]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    html.style.backgroundColor = '#030712';
    body.style.backgroundColor = '#030712';
    body.style.margin = '0';
    body.style.overflowX = 'hidden';

    if (root) {
      root.style.backgroundColor = '#030712';
    }
  }, []);

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
        onSubmitName={(name) => void completeOnboarding(name)}
        onSkip={() => void completeOnboarding()}
        buildLabel={BUILD_LABEL}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, Platform.OS === 'web' && styles.safeAreaWeb]} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.bgBlobOne} pointerEvents="none" />
      <View style={styles.bgBlobTwo} pointerEvents="none" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, Platform.OS === 'web' && styles.scrollContentWeb]}
          keyboardShouldPersistTaps="handled"
          onScroll={(event) => setScrollY(event.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
        >
          <View style={styles.maxWidthWrap}>
            <View style={[styles.hero, compactHeader && styles.heroCompact]}>
              <View style={styles.heroGlow} pointerEvents="none" />
              <View style={styles.heroTopRow}>
                <View style={styles.heroRibbon}>
                  <Text style={styles.heroRibbonText}>{screenMeta[screen].ribbon}</Text>
                </View>
                <Text style={styles.buildLabel}>{BUILD_LABEL}</Text>
              </View>
              <Text style={[styles.title, compactHeader && styles.titleCompact]}>{screenMeta[screen].title}</Text>
              {!compactHeader ? <Text style={styles.subtitle}>{screenMeta[screen].subtitle}</Text> : null}
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatCard}><Text style={styles.heroStatLabel}>Crew</Text><Text style={styles.heroStatValue}>{workspace?.invite_code || '—'}</Text></View>
                <View style={styles.heroStatCard}><Text style={styles.heroStatLabel}>Options</Text><Text style={styles.heroStatValue}>{options.length}</Text></View>
                <View style={styles.heroStatCard}><Text style={styles.heroStatLabel}>Leader</Text><Text style={styles.heroStatValue} numberOfLines={1}>{topChoice || '—'}</Text></View>
              </View>
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

            {desktopNav ? (
              <View style={styles.desktopLayout}>
                <View style={styles.desktopSidebar}>
                  <Text style={styles.sidebarTitle}>Navigate</Text>
                  {[
                    { key: 'vote', label: 'Vote' },
                    { key: 'history', label: 'History' },
                    { key: 'crew', label: 'Crew' },
                  ].map((item) => (
                    <Pressable
                      key={item.key}
                      style={[styles.sidebarItem, screen === item.key && styles.sidebarItemActive]}
                      onPress={() => setScreen(item.key as any)}
                    >
                      <Text style={[styles.sidebarItemText, screen === item.key && styles.sidebarItemTextActive]}>{item.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.desktopContent}>
                  {screen === 'vote' && poll ? (
                    <PollPanel
                      poll={poll}
                      options={options}
                      myOptionId={myOptionId}
                      votingOptionId={votingOptionId}
                      addingOption={addingOption}
                      newOption={newOption}
                      topChoice={topChoice}
                      suggestions={suggestions}
                      loadingSuggestions={loadingSuggestions}
                      selectedSuggestion={selectedSuggestion}
                      onSelectSuggestion={(s) => {
                        setSelectedSuggestion(s);
                        setNewOption(s.name);
                        void trackEvent('place_suggestion_selected', { poll_id: poll.id, workspace_id: workspace?.id, place_id: s.externalPlaceId }, deviceId);
                      }}
                      onClearSuggestion={() => setSelectedSuggestion(null)}
                      onVote={vote}
                      onOpenMaps={(optionId, url) =>
                        void trackEvent('maps_opened', { option_id: optionId, poll_id: poll.id, workspace_id: workspace?.id, url }, deviceId)
                      }
                      onOpenMenu={(optionId, url) =>
                        void trackEvent('menu_opened', { option_id: optionId, poll_id: poll.id, workspace_id: workspace?.id, url }, deviceId)
                      }
                      onChangeNewOption={(v) => {
                        setSelectedSuggestion(null);
                        setNewOption(v);
                      }}
                      onAddOption={addOption}
                    />
                  ) : null}
                  {screen === 'history' && workspace ? (
                    <HistoryPanel
                      days7={history7Days}
                      days30={history30Days}
                      leaderboard={leaderboard}
                      show30Days={show30DayHistory}
                      onToggleRange={setShow30DayHistory}
                    />
                  ) : null}
                  {screen === 'crew' && workspace ? (
                    <WorkspacePanel
                      workspace={workspace}
                      displayName={member?.display_name || ''}
                      onSaveDisplayName={(name) => void saveDisplayName(name)}
                      savingName={savingName}
                      onShare={shareInvite}
                      onRename={renameCrew}
                      onCreateNewCrew={() => void createNewCrew()}
                      renaming={renaming}
                    />
                  ) : null}
                </View>
              </View>
            ) : (
              <>
                {screen === 'crew' && workspace ? (
                  <WorkspacePanel
                    workspace={workspace}
                    displayName={member?.display_name || ''}
                    onSaveDisplayName={(name) => void saveDisplayName(name)}
                    savingName={savingName}
                    onShare={shareInvite}
                    onRename={renameCrew}
                    onCreateNewCrew={() => void createNewCrew()}
                    renaming={renaming}
                  />
                ) : null}

                {screen === 'vote' && poll ? (
                  <PollPanel
                    poll={poll}
                    options={options}
                    myOptionId={myOptionId}
                    votingOptionId={votingOptionId}
                    addingOption={addingOption}
                    newOption={newOption}
                    topChoice={topChoice}
                    suggestions={suggestions}
                    loadingSuggestions={loadingSuggestions}
                    selectedSuggestion={selectedSuggestion}
                    onSelectSuggestion={(s) => {
                      setSelectedSuggestion(s);
                      setNewOption(s.name);
                      void trackEvent('place_suggestion_selected', { poll_id: poll.id, workspace_id: workspace?.id, place_id: s.externalPlaceId }, deviceId);
                    }}
                    onClearSuggestion={() => setSelectedSuggestion(null)}
                    onVote={vote}
                    onOpenMaps={(optionId, url) =>
                      void trackEvent('maps_opened', { option_id: optionId, poll_id: poll.id, workspace_id: workspace?.id, url }, deviceId)
                    }
                    onOpenMenu={(optionId, url) =>
                      void trackEvent('menu_opened', { option_id: optionId, poll_id: poll.id, workspace_id: workspace?.id, url }, deviceId)
                    }
                    onChangeNewOption={(v) => {
                      setSelectedSuggestion(null);
                      setNewOption(v);
                    }}
                    onAddOption={addOption}
                  />
                ) : null}

                {screen === 'history' && workspace ? (
                  <HistoryPanel
                    days7={history7Days}
                    days30={history30Days}
                    leaderboard={leaderboard}
                    show30Days={show30DayHistory}
                    onToggleRange={setShow30DayHistory}
                  />
                ) : null}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {!desktopNav ? (
        <View style={styles.mobileTabBarWrap}>
          <View style={styles.mobileTabRow}>
            {['vote', 'history', 'crew'].map((s) => (
              <Pressable key={s} style={[styles.mobileTab, screen === s && styles.mobileTabActive]} onPress={() => setScreen(s as any)}>
                <Text style={[styles.mobileTabText, screen === s && styles.mobileTabTextActive]}>
                  {s === 'vote' ? 'Vote' : s === 'history' ? 'History' : 'Crew'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <MonetizationModal
        visible={showMonetizationModal}
        workspaceId={workspace?.id}
        deviceId={deviceId}
        onClose={() => {
          void AsyncStorage.setItem(MONETIZATION_LAST_PROMPT_AT_KEY, String(Date.now()));
          setShowMonetizationModal(false);
        }}
        onJoined={() => {
          void AsyncStorage.setItem(MONETIZATION_WAITLIST_JOINED_KEY, '1');
          void AsyncStorage.setItem(MONETIZATION_LAST_PROMPT_AT_KEY, String(Date.now()));
          setShowMonetizationModal(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050713' },
  safeAreaWeb: { minHeight: '100dvh' as any },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 18, paddingBottom: 110, gap: 16 },
  scrollContentWeb: { minHeight: '100dvh' as any },
  maxWidthWrap: { width: '100%', maxWidth: 1080, alignSelf: 'center', gap: 16 },
  hero: {
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingVertical: 20,
    backgroundColor: 'rgba(15,19,43,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(112,137,255,0.35)',
    shadowColor: '#020617',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
    gap: 10,
    overflow: 'hidden',
  },
  heroCompact: {
    paddingVertical: 14,
    gap: 6,
    borderColor: 'rgba(126,211,255,0.45)',
  },
  heroGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 999,
    top: -170,
    right: -70,
    backgroundColor: 'rgba(96,165,250,0.24)',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroRibbon: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(58,74,171,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroRibbonText: { color: '#e6eeff', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: '#f8fafc', fontSize: 34, fontWeight: '900', marginTop: 2, letterSpacing: -0.9, lineHeight: 40 },
  titleCompact: { fontSize: 25, lineHeight: 30 },
  subtitle: { color: '#bfd0f6', fontSize: 14, marginTop: 2, lineHeight: 21 },
  heroStatsRow: { flexDirection: 'row', gap: 9, marginTop: 8 },
  heroStatCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.28)',
    backgroundColor: 'rgba(15,23,42,0.58)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  heroStatLabel: { color: '#94a7dc', fontSize: 10, fontWeight: '700', marginBottom: 2 },
  heroStatValue: { color: '#edf2ff', fontSize: 12, fontWeight: '800' },
  buildLabel: { color: '#8ea4dd', fontSize: 11, fontWeight: '700' },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  loadingText: { color: '#67e8f9', fontSize: 13 },
  helper: { color: '#94a3b8', fontSize: 13 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    backgroundColor: 'rgba(43,16,20,0.9)',
    padding: 13,
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
  bgBlobOne: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: 'rgba(56,189,248,0.16)',
  },
  bgBlobTwo: {
    position: 'absolute',
    top: 10,
    right: -110,
    width: 340,
    height: 340,
    borderRadius: 999,
    backgroundColor: 'rgba(139,92,246,0.16)',
  },
  mobileTabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: 'rgba(5,7,19,0.3)',
  },
  mobileTabRow: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.32)',
    backgroundColor: 'rgba(15,23,42,0.84)',
    padding: 7,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 9,
  },
  mobileTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 11,
  },
  mobileTabActive: { backgroundColor: 'rgba(79,70,229,0.42)' },
  mobileTabText: { color: '#95a8d5', fontWeight: '700', fontSize: 13 },
  mobileTabTextActive: { color: '#e7ecff' },
  desktopLayout: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  desktopSidebar: {
    width: 190,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(112,137,255,0.4)',
    backgroundColor: 'rgba(15,19,43,0.78)',
    padding: 11,
    gap: 8,
  },
  sidebarTitle: { color: '#9cb2e6', fontSize: 12, fontWeight: '700', marginBottom: 2, paddingHorizontal: 6 },
  sidebarItem: { borderRadius: 12, paddingVertical: 11, paddingHorizontal: 12 },
  sidebarItemActive: { backgroundColor: 'rgba(79,70,229,0.38)' },
  sidebarItemText: { color: '#9fb0ce', fontSize: 13, fontWeight: '700' },
  sidebarItemTextActive: { color: '#ecf2ff' },
  desktopContent: { flex: 1, gap: 12 },
});
