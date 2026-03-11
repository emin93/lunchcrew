import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkspacePanel } from '../../src/components/WorkspacePanel';
import { useAppStateContext } from '../../src/state/AppStateContext';

export default function CrewScreen() {
  const state = useAppStateContext();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 8), paddingBottom: Math.max(insets.bottom + 16, 24) }]}
        alwaysBounceVertical={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.maxWidthWrap}>
          <LinearGradient colors={['#151b42', '#111530']} style={styles.hero}>
            <Text style={styles.kicker}>Operations</Text>
            <Text style={styles.title}>Crew control center</Text>
            <Text style={styles.subtitle}>Manage identity, invites, and workspace settings from one place.</Text>
          </LinearGradient>

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
  scrollContent: { flexGrow: 1, padding: 16, paddingBottom: 12, gap: 14 },
  maxWidthWrap: { width: '100%', maxWidth: 1024, alignSelf: 'center', gap: 14 },
  hero: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(129,149,255,0.35)',
  },
  kicker: { color: '#9ce5ff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#f8fafc', fontSize: 30, fontWeight: '900', marginTop: 3, letterSpacing: -0.6 },
  subtitle: { color: '#b7c3e4', fontSize: 13, marginTop: 3 },
  helper: { color: '#94a3b8', fontSize: 13 },
});
