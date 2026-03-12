import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 8, 18), paddingBottom: Math.max(insets.bottom + 154, 172) }]}
        alwaysBounceVertical={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.maxWidthWrap}>
          <LinearGradient colors={['rgba(87, 227, 194, 0.18)', 'rgba(140, 161, 255, 0.16)', 'rgba(10, 15, 34, 0.98)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.kickerWrap}><Text style={styles.kicker}>Crew studio</Text></View>
            <Text style={styles.title}>A single place to shape the crew’s identity, share access, and keep the setup feeling deliberate.</Text>
            <Text style={styles.subtitle}>Instead of a plain settings form, this screen now works like a lightweight operations console: identity first, profile second, actions grouped where they belong.</Text>
          </LinearGradient>

          {state.workspace ? <WorkspacePanel workspace={state.workspace} displayName={state.member?.display_name || ''} onSaveDisplayName={(name) => void state.saveDisplayName(name)} savingName={state.savingName} onShare={state.shareInvite} onRename={state.renameCrew} onCreateNewCrew={() => void state.createNewCrew()} renaming={state.renaming} /> : <Text style={styles.helper}>Loading crew…</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, gap: 18 },
  maxWidthWrap: { width: '100%', maxWidth: 1100, alignSelf: 'center', gap: 18 },
  hero: {
    borderRadius: ds.radius.xxl,
    padding: ds.spacing.xl,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    gap: 10,
    ...ds.shadow.card,
  },
  kickerWrap: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(87, 227, 194, 0.22)',
    backgroundColor: ds.colors.tealSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  kicker: { color: ds.colors.teal, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: ds.colors.text, fontSize: 31, lineHeight: 38, fontWeight: '900', letterSpacing: -1, maxWidth: 800 },
  subtitle: { color: ds.colors.textMuted, fontSize: 14, lineHeight: 22, maxWidth: 760 },
  helper: { color: ds.colors.textMuted, fontSize: 13, fontWeight: '600' },
});
