import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WorkspacePanel } from '../../src/components/WorkspacePanel';
import { useAppStateContext } from '../../src/state/AppStateContext';

export default function CrewScreen() {
  const state = useAppStateContext();

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      alwaysBounceVertical={false}
      bounces={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
    >
      <View style={styles.maxWidthWrap}>
        <View style={styles.header}>
          <Text style={styles.title}>Crew</Text>
          <Text style={styles.subtitle}>Manage crew identity, invites, and profile details.</Text>
        </View>

        {state.workspace ? (
          <WorkspacePanel
            workspace={state.workspace}
            displayName={state.member?.display_name || ''}
            onSaveDisplayName={(name) => void state.saveDisplayName(name)}
            savingName={state.savingName}
            onShare={state.shareInvite}
            onRename={state.renameCrew}
            onCreateNewCrew={() => void state.createNewCrew()}
            renaming={state.renaming}
          />
        ) : (
          <Text style={styles.helper}>Loading crew…</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16, paddingBottom: 8, gap: 14 },
  maxWidthWrap: { width: '100%', maxWidth: 1024, alignSelf: 'center', gap: 14 },
  header: { borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#0b1220', padding: 14, gap: 4 },
  title: { color: '#f8fafc', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#94a3b8', fontSize: 13 },
  helper: { color: '#94a3b8', fontSize: 13 },
});
