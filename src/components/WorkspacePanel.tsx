import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { initialsForName, MAX_DISPLAY_NAME_LENGTH, normalizeDisplayName } from '../lib/helpers';
import { Workspace } from '../types';

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
            style={styles.input}
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="Crew name"
            placeholderTextColor="#6a7a9f"
          />
          <Pressable style={[styles.actionBtn, renaming && styles.disabled]} onPress={() => onRename(nameDraft)} disabled={renaming}>
            {renaming ? <ActivityIndicator size="small" color="#eef3ff" /> : <Text style={styles.actionBtnText}>Save</Text>}
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
            placeholderTextColor="#6a7a9f"
            maxLength={MAX_DISPLAY_NAME_LENGTH}
          />
          <Pressable style={[styles.actionBtn, savingName && styles.disabled]} onPress={() => onSaveDisplayName(displayNameDraft)} disabled={savingName}>
            {savingName ? <ActivityIndicator size="small" color="#eef3ff" /> : <Text style={styles.actionBtnText}>Save</Text>}
          </Pressable>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Pressable style={[styles.secondaryBtn]} onPress={onShare}><Text style={styles.secondaryText}>Share invite</Text></Pressable>
        <Pressable style={[styles.secondaryBtn]} onPress={onCreateNewCrew}><Text style={styles.secondaryText}>+ New crew</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: '#0f1227',
    borderWidth: 1,
    borderColor: '#343d77',
    gap: 12,
  },
  title: { color: '#f8fafc', fontSize: 20, fontWeight: '900' },
  block: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3b4a7f',
    backgroundColor: '#151d3b',
    padding: 12,
    gap: 8,
  },
  blockTitle: { color: '#9db0db', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#46548a',
    borderRadius: 12,
    backgroundColor: '#1a254d',
    color: '#e8eeff',
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  flex: { flex: 1 },
  actionBtn: {
    borderRadius: 12,
    backgroundColor: '#2f4fe3',
    borderWidth: 1,
    borderColor: '#6b86ff',
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 64,
    alignItems: 'center',
  },
  actionBtnText: { color: '#eef3ff', fontWeight: '800', fontSize: 12 },
  disabled: { opacity: 0.7 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#2b3768',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#e8eeff', fontWeight: '900', fontSize: 11 },
  meta: { color: '#c5d2ef', fontSize: 12, fontWeight: '700' },
  footerRow: { flexDirection: 'row', gap: 8 },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4c5f9a',
    backgroundColor: '#1a254d',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  secondaryText: { color: '#d6e2ff', fontWeight: '800', fontSize: 12 },
});
