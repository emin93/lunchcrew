import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
const BUILD_LABEL = 'Build 4eb7f2a';

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

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name: 'LunchCrew Workspace', invite_code: generateInviteCode() })
      .select('*')
      .single();

    setLoading(false);
    if (error || !data) {
      Alert.alert('Could not create workspace', error?.message ?? 'Unknown error');
      return;
    }
    setWorkspace(data as Workspace);
  };

  const joinByDeepLink = async (url: string) => {
    if (!supabase) return;
    const code = extractInviteCode(url);
    if (!code) return;

    setLoading(true);
    const { data, error } = await supabase.from('workspaces').select('*').eq('invite_code', code).single();
    setLoading(false);

    if (error || !data) {
      Alert.alert('Join failed', 'Workspace not found for this invite link.');
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
      Alert.alert('Poll error', created.error?.message ?? 'Could not create today poll');
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
      Alert.alert('Load options failed', optionsRes.error.message);
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

  useEffect(() => {
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
  }, [isConfigured]);

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

  const top = options.slice().sort((a, b) => b.votes - a.votes)[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>🍽️ LunchCrew</Text>
          <Text style={styles.subtitle}>Open app = workspace + today vote, instantly.</Text>
          <Text style={styles.buildLabel}>{BUILD_LABEL}</Text>
        </View>

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#7dd3fc" />
            <Text style={styles.loadingText}>Setting things up…</Text>
          </View>
        )}

        {workspace ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{workspace.name}</Text>
            <Text style={styles.inviteCode}>Code: {workspace.invite_code}</Text>
            <Pressable style={styles.primaryButton} onPress={shareInvite}>
              <Text style={styles.primaryButtonText}>Share Invite Link</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.helper}>Creating your workspace…</Text>
        )}

        {poll && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{poll.title}</Text>
            {options.map((opt) => {
              const isActive = myOptionId === opt.id;
              const isVotingThis = votingOptionId === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.optionButton, isActive && styles.optionActive, !!votingOptionId && styles.optionDisabled]}
                  onPress={() => vote(opt.id)}
                  disabled={!!votingOptionId}
                >
                  <Text style={styles.optionText}>{opt.name}</Text>
                  <View style={styles.voteRight}>
                    {isVotingThis && <ActivityIndicator size="small" color="#7dd3fc" />}
                    <Text style={styles.optionVotes}>{opt.votes} votes</Text>
                  </View>
                </Pressable>
              );
            })}

            <View style={styles.row}>
              <TextInput
                style={styles.input}
                placeholder="Add place"
                placeholderTextColor="#94a3b8"
                value={newOption}
                onChangeText={setNewOption}
              />
              <Pressable
                style={[styles.secondaryButton, addingOption && styles.optionDisabled]}
                onPress={addOption}
                disabled={addingOption}
              >
                {addingOption ? (
                  <ActivityIndicator size="small" color="#f1f5f9" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Add</Text>
                )}
              </Pressable>
            </View>

            <Text style={styles.helper}>Top choice: {top ? top.name : 'No votes yet'}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070b14' },
  container: { padding: 18, gap: 16 },
  headerCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#0e1627',
    borderWidth: 1,
    borderColor: '#22304a',
  },
  title: { color: '#f8fafc', fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#cbd5e1', marginTop: 2, fontSize: 14 },
  buildLabel: { color: '#64748b', marginTop: 8, fontSize: 12, fontWeight: '600' },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  loadingText: { color: '#93c5fd', fontSize: 13 },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#22304a',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  inviteCode: { color: '#7dd3fc', fontSize: 14 },
  primaryButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#082f49', fontWeight: '800' },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#111827',
  },
  voteRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionActive: { borderColor: '#22c55e', backgroundColor: '#0b2b1c' },
  optionDisabled: { opacity: 0.65 },
  optionText: { color: '#f8fafc', fontWeight: '600' },
  optionVotes: { color: '#cbd5e1', fontSize: 13 },
  row: { flexDirection: 'row', gap: 8, marginTop: 2 },
  input: {
    flex: 1,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#26334f',
    color: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
    paddingHorizontal: 12,
  },
  secondaryButtonText: { color: '#f1f5f9', fontWeight: '700' },
  helper: { color: '#cbd5e1', fontSize: 13 },
});
