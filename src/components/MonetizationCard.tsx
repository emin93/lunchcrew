import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { trackEvent } from '../lib/analytics';
import { supabase } from '../lib/supabase';
import { ds } from './designSystem';

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
  const trackedViewRef = useRef(false);

  const canSubmit = useMemo(() => isValidEmail(email.trim()), [email]);

  useEffect(() => {
    if (trackedViewRef.current) return;
    trackedViewRef.current = true;
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
      if (error.code === '23505') {
        await trackEvent('waitlist_already_joined', { placement: 'app_card', workspace_id: workspaceId ?? null }, deviceId);
        setStatus('saved');
        setEmail('');
        setNote('');
        return;
      }

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
      <View style={styles.badge}><Text style={styles.badgeText}>Coming soon</Text></View>
      <Text style={styles.title}>LunchCrew Pro</Text>
      <Text style={styles.subtitle}>Priority picks, recurring lunch rules, and richer team insights. Join the waitlist for early access.</Text>

      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Work email"
          placeholderTextColor={ds.colors.textSoft}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={setNote}
          placeholder="What would make Pro worth paying for? (optional)"
          placeholderTextColor={ds.colors.textSoft}
          multiline
        />
      </View>

      <Pressable style={[styles.button, (!canSubmit || status === 'saving') && styles.buttonDisabled]} disabled={!canSubmit || status === 'saving'} onPress={() => void submit()}>
        {status === 'saving' ? <ActivityIndicator size="small" color="#10182f" /> : <Text style={styles.buttonText}>Join Pro waitlist</Text>}
      </Pressable>

      {email.trim().length > 0 && !canSubmit && <Text style={styles.helper}>Enter a valid email to join the waitlist.</Text>}
      {status === 'saved' && <Text style={styles.success}>Thanks — we’ll reach out before launch.</Text>}
      {status === 'error' && <Text style={styles.error}>Couldn’t save right now. Your interest was still noted.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: ds.radius.xl,
    padding: 16,
    backgroundColor: ds.colors.cardSoft,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: ds.colors.accentSoft,
    borderRadius: ds.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { color: ds.colors.text, fontSize: 11, fontWeight: '800' },
  title: { color: ds.colors.text, fontWeight: '900', fontSize: 18 },
  subtitle: { color: ds.colors.textMuted, fontSize: 13, lineHeight: 19 },
  inputWrap: { gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.input,
    color: ds.colors.text,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteInput: { minHeight: 64, textAlignVertical: 'top' },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: ds.colors.accent,
    borderRadius: ds.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#10182f', fontWeight: '900', fontSize: 13 },
  helper: { color: ds.colors.textSoft, fontSize: 12 },
  success: { color: ds.colors.teal, fontSize: 12, fontWeight: '700' },
  error: { color: ds.colors.danger, fontSize: 12, fontWeight: '700' },
});
