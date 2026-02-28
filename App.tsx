import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
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
import { createClient } from '@supabase/supabase-js';

type Workspace = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
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

function extractInviteCode(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('LC-')) return trimmed.toUpperCase();

  try {
    const url = new URL(trimmed);
    const code = url.searchParams.get('code');
    return (code || '').toUpperCase();
  } catch {
    return '';
  }
}

export default function App() {
  const [workspaceName, setWorkspaceName] = useState('');
  const [inviteLinkInput, setInviteLinkInput] = useState('');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(false);

  const isConfigured = useMemo(() => !!supabase, []);

  const joinByInviteLink = async (input: string) => {
    if (!isConfigured || !supabase) {
      Alert.alert(
        'Missing Supabase config',
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
      );
      return;
    }

    const code = extractInviteCode(input);
    if (!code) {
      Alert.alert('Invalid invite link', 'Please open a valid LunchCrew invite link.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('invite_code', code)
      .single();
    setLoading(false);

    if (error || !data) {
      Alert.alert('Workspace not found', 'This invite link is invalid or expired.');
      return;
    }

    setWorkspace(data as Workspace);
    Alert.alert('Joined!', `Welcome to ${data.name}.`);
  };

  useEffect(() => {
    const applyUrl = (url: string | null) => {
      if (!url) return;
      void joinByInviteLink(url);
    };

    Linking.getInitialURL().then(applyUrl);

    const sub = Linking.addEventListener('url', (event) => applyUrl(event.url));
    return () => sub.remove();
  }, []);

  const createWorkspace = async () => {
    if (!isConfigured || !supabase) {
      Alert.alert(
        'Missing Supabase config',
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
      );
      return;
    }

    setLoading(true);
    const inviteCode = generateInviteCode();
    const name = workspaceName.trim() || 'LunchCrew Workspace';

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name, invite_code: inviteCode })
      .select('*')
      .single();

    setLoading(false);

    if (error) {
      Alert.alert('Failed to create workspace', error.message);
      return;
    }

    setWorkspace(data as Workspace);
  };

  const shareInvite = async () => {
    if (!workspace) return;

    const link = `https://lunchcrew.app/join?code=${workspace.invite_code}`;

    await Share.share({
      message: `Join my LunchCrew workspace: ${link}`,
      title: 'LunchCrew Invite',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🍽️ LunchCrew</Text>
        <Text style={styles.subtitle}>Zero friction lunch planning for coworkers.</Text>

        {!isConfigured && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Supabase not configured</Text>
            <Text style={styles.warningText}>
              Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create workspace</Text>
          <TextInput
            style={styles.input}
            placeholder="Workspace name (optional)"
            placeholderTextColor="#8d98a8"
            value={workspaceName}
            onChangeText={setWorkspaceName}
          />
          <Pressable style={styles.primaryButton} onPress={createWorkspace}>
            <Text style={styles.primaryButtonText}>Create in 1 Tap</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Join from invite link</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste invite link"
            placeholderTextColor="#8d98a8"
            value={inviteLinkInput}
            onChangeText={setInviteLinkInput}
            autoCapitalize="none"
          />
          <Pressable
            style={[styles.secondaryButton, !inviteLinkInput.trim() && styles.buttonDisabled]}
            onPress={() => joinByInviteLink(inviteLinkInput)}
          >
            <Text style={styles.secondaryButtonText}>Join Workspace</Text>
          </Pressable>
        </View>

        {loading && <ActivityIndicator color="#93c5fd" />}

        {workspace && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Active workspace</Text>
            <Text style={styles.workspaceName}>{workspace.name}</Text>
            <Text style={styles.inviteCode}>Invite link ready</Text>
            <Pressable style={styles.primaryButton} onPress={shareInvite}>
              <Text style={styles.primaryButtonText}>Share Invite Link</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0b1220' },
  container: { padding: 18, gap: 16 },
  title: { color: '#f8fafc', fontSize: 34, fontWeight: '800' },
  subtitle: { color: '#cbd5e1', marginTop: -8, fontSize: 15 },
  warningCard: {
    backgroundColor: '#3a1f1f',
    borderColor: '#7f1d1d',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  warningTitle: { color: '#fecaca', fontWeight: '700' },
  warningText: { color: '#fca5a5', fontSize: 13 },
  card: {
    backgroundColor: '#111b2e',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#22304a',
    gap: 10,
  },
  cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#26334f',
    color: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#eff6ff', fontWeight: '700' },
  secondaryButton: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#f1f5f9', fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
  workspaceName: { color: '#f8fafc', fontWeight: '700', fontSize: 16 },
  inviteCode: { color: '#93c5fd', fontSize: 14 },
});
