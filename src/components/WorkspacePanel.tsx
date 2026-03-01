import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Workspace } from '../types';

type Props = {
  workspace: Workspace;
  onShare: () => void;
};

export function WorkspacePanel({ workspace, onShare }: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.panelLabel}>Crew</Text>
          <Text style={styles.workspaceTitle}>{workspace.name}</Text>
        </View>
        <Pressable style={styles.sharePill} onPress={onShare}>
          <Text style={styles.sharePillText}>Share invite</Text>
        </Pressable>
      </View>
      <Text style={styles.codeText}>Code: {workspace.invite_code}</Text>
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
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  panelLabel: { color: '#64748b', fontSize: 12 },
  workspaceTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 17 },
  sharePill: { backgroundColor: '#0e7490', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  sharePillText: { color: '#ecfeff', fontWeight: '700', fontSize: 12 },
  codeText: { color: '#67e8f9', fontSize: 13, fontWeight: '600' },
});
