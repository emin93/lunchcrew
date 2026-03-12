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
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 8, 18), paddingBottom: Math.max(insets.bottom + 154, 172) }]}
        alwaysBounceVertical={false}
        bounces={false}
      >
        <View style={styles.maxWidthWrap}>
          <LinearGradient colors={['rgba(255, 207, 114, 0.2)', 'rgba(140, 161, 255, 0.14)', 'rgba(10, 15, 34, 0.98)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroTopRow}>
              <View style={styles.kickerWrap}><Text style={styles.kicker}>Crew analytics</Text></View>
              <Text style={styles.rangeLabel}>{state.show30DayHistory ? '30 day view' : '7 day view'}</Text>
            </View>
            <Text style={styles.title}>A clearer read on what your crew actually chooses when it’s time to eat.</Text>
            <Text style={styles.subtitle}>This screen now behaves like an insight deck: leaderboard at the top, timeline beneath it, and stronger visual separation between summary and raw history.</Text>
          </LinearGradient>

          <HistoryPanel days7={state.history7Days} days30={state.history30Days} leaderboard={state.leaderboard} show30Days={state.show30DayHistory} onToggleRange={state.setShow30DayHistory} />

          {state.history7Days.length === 0 && state.history30Days.length === 0 ? <Text style={styles.helper}>No history yet — once the crew starts voting, this screen will light up.</Text> : null}
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
    gap: 12,
    ...ds.shadow.card,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  kickerWrap: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 207, 114, 0.22)',
    backgroundColor: ds.colors.goldSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  kicker: { color: ds.colors.gold, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  rangeLabel: { color: ds.colors.textSoft, fontSize: 12, fontWeight: '800' },
  title: { color: ds.colors.text, fontSize: 31, lineHeight: 38, fontWeight: '900', letterSpacing: -1, maxWidth: 780 },
  subtitle: { color: ds.colors.textMuted, fontSize: 14, lineHeight: 22, maxWidth: 760 },
  helper: { color: ds.colors.textSoft, fontSize: 13, fontWeight: '600' },
});
