import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { initialsForName, MAX_DISPLAY_NAME_LENGTH, normalizeDisplayName } from '../lib/helpers';
import { Workspace } from '../types';
import { ds } from './designSystem';

type Props = {
  workspace: Workspace;
  displayName: string;
  onSaveDisplayName: (name: string) => void;
  savingName: boolean;
  onShare: () => void;
  onRename: (name: string) => void;
  onCreateNewCrew: () => void;
  renaming: boolean;
};

export function WorkspacePanel({
  workspace,
  displayName,
  onSaveDisplayName,
  savingName,
  onShare,
  onRename,
  onCreateNewCrew,
  renaming,
}: Props) {
  const [nameDraft, setNameDraft] = useState(workspace.name);
  const [displayNameDraft, setDisplayNameDraft] = useState(displayName);

  useEffect(() => setNameDraft(workspace.name), [workspace.name]);
  useEffect(() => setDisplayNameDraft(displayName), [displayName]);

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Crew control</Text>
        <Text style={styles.title}>{workspace.name}</Text>
        <Text style={styles.subtitle}>Treat this as the operating room: invite access, crew naming, and the profile everyone sees when votes start moving.</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, styles.summaryCardAccent]}>
          <Text style={styles.summaryLabel}>Invite code</Text>
          <Text style={styles.summaryValue}>{workspace.invite_code}</Text>
          <Text style={styles.summaryText}>Best for dropping a crew invite into chat without friction.</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Workspace</Text>
          <Text style={styles.summaryValue} numberOfLines={2}>{workspace.name}</Text>
          <Text style={styles.summaryText}>Renaming keeps the same data and routing, just a better label.</Text>
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Rename the crew</Text>
          <Text style={styles.blockCopy}>Update the crew’s public identity everywhere in the app.</Text>
        </View>
        <View style={styles.inlineRow}>
          <TextInput
            style={[styles.input, styles.flex]}
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="Crew name"
            placeholderTextColor={ds.colors.textSoft}
          />
          <Pressable style={[styles.primaryButton, renaming && styles.disabled]} onPress={() => onRename(nameDraft)} disabled={renaming}>
            {renaming ? <ActivityIndicator size="small" color="#07111f" /> : <Text style={styles.primaryButtonText}>Save</Text>}
          </Pressable>
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Your on-board identity</Text>
          <Text style={styles.blockCopy}>This is the name everyone sees attached to your votes.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initialsForName(displayNameDraft)}</Text></View>
            <View style={styles.avatarCopy}>
              <Text style={styles.avatarName}>{displayNameDraft || 'Anonymous voter'}</Text>
              <Text style={styles.avatarMeta}>Visible throughout the ballot and crew activity.</Text>
            </View>
          </View>

          <TextInput
            style={styles.input}
            value={displayNameDraft}
            onChangeText={(v) => setDisplayNameDraft(normalizeDisplayName(v))}
            placeholder="Your display name"
            placeholderTextColor={ds.colors.textSoft}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
          />

          <View style={styles.profileFooter}>
            <Text style={styles.counter}>{displayNameDraft.length}/{MAX_DISPLAY_NAME_LENGTH} characters</Text>
            <Pressable style={[styles.primaryButton, savingName && styles.disabled]} onPress={() => onSaveDisplayName(displayNameDraft)} disabled={savingName}>
              {savingName ? <ActivityIndicator size="small" color="#07111f" /> : <Text style={styles.primaryButtonText}>Update profile</Text>}
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.actionStrip}>
        <Pressable style={styles.secondaryButton} onPress={onShare}>
          <Text style={styles.secondaryButtonText}>Share invite</Text>
        </Pressable>
        <Pressable style={[styles.secondaryButton, styles.secondaryButtonAccent]} onPress={onCreateNewCrew}>
          <Text style={styles.secondaryButtonTextAccent}>Create new crew</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: ds.radius.xxl,
    padding: ds.spacing.xl,
    backgroundColor: ds.colors.card,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    gap: 20,
    ...ds.shadow.card,
  },
  header: { gap: 8 },
  eyebrow: { color: ds.colors.accent, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  title: { color: ds.colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: ds.colors.textMuted, fontSize: 14, lineHeight: 21, maxWidth: 720 },
  summaryGrid: { gap: 10 },
  summaryCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.cardMuted,
    padding: 16,
    gap: 5,
  },
  summaryCardAccent: { borderColor: ds.colors.accentSoftStrong, backgroundColor: ds.colors.accentSoft },
  summaryLabel: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  summaryValue: { color: ds.colors.text, fontSize: 22, lineHeight: 28, fontWeight: '900' },
  summaryText: { color: ds.colors.textMuted, fontSize: 12, lineHeight: 18 },
  block: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.panel,
    padding: 18,
    gap: 12,
  },
  blockHeader: { gap: 4 },
  blockTitle: { color: ds.colors.text, fontSize: 20, fontWeight: '900' },
  blockCopy: { color: ds.colors.textSoft, fontSize: 13, lineHeight: 19 },
  inlineRow: { gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    borderRadius: 18,
    backgroundColor: ds.colors.input,
    color: ds.colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  flex: { flex: 1 },
  profileCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.cardSoft,
    padding: 14,
    gap: 12,
  },
  avatarWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: ds.colors.accentSoft,
    borderWidth: 1,
    borderColor: ds.colors.accentSoftStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: ds.colors.text, fontWeight: '900', fontSize: 16 },
  avatarCopy: { flex: 1, gap: 2 },
  avatarName: { color: ds.colors.text, fontSize: 16, fontWeight: '900' },
  avatarMeta: { color: ds.colors.textSoft, fontSize: 12, lineHeight: 18 },
  profileFooter: { gap: 10 },
  counter: { color: ds.colors.textSoft, fontSize: 12, fontWeight: '700' },
  primaryButton: {
    minWidth: 100,
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: ds.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    ...ds.shadow.glow,
  },
  primaryButtonText: { color: '#07111f', fontWeight: '900', fontSize: 13 },
  disabled: { opacity: 0.7 },
  actionStrip: { gap: 10 },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonAccent: { backgroundColor: ds.colors.goldSoft, borderColor: 'rgba(246, 212, 122, 0.26)' },
  secondaryButtonText: { color: ds.colors.text, fontWeight: '800', fontSize: 13 },
  secondaryButtonTextAccent: { color: ds.colors.text, fontWeight: '900', fontSize: 13 },
});
