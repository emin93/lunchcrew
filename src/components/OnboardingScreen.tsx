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
      <LinearGradient colors={[ds.colors.appBg, ds.colors.appBgAlt, '#06111d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.screen}>
        <View pointerEvents="none" style={styles.gridGlowOne} />
        <View pointerEvents="none" style={styles.gridGlowTwo} />

        <View style={styles.contentWrap}>
          <View style={styles.copyColumn}>
            <Text style={styles.kicker}>LunchCrew</Text>
            <Text style={styles.title}>Set up your lunch desk before the first decision hits the board.</Text>
            <Text style={styles.subtitle}>Give yourself a display name, then the app can turn the daily “where should we eat?” spiral into one clean vote.</Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}><Text style={styles.featureItemTitle}>Daily ballot</Text><Text style={styles.featureItemText}>Everyone votes in one place instead of arguing in chat.</Text></View>
              <View style={styles.featureItem}><Text style={styles.featureItemTitle}>Nearby suggestions</Text><Text style={styles.featureItemText}>Autocomplete gets smarter with location, but the location itself is never stored.</Text></View>
              <View style={styles.featureItem}><Text style={styles.featureItemTitle}>Crew archive</Text><Text style={styles.featureItemText}>Review winners and patterns after the team starts building history.</Text></View>
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formBadge}>Operator profile</Text>
              <Text style={styles.buildLabel}>{buildLabel}</Text>
            </View>

            <View style={styles.identityCard}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{initialsForName(name)}</Text></View>
              <View style={styles.identityCopy}>
                <Text style={styles.identityTitle}>{name || 'Anonymous voter'}</Text>
                <Text style={styles.identitySubtitle}>This is the label other people will see next to your vote.</Text>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Display name</Text>
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
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>Optional now, editable later from Crew.</Text>
                <Text style={styles.metaText}>{name.length}/{MAX_DISPLAY_NAME_LENGTH}</Text>
              </View>
            </View>

            <View style={styles.actionColumn}>
              <Pressable style={styles.primaryButton} onPress={() => onSubmitName(normalizeDisplayName(name))}>
                <Text style={styles.primaryButtonText}>Enter the app</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={onSkip}>
                <Text style={styles.secondaryButtonText}>Skip for now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ds.colors.appBg },
  screen: { flex: 1 },
  contentWrap: {
    flex: 1,
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 18,
  },
  copyColumn: {
    borderRadius: ds.radius.xxl,
    padding: ds.spacing.xl,
    backgroundColor: 'rgba(12, 25, 43, 0.5)',
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    gap: 14,
  },
  kicker: { color: ds.colors.accent, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { color: ds.colors.text, fontSize: 34, lineHeight: 40, fontWeight: '900', letterSpacing: -1.1 },
  subtitle: { color: ds.colors.textMuted, fontSize: 15, lineHeight: 22 },
  featureList: { gap: 10 },
  featureItem: {
    borderRadius: 20,
    padding: 14,
    backgroundColor: ds.colors.cardSoft,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    gap: 3,
  },
  featureItemTitle: { color: ds.colors.text, fontSize: 14, fontWeight: '900' },
  featureItemText: { color: ds.colors.textSoft, fontSize: 12, lineHeight: 18 },
  formCard: {
    borderRadius: ds.radius.xxl,
    padding: ds.spacing.xl,
    backgroundColor: ds.colors.card,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    gap: 16,
    ...ds.shadow.card,
  },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  formBadge: {
    color: ds.colors.text,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderRadius: ds.radius.pill,
    borderWidth: 1,
    borderColor: ds.colors.accentSoftStrong,
    backgroundColor: ds.colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  buildLabel: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '700' },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.panel,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: ds.colors.accentSoft,
    borderWidth: 1,
    borderColor: ds.colors.accentSoftStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: ds.colors.text, fontWeight: '900', fontSize: 18 },
  identityCopy: { flex: 1, gap: 2 },
  identityTitle: { color: ds.colors.text, fontSize: 17, fontWeight: '900' },
  identitySubtitle: { color: ds.colors.textSoft, fontSize: 12, lineHeight: 18 },
  fieldBlock: { gap: 8 },
  fieldLabel: { color: ds.colors.textMuted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.input,
    color: ds.colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  metaText: { color: ds.colors.textSoft, fontSize: 12 },
  actionColumn: { gap: 10 },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.accent,
    ...ds.shadow.glow,
  },
  primaryButtonText: { color: '#07111f', fontWeight: '900', fontSize: 15 },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.input,
  },
  secondaryButtonText: { color: ds.colors.textMuted, fontWeight: '800', fontSize: 14 },
  gridGlowOne: {
    position: 'absolute',
    top: -120,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(122, 227, 195, 0.14)',
  },
  gridGlowTwo: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: 'rgba(246, 212, 122, 0.12)',
  },
});
