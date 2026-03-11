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

  useEffect(() => setDisplayNameDraft(displayName), [displayName]);

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Crew control center</Text>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Workspace identity</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex]}
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="Crew name"
            placeholderTextColor={ds.colors.textSoft}
          />
          <Pressable style={[styles.actionBtn, renaming && styles.disabled]} onPress={() => onRename(nameDraft)} disabled={renaming}>
            {renaming ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.actionBtnText}>Save</Text>}
          </Pressable>
        </View>
        <Text style={styles.meta}>Invite code: {workspace.invite_code}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Profile</Text>
        <View style={styles.row}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initialsForName(displayNameDraft)}</Text></View>
          <TextInput
            style={[styles.input, styles.flex]}
            value={displayNameDraft}
            onChangeText={(v) => setDisplayNameDraft(normalizeDisplayName(v))}
            placeholder="Your display name"
            placeholderTextColor={ds.colors.textSoft}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
          />
          <Pressable style={[styles.actionBtn, savingName && styles.disabled]} onPress={() => onSaveDisplayName(displayNameDraft)} disabled={savingName}>
            {savingName ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.actionBtnText}>Save</Text>}
          </Pressable>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Pressable style={styles.secondaryBtn} onPress={onShare}><Text style={styles.secondaryText}>Share invite</Text></Pressable>
        <Pressable style={styles.secondaryBtn} onPress={onCreateNewCrew}><Text style={styles.secondaryText}>+ New crew</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: ds.radius.xl,
    padding: ds.spacing.lg,
    backgroundColor: ds.colors.card,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    gap: 12,
  },
  title: { color: ds.colors.text, fontSize: 22, fontWeight: '800' },
  block: {
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.cardMuted,
    padding: 12,
    gap: 8,
  },
  blockTitle: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    borderRadius: 12,
    backgroundColor: '#fffefb',
    color: ds.colors.text,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  flex: { flex: 1 },
  actionBtn: {
    borderRadius: 12,
    backgroundColor: ds.colors.accent,
    borderWidth: 1,
    borderColor: ds.colors.accentStrong,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 64,
    alignItems: 'center',
  },
  actionBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  disabled: { opacity: 0.7 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#d9d1bf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: ds.colors.text, fontWeight: '900', fontSize: 11 },
  meta: { color: ds.colors.textMuted, fontSize: 12, fontWeight: '700' },
  footerRow: { flexDirection: 'row', gap: 8 },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: '#fffefb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  secondaryText: { color: ds.colors.text, fontWeight: '700', fontSize: 12 },
});
