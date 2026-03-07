import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { trackEvent } from '../lib/analytics';
import { supabase } from '../lib/supabase';

type Props = {
  workspaceId?: string;
  deviceId?: string;
};

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

export function MonetizationCard({ workspaceId, deviceId }: Props) {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const canSubmit = useMemo(() => isValidEmail(email.trim()), [email]);

  useEffect(() => {
    void trackEvent('pricing_viewed', { placement: 'app_card' }, deviceId);
  }, [deviceId]);

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanNote = note.trim();

    if (!isValidEmail(cleanEmail) || status === 'saving') return;

    setStatus('saving');
    await trackEvent('upgrade_cta_clicked', { placement: 'app_card', workspace_id: workspaceId ?? null }, deviceId);

    if (!supabase) {
      await trackEvent('waitlist_intent_recorded', { mode: 'analytics_only', placement: 'app_card' }, deviceId);
      setStatus('saved');
      return;
    }

    const { error } = await supabase.from('monetization_waitlist').insert({
      email: cleanEmail,
      note: cleanNote || null,
      workspace_id: workspaceId ?? null,
      source: 'app_card',
    });

    if (error) {
      await trackEvent('waitlist_submit_failed', { message: error.message, placement: 'app_card' }, deviceId);
      setStatus('error');
      return;
    }

    await trackEvent('waitlist_joined', { placement: 'app_card', workspace_id: workspaceId ?? null }, deviceId);
    setStatus('saved');
    setEmail('');
    setNote('');
  };

  return (
    <View style={styles.card}>
      <Text style={styles.badge}>Coming soon</Text>
      <Text style={styles.title}>LunchCrew Pro</Text>
      <Text style={styles.subtitle}>Priority picks, recurring lunch rules, and team insights. Join the waitlist for early access.</Text>

      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Work email"
          placeholderTextColor="#64748b"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={setNote}
          placeholder="What would make Pro worth paying for? (optional)"
          placeholderTextColor="#64748b"
          multiline
        />
      </View>

      <Pressable style={[styles.button, (!canSubmit || status === 'saving') && styles.buttonDisabled]} disabled={!canSubmit || status === 'saving'} onPress={() => void submit()}>
        {status === 'saving' ? <ActivityIndicator size="small" color="#ecfeff" /> : <Text style={styles.buttonText}>Join Pro waitlist</Text>}
      </Pressable>

      {status === 'saved' && <Text style={styles.success}>Thanks — we will reach out before launch.</Text>}
      {status === 'error' && <Text style={styles.error}>Couldn’t save right now. Your interest was still noted.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1f2937',
    color: '#67e8f9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  title: { color: '#f8fafc', fontWeight: '800', fontSize: 18 },
  subtitle: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
  inputWrap: { gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    backgroundColor: '#111827',
    color: '#f8fafc',
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  noteInput: { minHeight: 64, textAlignVertical: 'top' },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#0e7490',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ecfeff', fontWeight: '700', fontSize: 13 },
  success: { color: '#86efac', fontSize: 12, fontWeight: '600' },
  error: { color: '#fca5a5', fontSize: 12, fontWeight: '600' },
});
