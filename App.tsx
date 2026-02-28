import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  View,
  Linking,
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
  const trimmed = (input || '').trim();
  if (!trimmed) return '';

  const upper = trimmed.toUpperCase();
  if (upper.startsWith('LC-')) return upper;

  const match = trimmed.match(/[?&]code=([^&#]+)/i);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]).toUpperCase();
    } catch {
      return match[1].toUpperCase();
    }
  }

  return '';
}

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  const isConfigured = useMemo(() => !!supabase, []);

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

    setWorkspace(data as Workspace);
  };

  const joinByDeepLink = async (url: string) => {
    if (!supabase) return;
    const code = extractInviteCode(url);
    if (!code) {
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
      Alert.alert('Join failed', 'Workspace not found for this invite link.');
      return;
    }

    setWorkspace(data as Workspace);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.title}>🍽️ LunchCrew</Text>
        <Text style={styles.subtitle}>Open app = instant workspace. Open invite link = instant join.</Text>

        {loading && <ActivityIndicator color="#93c5fd" />}

        {workspace ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Active workspace</Text>
            <Text style={styles.workspaceName}>{workspace.name}</Text>
            <Text style={styles.inviteCode}>Code: {workspace.invite_code}</Text>
            <Pressable style={styles.primaryButton} onPress={shareInvite}>
              <Text style={styles.primaryButtonText}>Share Invite Link</Text>
            </Pressable>
          </View>
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
});
