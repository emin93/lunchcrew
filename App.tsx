import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import {
  BUILD_LABEL,
  DEFAULT_OPTIONS,
  DEVICE_ID_KEY,
  ONBOARDING_SEEN_KEY,
  extractInviteCode,
  generateInviteCode,
  makeDeviceId,
  todayDateUTC,
  withTimeout,
} from './src/lib/helpers';
import { isConfigured, supabase } from './src/lib/supabase';
import { ONBOARDING_SLIDES, Poll, PollOption, Workspace } from './src/types';

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [myOptionId, setMyOptionId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [votingOptionId, setVotingOptionId] = useState<string | null>(null);
  const [addingOption, setAddingOption] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);

  const onboardingScrollRef = useRef<ScrollView | null>(null);
  const initialized = useRef(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const configError = !isConfigured
    ? 'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in runtime.'
    : null;

  const loadDeviceId = async () => {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      setDeviceId(existing);
      return existing;
    }
    const created = makeDeviceId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, created);
    setDeviceId(created);
    return created;
  };

  const createWorkspace = async () => {
    if (!supabase) return;
    setLoading(true);
    setLoadError(null);

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('workspaces')
          .insert({ name: 'LunchCrew Workspace', invite_code: generateInviteCode() })
          .select('*')
          .single(),
      );
      setLoading(false);
      if (error || !data) return setLoadError('Could not create workspace. Check internet and retry.');
      setWorkspace(data as Workspace);
    } catch {
      setLoading(false);
      setLoadError('Network timeout while creating workspace. Please retry.');
    }
  };

  const joinByDeepLink = async (url: string) => {
    if (!supabase) return;
    const code = extractInviteCode(url);
    if (!code) return;

    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await withTimeout(
        supabase.from('workspaces').select('*').eq('invite_code', code).single(),
      );
      setLoading(false);
      if (error || !data) return setLoadError('Join failed. Invite link invalid or network issue.');
      setWorkspace(data as Workspace);
    } catch {
      setLoading(false);
      setLoadError('Network timeout while joining workspace. Please retry.');
    }
  };

  const ensureTodayPoll = async (workspaceId: string) => {
    if (!supabase) return null;
    const date = todayDateUTC();

    try {
      const existing = await withTimeout(
        supabase.from('polls').select('*').eq('workspace_id', workspaceId).eq('poll_date', date).maybeSingle(),
      );
      if (existing.data) return existing.data as Poll;

      const created = await withTimeout(
        supabase
          .from('polls')
          .insert({ workspace_id: workspaceId, poll_date: date, title: "Today's Lunch" })
          .select('*')
          .single(),
      );
      if (created.error || !created.data) {
        setLoadError('Could not create today poll. Please retry.');
        return null;
      }

      await withTimeout(
        supabase.from('poll_options').insert(DEFAULT_OPTIONS.map((name) => ({ poll_id: created.data.id, name }))),
      );
      return created.data as Poll;
    } catch {
      setLoadError('Network timeout while loading today poll. Please retry.');
      return null;
    }
  };

  const refreshPollData = async (pollId: string, voterId: string) => {
    if (!supabase) return;
    const [optionsRes, myVoteRes] = await Promise.all([
      withTimeout(supabase.from('poll_options').select('id,poll_id,name,votes(count)').eq('poll_id', pollId).order('created_at')),
      withTimeout(supabase.from('votes').select('option_id').eq('poll_id', pollId).eq('voter_id', voterId).maybeSingle()),
    ]);

    if (optionsRes.error) return setLoadError('Could not load poll options. Check internet and retry.');

    const mapped: PollOption[] = ((optionsRes.data as any[]) || []).map((r) => ({
      id: r.id,
      poll_id: r.poll_id,
      name: r.name,
      votes: r.votes?.[0]?.count ?? 0,
    }));

    setOptions(mapped);
    setMyOptionId((myVoteRes.data as any)?.option_id ?? null);
  };

  const vote = async (optionId: string) => {
    if (!supabase || !poll || !deviceId || votingOptionId) return;
    setVotingOptionId(optionId);
    const { error } = await supabase
      .from('votes')
      .upsert({ poll_id: poll.id, option_id: optionId, voter_id: deviceId }, { onConflict: 'poll_id,voter_id' });
    if (error) {
      setVotingOptionId(null);
      return Alert.alert('Vote failed', error.message);
    }
    await refreshPollData(poll.id, deviceId);
    setVotingOptionId(null);
  };

  const addOption = async () => {
    if (!supabase || !poll || addingOption) return;
    const name = newOption.trim();
    if (!name) return;

    setAddingOption(true);
    const { error } = await supabase.from('poll_options').insert({ poll_id: poll.id, name });
    if (error) {
      setAddingOption(false);
      return Alert.alert('Could not add option', error.message);
    }

    setNewOption('');
    await refreshPollData(poll.id, deviceId);
    setAddingOption(false);
  };

  const shareInvite = async () => {
    if (!workspace) return;
    await Share.share({
      title: 'LunchCrew Invite',
      message: `Join my LunchCrew workspace: https://lunchcrew.app/join?code=${workspace.invite_code}`,
    });
  };

  const retryLoad = async () => {
    setLoadError(null);
    if (!workspace) return createWorkspace();
    if (workspace && deviceId) {
      const todayPoll = await ensureTodayPoll(workspace.id);
      if (todayPoll) {
        setPoll(todayPoll);
        await refreshPollData(todayPoll.id, deviceId);
      }
    }
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
    setOnboardingDone(true);
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
    if (!onboardingReady || !onboardingDone || initialized.current) return;
    initialized.current = true;

    if (!isConfigured || !supabase) {
      Alert.alert('Supabase missing', 'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
      return;
    }

    const boot = async () => {
      try {
        await loadDeviceId();
        const initialUrl = await Promise.race<string | null>([
          Linking.getInitialURL(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
        ]);
        const initialCode = extractInviteCode(initialUrl || '');
        if (initialUrl && initialCode) await joinByDeepLink(initialUrl);
        else await createWorkspace();
      } catch {
        await createWorkspace();
      }
    };

    void boot();
    const sub = Linking.addEventListener('url', (event) => {
      if (extractInviteCode(event.url)) void joinByDeepLink(event.url);
    });
    return () => sub.remove();
  }, [onboardingReady, onboardingDone]);

  useEffect(() => {
    if (!workspace || !deviceId) return;
    const load = async () => {
      const todayPoll = await ensureTodayPoll(workspace.id);
      if (!todayPoll) return;
      setPoll(todayPoll);
      await refreshPollData(todayPoll.id, deviceId);
    };
    void load();
  }, [workspace, deviceId]);

  const topChoice = useMemo(() => options.slice().sort((a, b) => b.votes - a.votes)[0]?.name, [options]);

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
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={14}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.kicker}>Lunch planning, simplified</Text>
            <Text style={styles.title}>LunchCrew</Text>
            <Text style={styles.subtitle}>Pick a spot in seconds with your team.</Text>
            <Text style={styles.buildLabel}>{BUILD_LABEL}</Text>
          </View>

          {loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#22d3ee" />
              <Text style={styles.loadingText}>Syncing workspace…</Text>
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

          {workspace ? <WorkspacePanel workspace={workspace} onShare={shareInvite} /> : !configError && !loadError ? <Text style={styles.helper}>Setting things up…</Text> : null}

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#030712' },
  flex: { flex: 1 },
  container: { padding: 16, gap: 14 },
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
