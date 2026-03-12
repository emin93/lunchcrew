import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initialsForName, MAX_DISPLAY_NAME_LENGTH, normalizeDisplayName } from '../lib/helpers';
import { ds } from './designSystem';

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
      <LinearGradient colors={[ds.colors.appBg, ds.colors.appBgAlt, '#050816']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.screen}>
        <View pointerEvents="none" style={styles.orbOne} />
        <View pointerEvents="none" style={styles.orbTwo} />

        <View style={styles.contentWrap}>
          <View style={styles.contentCard}>
            <View style={styles.headerRow}>
              <View style={styles.badge}><Text style={styles.badgeText}>Welcome to LunchCrew</Text></View>
              <Text style={styles.buildLabel}>{buildLabel}</Text>
            </View>

            <Text style={styles.title}>Get the crew from “where should we eat?” to a decision in minutes.</Text>
            <Text style={styles.subtitle}>Start with a display name so everyone can see who voted. You can skip it now and update it later from the Crew tab.</Text>

            <View style={styles.featureRow}>
              <View style={styles.featurePill}><Text style={styles.featurePillText}>Daily vote board</Text></View>
              <View style={styles.featurePill}><Text style={styles.featurePillText}>Nearby place suggestions</Text></View>
              <View style={styles.featurePill}><Text style={styles.featurePillText}>No location stored</Text></View>
            </View>

            <View style={styles.inputShell}>
              <View style={styles.initialsBubble}>
                <Text style={styles.initialsText}>{initialsForName(name)}</Text>
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Display name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(v) => setName(normalizeDisplayName(v))}
                  placeholder="Your display name (optional)"
                  placeholderTextColor={ds.colors.textSoft}
                  autoCapitalize="words"
                  autoFocus={Platform.OS === 'web'}
                  maxLength={MAX_DISPLAY_NAME_LENGTH}
                  returnKeyType="done"
                  onSubmitEditing={() => onSubmitName(normalizeDisplayName(name))}
                />
                <View style={styles.inputMetaRow}>
                  <Text style={styles.privacyNote}>We only use location to improve nearby autocomplete. It isn’t stored.</Text>
                  <Text style={styles.nameHint}>{name.length}/{MAX_DISPLAY_NAME_LENGTH}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.bottomInner}>
            <Pressable style={styles.skipBtn} onPress={onSkip}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => onSubmitName(normalizeDisplayName(name))}>
              <Text style={styles.primaryText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ds.colors.appBg },
  screen: { flex: 1, justifyContent: 'space-between' },
  contentWrap: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 28 },
  contentCard: {
    width: '100%',
    maxWidth: 760,
    borderRadius: ds.radius.xxl,
    padding: ds.spacing.xxl,
    gap: 18,
    backgroundColor: 'rgba(12, 18, 40, 0.84)',
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    ...ds.shadow.card,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  badge: {
    borderRadius: ds.radius.pill,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: { color: ds.colors.text, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  buildLabel: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '700' },
  title: { color: ds.colors.text, fontSize: 36, lineHeight: 42, fontWeight: '900', letterSpacing: -1.2, maxWidth: 640 },
  subtitle: { color: ds.colors.textMuted, fontSize: 15, lineHeight: 23, maxWidth: 620 },
  featureRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  featurePill: {
    borderRadius: ds.radius.pill,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  featurePillText: { color: ds.colors.textMuted, fontSize: 12, fontWeight: '700' },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: ds.radius.xl,
    backgroundColor: 'rgba(7, 12, 28, 0.56)',
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    padding: 16,
  },
  initialsBubble: {
    width: 56,
    height: 56,
    borderRadius: 56,
    backgroundColor: ds.colors.accentSoft,
    borderWidth: 1,
    borderColor: ds.colors.accentSoftStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: { color: ds.colors.text, fontWeight: '900', fontSize: 18 },
  inputWrap: { flex: 1, gap: 8 },
  inputLabel: { color: ds.colors.textMuted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.input,
    color: ds.colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  privacyNote: { color: ds.colors.textSoft, fontSize: 12, lineHeight: 18, flex: 1 },
  nameHint: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '700' },
  bottom: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 4 },
  bottomInner: { width: '100%', maxWidth: 760, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  skipBtn: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: ds.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: 'rgba(12, 18, 40, 0.72)',
  },
  skipText: { color: ds.colors.textMuted, fontWeight: '800', fontSize: 15 },
  primaryBtn: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: ds.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ds.colors.accent,
    ...ds.shadow.glow,
  },
  primaryText: { color: '#10182f', fontWeight: '900', fontSize: 16 },
  orbOne: {
    position: 'absolute',
    top: -80,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: 'rgba(124, 156, 255, 0.16)',
  },
  orbTwo: {
    position: 'absolute',
    bottom: 110,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: 'rgba(82, 230, 197, 0.1)',
  },
});
