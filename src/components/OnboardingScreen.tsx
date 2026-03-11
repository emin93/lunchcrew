import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initialsForName, MAX_DISPLAY_NAME_LENGTH, normalizeDisplayName } from '../lib/helpers';

type Props = {
  onSubmitName: (name: string) => void;
  onSkip: () => void;
  buildLabel: string;
};

export function OnboardingScreen({ onSubmitName, onSkip, buildLabel }: Props) {
  const [name, setName] = useState('');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.contentWrap}>
          <View style={styles.content}>
            <Text style={styles.kicker}>Welcome to LunchCrew</Text>
            <Text style={styles.title}>Let’s make lunch decisions easy.</Text>
            <Text style={styles.subtitle}>Add your name (optional) so teammates can see who voted. You can change this later.</Text>
            <Text style={styles.privacyNote}>
              After onboarding, we’ll ask for location access to improve nearby place suggestions. LunchCrew does not store your location.
            </Text>

            <View style={styles.inputRow}>
              <View style={styles.initialsBubble}>
                <Text style={styles.initialsText}>{initialsForName(name)}</Text>
              </View>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(v) => setName(normalizeDisplayName(v))}
                placeholder="Your display name (optional)"
                placeholderTextColor="#64748b"
                autoCapitalize="words"
                autoFocus={Platform.OS === 'web'}
                maxLength={MAX_DISPLAY_NAME_LENGTH}
                returnKeyType="done"
                onSubmitEditing={() => onSubmitName(normalizeDisplayName(name))}
              />
            </View>

            <Text style={styles.nameHint}>{name.length}/{MAX_DISPLAY_NAME_LENGTH}</Text>
            <Text style={styles.buildLabel}>{buildLabel}</Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.bottomInner}>
            <View style={styles.rowBetween}>
              <Pressable style={styles.skipBtn} onPress={onSkip}>
                <Text style={styles.skipText}>Skip for now</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={() => onSubmitName(normalizeDisplayName(name))}>
                <Text style={styles.primaryText}>Continue</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#040614' },
  screen: { flex: 1, justifyContent: 'space-between' },
  contentWrap: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  content: { width: '100%', maxWidth: 760, paddingHorizontal: 22, gap: 12 },
  kicker: { color: '#22d3ee', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: '#f8fafc', fontSize: 34, fontWeight: '800' },
  subtitle: { color: '#94a3b8', fontSize: 14 },
  privacyNote: { color: '#64748b', fontSize: 12, lineHeight: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  initialsBubble: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: { color: '#e2e8f0', fontWeight: '800', fontSize: 12 },
  input: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    color: '#f8fafc',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  nameHint: { color: '#64748b', fontSize: 11 },
  buildLabel: { color: '#475569', fontSize: 11, marginTop: 4, fontWeight: '600' },
  bottom: { paddingHorizontal: 20, paddingBottom: 20 },
  bottomInner: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  skipBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  skipText: { color: '#cbd5e1', fontWeight: '700', fontSize: 16 },
  primaryBtn: {
    minHeight: 48,
    minWidth: 152,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#22d3ee',
  },
  primaryText: { color: '#0f172a', fontWeight: '800', fontSize: 16 },
});
