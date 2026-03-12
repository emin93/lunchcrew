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
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 8, 18), paddingBottom: Math.max(insets.bottom + 140, 160) }]}
        alwaysBounceVertical={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.maxWidthWrap}>
          <LinearGradient colors={['rgba(122, 227, 195, 0.18)', 'rgba(132, 174, 218, 0.12)', 'rgba(8, 17, 30, 0.96)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Text style={styles.kicker}>Operations</Text>
            <Text style={styles.title}>Keep your crew recognizable, shareable, and ready before the next vote opens.</Text>
            <Text style={styles.subtitle}>This screen now feels less like a settings form and more like a compact control room for the team itself.</Text>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, gap: 18 },
  maxWidthWrap: { width: '100%', maxWidth: 980, alignSelf: 'center', gap: 18 },
  hero: {
    borderRadius: ds.radius.xxl,
    padding: ds.spacing.xl,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    gap: 10,
    ...ds.shadow.card,
  },
  kicker: { color: ds.colors.accent, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  title: { color: ds.colors.text, fontSize: 31, lineHeight: 37, fontWeight: '900', letterSpacing: -1, maxWidth: 780 },
  subtitle: { color: ds.colors.textMuted, fontSize: 14, lineHeight: 21, maxWidth: 740 },
  helper: { color: ds.colors.textMuted, fontSize: 13, fontWeight: '600' },
});
