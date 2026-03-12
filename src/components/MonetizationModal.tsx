import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { trackEvent } from '../lib/analytics';
import { supabase } from '../lib/supabase';
import { ds } from './designSystem';

type Props = {
  visible: boolean;
  workspaceId?: string;
  deviceId?: string;
  onClose: () => void;
  onJoined: () => void;
};

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

export function MonetizationModal({ visible, workspaceId, deviceId, onClose, onJoined }: Props) {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const trackedViewRef = useRef(false);

  const canSubmit = useMemo(() => isValidEmail(email.trim()), [email]);

  useEffect(() => {
    if (!visible) return;
    if (trackedViewRef.current) return;
    trackedViewRef.current = true;
    void trackEvent('pricing_viewed', { placement: 'return_modal' }, deviceId);
  }, [visible, deviceId]);

  useEffect(() => {
    if (!visible) {
      setEmail('');
      setNote('');
      setStatus('idle');
      trackedViewRef.current = false;
    }
  }, [visible]);

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanNote = note.trim();

    if (!isValidEmail(cleanEmail) || status === 'saving') return;

    setStatus('saving');
    await trackEvent('upgrade_cta_clicked', { placement: 'return_modal', workspace_id: workspaceId ?? null }, deviceId);

    if (!supabase) {
      await trackEvent('waitlist_intent_recorded', { mode: 'analytics_only', placement: 'return_modal' }, deviceId);
      setStatus('saved');
      onJoined();
      return;
    }

    const { error } = await supabase.from('monetization_waitlist').insert({
      email: cleanEmail,
      note: cleanNote || null,
      workspace_id: workspaceId ?? null,
      source: 'return_modal',
    });

    if (error) {
      if (error.code === '23505') {
        await trackEvent('waitlist_already_joined', { placement: 'return_modal', workspace_id: workspaceId ?? null }, deviceId);
        setStatus('saved');
        onJoined();
        return;
      }

      await trackEvent('waitlist_submit_failed', { message: error.message, placement: 'return_modal' }, deviceId);
      setStatus('error');
      return;
    }

    await trackEvent('waitlist_joined', { placement: 'return_modal', workspace_id: workspaceId ?? null }, deviceId);
    setStatus('saved');
    onJoined();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <View style={styles.badge}><Text style={styles.badgeText}>LunchCrew Pro • Coming soon</Text></View>
          <Text style={styles.title}>Want smarter lunch planning for your team?</Text>
          <Text style={styles.subtitle}>Join the early access waitlist for advanced insights, recurring rules, and admin controls.</Text>

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

          <View style={styles.actions}>
            <Pressable style={styles.ghostBtn} onPress={onClose}>
              <Text style={styles.ghostBtnText}>Not now</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, (!canSubmit || status === 'saving') && styles.buttonDisabled]}
              disabled={!canSubmit || status === 'saving'}
              onPress={() => void submit()}
            >
              {status === 'saving' ? <ActivityIndicator size="small" color="#10182f" /> : <Text style={styles.primaryBtnText}>Join waitlist</Text>}
            </Pressable>
          </View>

          {email.trim().length > 0 && !canSubmit && <Text style={styles.helper}>Enter a valid email to join the waitlist.</Text>}
          {status === 'error' && <Text style={styles.error}>Couldn’t save right now. Please try again.</Text>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: ds.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: ds.radius.xxl,
    padding: 18,
    backgroundColor: ds.colors.card,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    gap: 12,
    ...ds.shadow.card,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: ds.colors.accentSoft,
    borderRadius: ds.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { color: ds.colors.text, fontSize: 11, fontWeight: '800' },
  title: { color: ds.colors.text, fontWeight: '900', fontSize: 22, lineHeight: 28 },
  subtitle: { color: ds.colors.textMuted, fontSize: 13, lineHeight: 20 },
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
  noteInput: { minHeight: 70, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  ghostBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    borderRadius: ds.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: ds.colors.input,
  },
  ghostBtnText: { color: ds.colors.textMuted, fontWeight: '800', fontSize: 13 },
  primaryBtn: {
    flex: 1,
    backgroundColor: ds.colors.accent,
    borderRadius: ds.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minWidth: 126,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#10182f', fontWeight: '900', fontSize: 13 },
  buttonDisabled: { opacity: 0.6 },
  helper: { color: ds.colors.textSoft, fontSize: 12 },
  error: { color: ds.colors.danger, fontSize: 12, fontWeight: '700' },
});
