import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

type Workspace = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

type Poll = {
  id: string;
  workspace_id: string;
  poll_date: string;
  title: string;
};

type PollOption = {
  id: string;
  poll_id: string;
  name: string;
  votes: number;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

function generateInviteCode() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LC-${part()}-${part()}`;
}

function generateToken() {
  return `v_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
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

    const code = url.searchParams.get('code');
    return (code || '').toUpperCase();
  } catch {
    return '';
  }
}

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [newOption, setNewOption] = useState('');
  const [myVoteOptionId, setMyVoteOptionId] = useState<string | null>(null);
  const [voterToken, setVoterToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  const isConfigured = useMemo(() => !!supabase, []);

  const ensureVoterToken = async () => {
    const key = 'lunchcrew_voter_token';
    const existing = await AsyncStorage.getItem(key);
    if (existing) {
      setVoterToken(existing);
      return existing;
    }
    const created = generateToken();
    await AsyncStorage.setItem(key, created);
    setVoterToken(created);
    return created;
  };

  const refreshPollState = async (pollId: string, token: string) => {
    if (!supabase) return;

    const { data: rawOptions, error: optionsError } = await supabase
      .from('poll_options')
      .select('id,poll_id,name')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: true });

    if (optionsError) {
      Alert.alert('Failed to load options', optionsError.message);
      return;
    }

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('option_id,voter_token')
      .eq('poll_id', pollId);

    if (votesError) {
      Alert.alert('Failed to load votes', votesError.message);
      return;
    }

    const countByOption = new Map<string, number>();
    let myVote: string | null = null;

    (votes || []).forEach((vote: { option_id: string; voter_token: string }) => {
      countByOption.set(vote.option_id, (countByOption.get(vote.option_id) || 0) + 1);
      if (vote.voter_token === token) myVote = vote.option_id;
    });

    const withVotes: PollOption[] = (rawOptions || []).map((o: { id: string; poll_id: string; name: string }) => ({
      ...o,
      votes: countByOption.get(o.id) || 0,
    }));

    setOptions(withVotes);
    setMyVoteOptionId(myVote);
  };

  const ensureTodayPoll = async (workspaceId: string, token: string) => {
    if (!supabase) return;

    const date = todayKey();

    const { data: existing, error: pollGetError } = await supabase
      .from('polls')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('poll_date', date)
      .maybeSingle();

    if (pollGetError) {
      Alert.alert('Poll error', pollGetError.message);
      return;
    }

    let activePoll = existing as Poll | null;

    if (!activePoll) {
      const { data: created, error: createError } = await supabase
        .from('polls')
        .insert({ workspace_id: workspaceId, poll_date: date, title: "Today's Lunch" })
        .select('*')
        .single();

      if (createError || !created) {
        Alert.alert('Create poll failed', createError?.message ?? 'Unknown error');
        return;
      }

      activePoll = created as Poll;

      await supabase.from('poll_options').insert([
        { poll_id: activePoll.id, name: 'Taco spot' },
        { poll_id: activePoll.id, name: 'Sushi' },
        { poll_id: activePoll.id, name: 'Burgers' },
      ]);
    }

    setPoll(activePoll);
    await refreshPollState(activePoll.id, token);
  };

  const afterWorkspaceReady = async (ws: Workspace) => {
    setWorkspace(ws);
    const token = await ensureVoterToken();
    await ensureTodayPoll(ws.id, token);
  };

  const createWorkspace = async () => {
    if (!supabase) return;

    setLoading(true);
    const inviteCode = generateInviteCode();

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name: 'LunchCrew Workspace', invite_code: inviteCode })
      .select('*')
      .single();

    setLoading(false);

    if (error || !data) {
      Alert.alert('Could not create workspace', error?.message ?? 'Unknown error');
      return;
    }

    await afterWorkspaceReady(data as Workspace);
  };

  const joinByDeepLink = async (url: string) => {
    if (!supabase) return;
    const code = extractInviteCode(url);
    if (!code) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('invite_code', code)
      .single();
    setLoading(false);

    if (error || !data) {
      Alert.alert('Join failed', 'Workspace not found for this invite link.');
      return;
    }

    await afterWorkspaceReady(data as Workspace);
  };

  const addOption = async () => {
    if (!supabase || !poll || !newOption.trim()) return;

    const label = newOption.trim();
    setNewOption('');

    const { error } = await supabase.from('poll_options').insert({ poll_id: poll.id, name: label });
    if (error) {
      Alert.alert('Could not add option', error.message);
      return;
    }

    await refreshPollState(poll.id, voterToken);
  };

  const vote = async (optionId: string) => {
    if (!supabase || !poll || !voterToken) return;

    setLoading(true);

    await supabase
      .from('votes')
      .delete()
      .eq('poll_id', poll.id)
      .eq('voter_token', voterToken);

    const { error } = await supabase
      .from('votes')
      .insert({ poll_id: poll.id, option_id: optionId, voter_token: voterToken });

    setLoading(false);

    if (error) {
      Alert.alert('Vote failed', error.message);
      return;
    }

    await refreshPollState(poll.id, voterToken);
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!isConfigured || !supabase) {
      Alert.alert(
        'Supabase missing',
        'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env',
      );
      return;
    }

    const bootstrap = async () => {
      const initialUrl = await Linking.getInitialURL();
      const initialCode = extractInviteCode(initialUrl || '');

      if (initialUrl && initialCode) {
        await joinByDeepLink(initialUrl);
      } else {
        await createWorkspace();
      }
    };

    void bootstrap();

    const sub = Linking.addEventListener('url', (event) => {
      if (extractInviteCode(event.url)) {
        void joinByDeepLink(event.url);
      }
    });

    return () => sub.remove();
  }, [isConfigured]);

  const shareInvite = async () => {
    if (!workspace) return;

    const link = `https://lunchcrew.app/join?code=${workspace.invite_code}`;
    await Share.share({
      title: 'LunchCrew Invite',
      message: `Join my LunchCrew workspace: ${link}`,
    });
  };

  const winner = options.length
    ? [...options].sort((a, b) => b.votes - a.votes)[0]
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.title}>🍽️ LunchCrew</Text>
        <Text style={styles.subtitle}>Open app = workspace + today's voting.</Text>

        {loading && <ActivityIndicator color="#93c5fd" />}

        {workspace ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Workspace</Text>
              <Text style={styles.workspaceName}>{workspace.name}</Text>
              <Text style={styles.inviteCode}>Code: {workspace.invite_code}</Text>
              <Pressable style={styles.primaryButton} onPress={shareInvite}>
                <Text style={styles.primaryButtonText}>Share Invite Link</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Today&apos;s Lunch Vote</Text>

              {options.map((option) => (
                <Pressable
                  key={option.id}
                  style={[styles.optionRow, myVoteOptionId === option.id && styles.optionRowActive]}
                  onPress={() => vote(option.id)}
                >
                  <Text style={styles.optionText}>{option.name}</Text>
                  <Text style={styles.voteText}>{option.votes} votes</Text>
                </Pressable>
              ))}

              <View style={styles.addRow}>
                <TextInput
                  value={newOption}
                  onChangeText={setNewOption}
                  placeholder="Add place"
                  placeholderTextColor="#8d98a8"
                  style={styles.input}
                />
                <Pressable style={styles.addButton} onPress={addOption}>
                  <Text style={styles.primaryButtonText}>Add</Text>
                </Pressable>
              </View>

              <Text style={styles.helper}>
                Current lead: {winner ? `${winner.name} (${winner.votes})` : 'No options yet'}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.helper}>Setting things up…</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0b1220' },
  container: { flex: 1, padding: 18, gap: 16 },
  title: { color: '#f8fafc', fontSize: 34, fontWeight: '800' },
  subtitle: { color: '#cbd5e1', marginTop: -8, fontSize: 15 },
  card: {
    backgroundColor: '#111b2e',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#22304a',
    gap: 10,
    marginTop: 8,
  },
  cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  workspaceName: { color: '#f8fafc', fontWeight: '700', fontSize: 16 },
  inviteCode: { color: '#93c5fd', fontSize: 14 },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#eff6ff', fontWeight: '700' },
  helper: { color: '#cbd5e1' },
  optionRow: {
    backgroundColor: '#0f172a',
    borderColor: '#2c3b59',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionRowActive: {
    borderColor: '#60a5fa',
    backgroundColor: '#13213b',
  },
  optionText: { color: '#e2e8f0', fontWeight: '600' },
  voteText: { color: '#cbd5e1' },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderColor: '#2c3b59',
    borderWidth: 1,
    borderRadius: 12,
    color: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
});
