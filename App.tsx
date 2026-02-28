import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function App() {
  const [workspaceName, setWorkspaceName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(false);

  const isConfigured = useMemo(() => !!supabase, []);
  const canJoin = !loading && joinCode.trim().length > 0;

  const createWorkspace = async () => {
    if (!isConfigured || !supabase) {
      Alert.alert('Missing Supabase config', 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }
    if (!workspaceName.trim()) {
      Alert.alert('Name required', 'Please enter a workspace name.');
      return;
    }

    setLoading(true);
    const inviteCode = generateInviteCode();

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name: workspaceName.trim(), invite_code: inviteCode })
      .select('*')
      .single();

    setLoading(false);

    if (error) {
      Alert.alert('Failed to create workspace', error.message);
      return;
    }

    setWorkspace(data as Workspace);
    setJoinCode((data as Workspace).invite_code);
  };

  const joinWorkspace = async () => {
    if (!isConfigured || !supabase) {
      Alert.alert('Missing Supabase config', 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }
    if (!joinCode.trim()) {
      Alert.alert('Invite code required', 'Paste an invite code to join.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('invite_code', joinCode.trim().toUpperCase())
      .single();
    setLoading(false);

    if (error) {
      Alert.alert('Workspace not found', 'Invalid invite code.');
      return;
    }

    setWorkspace(data as Workspace);
  };

  const shareInvite = async () => {
    if (!workspace) return;

    const deepLink = `lunchcrew://join?code=${workspace.invite_code}`;
    const fallback = `Join my LunchCrew workspace "${workspace.name}" with code: ${workspace.invite_code}`;

    await Share.share({
      message: `${fallback}\n\nOpen in app: ${deepLink}`,
      title: 'LunchCrew invite',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🍽️ LunchCrew</Text>
        <Text style={styles.subtitle}>Create a workspace, share invite code, join instantly.</Text>

        {!isConfigured && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Supabase not configured</Text>
            <Text style={styles.warningText}>
              Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to run real workspace/invite flow.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create workspace</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Acme Berlin Office"
            placeholderTextColor="#8d98a8"
            value={workspaceName}
            onChangeText={setWorkspaceName}
          />
          <Pressable style={styles.primaryButton} onPress={createWorkspace}>
            <Text style={styles.primaryButtonText}>Create + Generate Invite</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Join workspace</Text>
          <TextInput
            style={styles.input}
            placeholder="Invite code (LC-XXXX-XXXX)"
            placeholderTextColor="#8d98a8"
            value={joinCode}
            onChangeText={(v) => setJoinCode(v.toUpperCase())}
            autoCapitalize="characters"
          />
          <Pressable
            style={[styles.secondaryButton, !canJoin && styles.buttonDisabled]}
            onPress={joinWorkspace}
          >
            <Text style={styles.secondaryButtonText}>{canJoin ? 'Join by Code' : 'Enter code to join'}</Text>
          </Pressable>
        </View>

        {loading && <ActivityIndicator color="#93c5fd" />}

        {workspace && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Active workspace</Text>
            <Text style={styles.workspaceName}>{workspace.name}</Text>
            <Text style={styles.inviteCode}>Invite code: {workspace.invite_code}</Text>
            <Pressable style={styles.primaryButton} onPress={shareInvite}>
              <Text style={styles.primaryButtonText}>Share Invite</Text>
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
