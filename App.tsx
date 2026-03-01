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
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

type Workspace = { id: string; name: string; invite_code: string; created_at: string };
type Poll = { id: string; workspace_id: string; poll_date: string; title: string; created_at: string };
type PollOption = { id: string; poll_id: string; name: string; votes: number };

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const DEFAULT_OPTIONS = ['Tacos', 'Sushi', 'Burgers'];
const DEVICE_ID_KEY = 'lunchcrew.device_id';
const ONBOARDING_SEEN_KEY = 'lunchcrew.onboarding_seen';
const BUILD_LABEL = 'Build qa-v1';

const ONBOARDING_SLIDES = [
  { title: 'Create or Join Instantly', body: 'Open the app to create a workspace, or open an invite link to join your team.' },
  { title: 'Vote in One Tap', body: 'Today\'s lunch options appear automatically. Tap once to vote.' },
  { title: 'Keep It Collaborative', body: 'Anyone can add a new place idea, so the whole office can decide together.' },
];

function generateInviteCode() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LC-${part()}-${part()}`;
}

function todayDateUTC() {
  return new Date().toISOString().slice(0, 10);
}

function makeDeviceId() {
  return `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function extractInviteCode(input: string) {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  const upper = trimmed.toUpperCase();
  if (upper.startsWith('LC-')) return upper;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    const isLunchCrewLink = host.endsWith('lunchcrew.app') || url.protocol === 'lunchcrew:';
    if (!isLunchCrewLink) return '';
    return (url.searchParams.get('code') || '').toUpperCase();
  } catch {
    return '';
  }
}

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
  const { width } = useWindowDimensions();
  const initialized = useRef(false);
  const isConfigured = useMemo(() => !!supabase, []);

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

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name: 'LunchCrew Workspace', invite_code: generateInviteCode() })
      .select('*')
      .single();

    setLoading(false);
    if (error || !data) {
      setLoadError('Could not create workspace. Check internet and retry.');
      return;
    }
    setWorkspace(data as Workspace);
  };

  const joinByDeepLink = async (url: string) => {
    if (!supabase) return;
    const code = extractInviteCode(url);
    if (!code) return;

    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase.from('workspaces').select('*').eq('invite_code', code).single();
    setLoading(false);

    if (error || !data) {
      setLoadError('Join failed. Invite link invalid or network issue.');
      return;
    }
    setWorkspace(data as Workspace);
  };

  const ensureTodayPoll = async (workspaceId: string) => {
    if (!supabase) return null;
    const date = todayDateUTC();

    const existing = await supabase
      .from('polls')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('poll_date', date)
      .maybeSingle();

    if (existing.data) return existing.data as Poll;

    const created = await supabase
      .from('polls')
      .insert({ workspace_id: workspaceId, poll_date: date, title: "Today's Lunch" })
      .select('*')
      .single();

    if (created.error || !created.data) {
      setLoadError('Could not create today poll. Please retry.');
      return null;
    }

    await supabase.from('poll_options').insert(
      DEFAULT_OPTIONS.map((name) => ({ poll_id: created.data.id, name })),
    );

    return created.data as Poll;
  };

  const refreshPollData = async (pollId: string, voterId: string) => {
    if (!supabase) return;

    const [optionsRes, myVoteRes] = await Promise.all([
      supabase.from('poll_options').select('id,poll_id,name,votes(count)').eq('poll_id', pollId).order('created_at'),
      supabase.from('votes').select('option_id').eq('poll_id', pollId).eq('voter_id', voterId).maybeSingle(),
    ]);

    if (optionsRes.error) {
      setLoadError('Could not load poll options. Check internet and retry.');
      return;
    }

    const mapped: PollOption[] = ((optionsRes.data as any[]) || []).map((row) => ({
      id: row.id,
      poll_id: row.poll_id,
      name: row.name,
      votes: row.votes?.[0]?.count ?? 0,
    }));

    setOptions(mapped);
    setMyOptionId((myVoteRes.data as any)?.option_id ?? null);
  };

  const vote = async (optionId: string) => {
    if (!supabase || !poll || !deviceId || votingOptionId) return;

    setVotingOptionId(optionId);
    const { error } = await supabase.from('votes').upsert(
      { poll_id: poll.id, option_id: optionId, voter_id: deviceId },
      { onConflict: 'poll_id,voter_id' },
    );

    if (error) {
      setVotingOptionId(null);
      Alert.alert('Vote failed', error.message);
      return;
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
      Alert.alert('Could not add option', error.message);
      return;
    }

    setNewOption('');
    await refreshPollData(poll.id, deviceId);
    setAddingOption(false);
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
    if (!onboardingReady || !onboardingDone) return;
    if (initialized.current) return;
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
  }, [isConfigured, onboardingReady, onboardingDone]);

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

  const shareInvite = async () => {
    if (!workspace) return;
    const link = `https://lunchcrew.app/join?code=${workspace.invite_code}`;
    await Share.share({ title: 'LunchCrew Invite', message: `Join my LunchCrew workspace: ${link}` });
  };

  const retryLoad = async () => {
    setLoadError(null);
    if (!workspace) {
      await createWorkspace();
      return;
    }
    if (workspace && deviceId) {
      const todayPoll = await ensureTodayPoll(workspace.id);
      if (todayPoll) {
        setPoll(todayPoll);
        await refreshPollData(todayPoll.id, deviceId);
      }
    }
  };

  const top = options.slice().sort((a, b) => b.votes - a.votes)[0];
  const snapInterval = width;

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
    const isLast = onboardingIndex === ONBOARDING_SLIDES.length - 1;
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 14 : 0}
        >
          <View style={styles.onboardingScreen}>
            <View style={styles.onboardingTop}>
              <ScrollView
              ref={onboardingScrollRef}
              horizontal
              pagingEnabled
              bounces={false}
              overScrollMode="never"
              contentInsetAdjustmentBehavior="never"
              automaticallyAdjustContentInsets={false}
              showsHorizontalScrollIndicator={false}
              snapToInterval={snapInterval}
              decelerationRate="fast"
              disableIntervalMomentum
              onScroll={(e) => {
                const next = Math.round(e.nativeEvent.contentOffset.x / snapInterval);
                if (next !== onboardingIndex) {
                  setOnboardingIndex(Math.max(0, Math.min(ONBOARDING_SLIDES.length - 1, next)));
                }
              }}
              scrollEventThrottle={16}
            >
              {ONBOARDING_SLIDES.map((item) => (
                <View key={item.title} style={[styles.onboardingPage, { width }]}> 
                  <View style={styles.onboardingContent}>
                    <Text style={styles.kicker}>Welcome to LunchCrew</Text>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.subtitle}>{item.body}</Text>
                    <Text style={styles.buildLabel}>{BUILD_LABEL}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

            <View style={styles.onboardingBottom}>
              <View style={styles.dotsWrap}>
                {ONBOARDING_SLIDES.map((_, idx) => (
                  <View key={idx} style={[styles.dot, idx === onboardingIndex && styles.dotActive]} />
                ))}
              </View>

              <View style={styles.rowBetween}>
                <Pressable style={styles.onboardingSkipBtn} onPress={completeOnboarding}>
                  <Text style={styles.skipText}>Skip</Text>
                </Pressable>
                <Pressable
                  style={styles.onboardingPrimaryBtn}
                  onPress={() => {
                    if (isLast) {
                      void completeOnboarding();
                      return;
                    }
                    const next = onboardingIndex + 1;
                    onboardingScrollRef.current?.scrollTo({ x: snapInterval * next, animated: true });
                    setOnboardingIndex(next);
                  }}
                >
                  <Text style={styles.onboardingPrimaryBtnText}>{isLast ? 'Get started' : 'Next'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 14 : 0}
      >
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
          <View style={styles.panel}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.panelLabel}>Workspace</Text>
                <Text style={styles.workspaceTitle}>{workspace.name}</Text>
              </View>
              <Pressable style={styles.sharePill} onPress={shareInvite}>
                <Text style={styles.sharePillText}>Share invite</Text>
              </Pressable>
            </View>
            <Text style={styles.codeText}>Code: {workspace.invite_code}</Text>
          </View>
        ) : (
          <Text style={styles.helper}>Setting things up…</Text>
        )}

          {poll && (
            <View style={styles.panel}>
              <View style={styles.rowBetween}>
                <Text style={styles.pollTitle}>{poll.title}</Text>
                {top ? <Text style={styles.leaderTag}>Top: {top.name}</Text> : null}
              </View>

              <View style={styles.optionList}>
                {options.map((opt) => {
                  const isActive = myOptionId === opt.id;
                  const isVotingThis = votingOptionId === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      style={[styles.optionCard, isActive && styles.optionCardActive, !!votingOptionId && styles.optionDisabled]}
                      onPress={() => vote(opt.id)}
                      disabled={!!votingOptionId}
                    >
                      <View>
                        <Text style={styles.optionName}>{opt.name}</Text>
                        {isActive ? <Text style={styles.myVoteTag}>Your vote</Text> : null}
                      </View>
                      <View style={styles.voteMeta}>
                        {isVotingThis ? <ActivityIndicator size="small" color="#22d3ee" /> : null}
                        <Text style={styles.voteCount}>{opt.votes}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.addWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Suggest a place"
                  placeholderTextColor="#64748b"
                  value={newOption}
                  onChangeText={setNewOption}
                />
                <Pressable style={[styles.addBtn, addingOption && styles.optionDisabled]} onPress={addOption} disabled={addingOption}>
                  {addingOption ? <ActivityIndicator size="small" color="#071018" /> : <Text style={styles.addBtnText}>Add</Text>}
                </Pressable>
              </View>
            </View>
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

  onboardingScreen: {
    flex: 1,
    padding: 0,
    justifyContent: 'space-between',
  },
  onboardingTop: {
    flex: 1,
    justifyContent: 'center',
  },
  onboardingBottom: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 18,
  },

  hero: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  onboardingPage: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  onboardingContent: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  kicker: { color: '#22d3ee', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: '#f8fafc', fontSize: 34, fontWeight: '800', marginTop: 2 },
  subtitle: { color: '#94a3b8', fontSize: 14, marginTop: 2 },
  buildLabel: { color: '#475569', fontSize: 11, marginTop: 8, fontWeight: '600' },

  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  loadingText: { color: '#67e8f9', fontSize: 13 },
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

  panel: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  panelLabel: { color: '#64748b', fontSize: 12 },
  workspaceTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 17 },
  sharePill: { backgroundColor: '#0e7490', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  sharePillText: { color: '#ecfeff', fontWeight: '700', fontSize: 12 },
  codeText: { color: '#67e8f9', fontSize: 13, fontWeight: '600' },

  pollTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  leaderTag: { color: '#c4b5fd', fontSize: 12, fontWeight: '700' },

  optionList: { gap: 8 },
  optionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionCardActive: {
    borderColor: '#22c55e',
    backgroundColor: '#052e1d',
  },
  optionDisabled: { opacity: 0.65 },
  optionName: { color: '#e2e8f0', fontWeight: '700', fontSize: 15 },
  myVoteTag: { color: '#86efac', fontSize: 11, marginTop: 2, fontWeight: '700' },
  voteMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voteCount: { color: '#cbd5e1', fontWeight: '700', minWidth: 18, textAlign: 'right' },

  addWrap: { flexDirection: 'row', gap: 8, marginTop: 2 },
  input: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    color: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addBtn: {
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#22d3ee',
    paddingHorizontal: 12,
  },
  addBtnText: { color: '#0f172a', fontWeight: '800' },

  helper: { color: '#94a3b8', fontSize: 13 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  dotsWrap: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#334155' },
  dotActive: { backgroundColor: '#22d3ee', width: 20 },
  onboardingSkipBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  skipText: { color: '#cbd5e1', fontWeight: '700', fontSize: 16 },
  onboardingPrimaryBtn: {
    minHeight: 48,
    minWidth: 152,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#22d3ee',
  },
  onboardingPrimaryBtnText: { color: '#0f172a', fontWeight: '800', fontSize: 16 },
});
