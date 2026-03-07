import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { trackEvent } from '../lib/analytics';
import { supabase } from '../lib/supabase';

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
          <Text style={styles.badge}>LunchCrew Pro • Coming soon</Text>
          <Text style={styles.title}>Want smarter lunch planning for your team?</Text>
          <Text style={styles.subtitle}>
            Join the early access waitlist for advanced team insights, recurring rules, and admin controls.
          </Text>

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

          <View style={styles.actions}>
            <Pressable style={styles.ghostBtn} onPress={onClose}>
              <Text style={styles.ghostBtnText}>Not now</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryBtn, (!canSubmit || status === 'saving') && styles.buttonDisabled]}
              disabled={!canSubmit || status === 'saving'}
              onPress={() => void submit()}
            >
              {status === 'saving' ? <ActivityIndicator size="small" color="#ecfeff" /> : <Text style={styles.primaryBtnText}>Join waitlist</Text>}
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
    backgroundColor: 'rgba(3,7,18,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 18,
    padding: 16,
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
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  ghostBtn: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  ghostBtnText: { color: '#cbd5e1', fontWeight: '700', fontSize: 13 },
  primaryBtn: {
    backgroundColor: '#0e7490',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 126,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#ecfeff', fontWeight: '700', fontSize: 13 },
  buttonDisabled: { opacity: 0.6 },
  helper: { color: '#94a3b8', fontSize: 12 },
  error: { color: '#fca5a5', fontSize: 12, fontWeight: '600' },
});
