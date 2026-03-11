import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HistoryPanel } from '../../src/components/HistoryPanel';
import { useAppStateContext } from '../../src/state/AppStateContext';

export default function HistoryScreen() {
  const state = useAppStateContext();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 8), paddingBottom: Math.max(insets.bottom + 120, 132) }]}
        alwaysBounceVertical={false}
        bounces={false}
      >
        <View style={styles.maxWidthWrap}>
          <LinearGradient colors={['#131b3f', '#10152f']} style={styles.hero}>
            <Text style={styles.kicker}>Crew intelligence</Text>
            <Text style={styles.title}>History & trends</Text>
            <Text style={styles.subtitle}>Track what wins and turn lunch into a reliable daily ritual.</Text>
          </LinearGradient>

          <HistoryPanel
            days7={state.history7Days}
            days30={state.history30Days}
            leaderboard={state.leaderboard}
            show30Days={state.show30DayHistory}
            onToggleRange={state.setShow30DayHistory}
          />
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
});
