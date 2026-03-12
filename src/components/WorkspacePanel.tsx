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
        <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>Active crew</Text></View>
        <Text style={styles.title}>{workspace.name}</Text>
        <Text style={styles.subtitle}>Keep the crew recognizable, keep invites simple, and make sure everyone sees the right name when they vote.</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Invite code</Text>
          <Text style={styles.summaryValue}>{workspace.invite_code}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Workspace</Text>
          <Text style={styles.summaryValue} numberOfLines={1}>{workspace.name}</Text>
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Workspace identity</Text>
        <Text style={styles.blockCopy}>Rename the crew without affecting routing or app behavior.</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex]}
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="Crew name"
            placeholderTextColor={ds.colors.textSoft}
          />
          <Pressable style={[styles.actionBtn, renaming && styles.disabled]} onPress={() => onRename(nameDraft)} disabled={renaming}>
            {renaming ? <ActivityIndicator size="small" color="#10182f" /> : <Text style={styles.actionBtnText}>Save</Text>}
          </Pressable>
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Your profile</Text>
        <Text style={styles.blockCopy}>This is how you appear inside votes and crew activity.</Text>
        <View style={styles.profileRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initialsForName(displayNameDraft)}</Text></View>
          <View style={styles.profileFields}>
            <TextInput
              style={styles.input}
              value={displayNameDraft}
              onChangeText={(v) => setDisplayNameDraft(normalizeDisplayName(v))}
              placeholder="Your display name"
              placeholderTextColor={ds.colors.textSoft}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
            />
            <Text style={styles.meta}>{displayNameDraft.length}/{MAX_DISPLAY_NAME_LENGTH} characters</Text>
          </View>
          <Pressable style={[styles.actionBtn, savingName && styles.disabled]} onPress={() => onSaveDisplayName(displayNameDraft)} disabled={savingName}>
            {savingName ? <ActivityIndicator size="small" color="#10182f" /> : <Text style={styles.actionBtnText}>Save</Text>}
          </Pressable>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Pressable style={styles.secondaryBtn} onPress={onShare}><Text style={styles.secondaryText}>Share invite</Text></Pressable>
        <Pressable style={[styles.secondaryBtn, styles.secondaryBtnStrong]} onPress={onCreateNewCrew}><Text style={styles.secondaryTextStrong}>Create new crew</Text></Pressable>
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
    gap: 16,
    ...ds.shadow.card,
  },
  header: { gap: 8 },
  headerBadge: {
    alignSelf: 'flex-start',
    borderRadius: ds.radius.pill,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.tealSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  headerBadgeText: { color: ds.colors.text, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { color: ds.colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { color: ds.colors.textMuted, fontSize: 14, lineHeight: 21, maxWidth: 640 },
  summaryRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  summaryCard: {
    minWidth: 160,
    flexGrow: 1,
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: 'rgba(8, 13, 31, 0.52)',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 4,
  },
  summaryLabel: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  summaryValue: { color: ds.colors.text, fontSize: 16, fontWeight: '800' },
  block: {
    borderRadius: ds.radius.xl,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.cardMuted,
    padding: 16,
    gap: 10,
  },
  blockTitle: { color: ds.colors.text, fontSize: 18, fontWeight: '800' },
  blockCopy: { color: ds.colors.textSoft, fontSize: 13, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileFields: { flex: 1, gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.input,
    color: ds.colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  flex: { flex: 1 },
  actionBtn: {
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 13,
    minWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
    ...ds.shadow.glow,
  },
  actionBtnText: { color: '#10182f', fontWeight: '900', fontSize: 13 },
  disabled: { opacity: 0.7 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: ds.colors.accentSoft,
    borderWidth: 1,
    borderColor: ds.colors.accentSoftStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: ds.colors.text, fontWeight: '900', fontSize: 16 },
  meta: { color: ds.colors.textSoft, fontSize: 12, fontWeight: '700' },
  footerRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryBtnStrong: { backgroundColor: 'rgba(82, 230, 197, 0.1)', borderColor: 'rgba(82, 230, 197, 0.24)' },
  secondaryText: { color: ds.colors.text, fontWeight: '800', fontSize: 13 },
  secondaryTextStrong: { color: ds.colors.teal, fontWeight: '900', fontSize: 13 },
});
