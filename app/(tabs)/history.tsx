import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HistoryPanel } from '../../src/components/HistoryPanel';
import { useAppStateContext } from '../../src/state/AppStateContext';

export default function HistoryScreen() {
  const state = useAppStateContext();

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} alwaysBounceVertical={false} bounces={false}>
      <View style={styles.maxWidthWrap}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Track winners and trends to keep your crew coming back daily.</Text>
        </View>

        <HistoryPanel
          days7={state.history7Days}
          days30={state.history30Days}
          leaderboard={state.leaderboard}
          show30Days={state.show30DayHistory}
          onToggleRange={state.setShow30DayHistory}
        />
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
});
