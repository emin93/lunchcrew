import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkspacePanel } from '../../src/components/WorkspacePanel';
import { useAppStateContext } from '../../src/state/AppStateContext';
import { ds } from '../../src/components/designSystem';

export default function CrewScreen() {
  const state = useAppStateContext();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 6, 14), paddingBottom: Math.max(insets.bottom + 120, 136) }]}
        alwaysBounceVertical={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.maxWidthWrap}>
          <View style={styles.hero}>
            <Text style={styles.kicker}>Workspace</Text>
            <Text style={styles.title}>Crew settings</Text>
            <Text style={styles.subtitle}>Manage names, invites, and workspace identity in one place.</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16, gap: 16 },
  maxWidthWrap: { width: '100%', maxWidth: 980, alignSelf: 'center', gap: 14 },
  hero: {
    borderRadius: ds.radius.xl,
    padding: ds.spacing.lg,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.shell,
  },
  kicker: { color: ds.colors.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: ds.colors.text, fontSize: 30, fontWeight: '800', marginTop: 4, letterSpacing: -0.6 },
  subtitle: { color: ds.colors.textMuted, fontSize: 13, marginTop: 4 },
  helper: { color: ds.colors.textMuted, fontSize: 13 },
});
