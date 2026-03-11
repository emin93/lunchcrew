import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HistoryDaySummary, LeaderboardPlace } from '../types';

type Props = {
  days7: HistoryDaySummary[];
  days30: HistoryDaySummary[];
  leaderboard: LeaderboardPlace[];
  show30Days: boolean;
  onToggleRange: (next: boolean) => void;
};

export function HistoryPanel({ days7, days30, leaderboard, show30Days, onToggleRange }: Props) {
  const rows = show30Days ? days30 : days7;

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent winners</Text>
        <View style={styles.toggleRow}>
          <Pressable style={[styles.toggleBtn, !show30Days && styles.toggleBtnActive]} onPress={() => onToggleRange(false)}>
            <Text style={[styles.toggleText, !show30Days && styles.toggleTextActive]}>7d</Text>
          </Pressable>
          <Pressable style={[styles.toggleBtn, show30Days && styles.toggleBtnActive]} onPress={() => onToggleRange(true)}>
            <Text style={[styles.toggleText, show30Days && styles.toggleTextActive]}>30d</Text>
          </Pressable>
        </View>
      </View>

      {rows.length === 0 ? (
        <Text style={styles.empty}>No history yet. As your crew votes daily, winners will show up here.</Text>
      ) : (
        <View style={styles.list}>
          {rows.map((d) => (
            <View key={d.poll_date} style={styles.row}>
              <Text style={styles.date}>{d.poll_date}</Text>
              <Text style={styles.winner}>{d.winner_name || 'No winner yet'}</Text>
              <Text style={styles.meta}>{d.winner_votes > 0 ? `${d.winner_votes} votes` : 'No votes'}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.leaderboardWrap}>
        <Text style={styles.subtitle}>Most picked places</Text>
        {leaderboard.length === 0 ? (
          <Text style={styles.emptySmall}>No leaderboard data yet.</Text>
        ) : (
          leaderboard.slice(0, 5).map((p, idx) => (
            <View key={`${p.name}-${idx}`} style={styles.lbRow}>
              <Text style={styles.lbRank}>#{idx + 1}</Text>
              <Text style={styles.lbName}>{p.name}</Text>
              <Text style={styles.lbCount}>{p.wins} wins</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: '#10122a',
    borderWidth: 1,
    borderColor: '#3a3f7a',
    gap: 11,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 5,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#f8fafc', fontSize: 17, fontWeight: '800' },
  toggleRow: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#0f172a',
  },
  toggleBtnActive: { borderColor: '#22d3ee', backgroundColor: '#083344' },
  toggleText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  toggleTextActive: { color: '#67e8f9' },
  empty: { color: '#94a3b8', fontSize: 12, lineHeight: 18 },
  list: { gap: 6 },
  row: {
    borderWidth: 1,
    borderColor: '#323c57',
    borderRadius: 12,
    backgroundColor: '#141d36',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: { color: '#94a3b8', fontSize: 12, width: 88 },
  winner: { color: '#e2e8f0', fontSize: 13, fontWeight: '700', flex: 1 },
  meta: { color: '#cbd5e1', fontSize: 11, fontWeight: '700' },
  leaderboardWrap: { marginTop: 4, gap: 6 },
  subtitle: { color: '#cbd5e1', fontSize: 13, fontWeight: '800' },
  emptySmall: { color: '#64748b', fontSize: 12 },
  lbRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lbRank: { color: '#67e8f9', width: 26, fontWeight: '800', fontSize: 12 },
  lbName: { color: '#e2e8f0', flex: 1, fontSize: 13, fontWeight: '700' },
  lbCount: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
});
