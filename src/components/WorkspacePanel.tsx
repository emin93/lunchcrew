import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Workspace } from '../types';

type Props = {
  workspace: Workspace;
  onShare: () => void;
  onRename: (name: string) => void;
  onCreateNewCrew: () => void;
  renaming: boolean;
};

export function WorkspacePanel({ workspace, onShare, onRename, onCreateNewCrew, renaming }: Props) {
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(workspace.name);

  return (
    <View style={styles.panel}>
      <View style={styles.rowBetween}>
        <View style={styles.titleWrap}>
          <Text style={styles.panelLabel}>Crew</Text>
          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.nameInput}
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="Crew name"
                placeholderTextColor="#64748b"
                autoFocus
                onSubmitEditing={() => {
                  onRename(nameDraft);
                  setEditing(false);
                }}
                onKeyPress={(e) => {
                  if (e.nativeEvent.key === 'Escape') {
                    setNameDraft(workspace.name);
                    setEditing(false);
                  }
                }}
              />
              <Pressable
                style={[styles.smallBtn, renaming && styles.btnDisabled]}
                onPress={() => {
                  onRename(nameDraft);
                  setEditing(false);
                }}
                disabled={renaming}
              >
                {renaming ? <ActivityIndicator size="small" color="#ecfeff" /> : <Text style={styles.smallBtnText}>Save</Text>}
              </Pressable>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => {
                  setNameDraft(workspace.name);
                  setEditing(false);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => { setNameDraft(workspace.name); setEditing(true); }}>
              <Text style={styles.workspaceTitle}>{workspace.name} ✏️</Text>
            </Pressable>
          )}
        </View>

        <Pressable style={styles.sharePill} onPress={onShare}>
          <Text style={styles.sharePillText}>Share invite</Text>
        </Pressable>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.codeText}>Code: {workspace.invite_code}</Text>
        <Pressable onPress={onCreateNewCrew}>
          <Text style={styles.linkText}>+ New crew</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  titleWrap: { flex: 1, gap: 6 },
  panelLabel: { color: '#64748b', fontSize: 12 },
  workspaceTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 17 },
  editRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    backgroundColor: '#111827',
    color: '#f8fafc',
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 140,
  },
  smallBtn: {
    backgroundColor: '#0e7490',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 58,
    alignItems: 'center',
  },
  smallBtnText: { color: '#ecfeff', fontWeight: '700', fontSize: 12 },
  cancelBtn: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelBtnText: { color: '#cbd5e1', fontWeight: '700', fontSize: 12 },
  btnDisabled: { opacity: 0.7 },
  sharePill: { backgroundColor: '#0e7490', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  sharePillText: { color: '#ecfeff', fontWeight: '700', fontSize: 12 },
  codeText: { color: '#67e8f9', fontSize: 13, fontWeight: '600' },
  linkText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
});
