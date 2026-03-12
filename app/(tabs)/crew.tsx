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
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 8, 18), paddingBottom: Math.max(insets.bottom + 132, 148) }]}
        alwaysBounceVertical={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.maxWidthWrap}>
          <LinearGradient colors={['rgba(82, 230, 197, 0.16)', 'rgba(124, 156, 255, 0.16)', 'rgba(14, 18, 36, 0.96)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Text style={styles.kicker}>Crew setup</Text>
            <Text style={styles.title}>Everything about your lunch crew, in one polished control center.</Text>
            <Text style={styles.subtitle}>Update the crew identity, personalize your name, and share the invite without touching app logic or settings sprawl.</Text>
          </LinearGradient>

          {state.workspace ? <WorkspacePanel workspace={state.workspace} displayName={state.member?.display_name || ''} onSaveDisplayName={(name) => void state.saveDisplayName(name)} savingName={state.savingName} onShare={state.shareInvite} onRename={state.renameCrew} onCreateNewCrew={() => void state.createNewCrew()} renaming={state.renaming} /> : <Text style={styles.helper}>Loading crew…</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, gap: 16 },
  maxWidthWrap: { width: '100%', maxWidth: 1040, alignSelf: 'center', gap: 16 },
  hero: {
    borderRadius: ds.radius.xxl,
    padding: ds.spacing.xl,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    gap: 10,
    ...ds.shadow.card,
  },
  kicker: { color: ds.colors.teal, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: ds.colors.text, fontSize: 31, lineHeight: 38, fontWeight: '900', letterSpacing: -1, maxWidth: 760 },
  subtitle: { color: ds.colors.textMuted, fontSize: 14, lineHeight: 22, maxWidth: 680 },
  helper: { color: ds.colors.textMuted, fontSize: 13, fontWeight: '600' },
});
