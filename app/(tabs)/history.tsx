import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { HistoryPanel } from '../../src/components/HistoryPanel';
import { useAppStateContext } from '../../src/state/AppStateContext';
import { ds } from '../../src/components/designSystem';

export default function HistoryScreen() {
  const state = useAppStateContext();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 8, 18), paddingBottom: Math.max(insets.bottom + 140, 160) }]}
        alwaysBounceVertical={false}
        bounces={false}
      >
        <View style={styles.maxWidthWrap}>
          <LinearGradient colors={['rgba(246, 212, 122, 0.16)', 'rgba(122, 227, 195, 0.1)', 'rgba(8, 17, 30, 0.96)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Text style={styles.kicker}>Archive room</Text>
            <Text style={styles.title}>Review lunch history as a running digest, not a lonely table.</Text>
            <Text style={styles.subtitle}>The archive now opens with a summary of who keeps winning, then drops you into the decision ledger underneath.</Text>
          </LinearGradient>

          <HistoryPanel days7={state.history7Days} days30={state.history30Days} leaderboard={state.leaderboard} show30Days={state.show30DayHistory} onToggleRange={state.setShow30DayHistory} />

          {state.history7Days.length === 0 && state.history30Days.length === 0 ? <Text style={styles.helper}>No history yet — once the crew starts voting, this room will fill in.</Text> : null}
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
  kicker: { color: ds.colors.gold, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  title: { color: ds.colors.text, fontSize: 31, lineHeight: 37, fontWeight: '900', letterSpacing: -1, maxWidth: 760 },
  subtitle: { color: ds.colors.textMuted, fontSize: 14, lineHeight: 21, maxWidth: 740 },
  helper: { color: ds.colors.textSoft, fontSize: 13, fontWeight: '600' },
});
