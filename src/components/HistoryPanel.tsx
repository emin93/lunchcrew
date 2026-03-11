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
  const top3 = leaderboard.slice(0, 3);

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Performance</Text>
          <Text style={styles.title}>Lunch momentum</Text>
        </View>
        <View style={styles.toggleRow}>
          <Pressable style={[styles.toggleBtn, !show30Days && styles.toggleBtnActive]} onPress={() => onToggleRange(false)}>
            <Text style={[styles.toggleText, !show30Days && styles.toggleTextActive]}>7 days</Text>
          </Pressable>
          <Pressable style={[styles.toggleBtn, show30Days && styles.toggleBtnActive]} onPress={() => onToggleRange(true)}>
            <Text style={[styles.toggleText, show30Days && styles.toggleTextActive]}>30 days</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.podiumWrap}>
        {top3.length === 0 ? (
          <Text style={styles.empty}>No winners yet. Start voting to build your leaderboard.</Text>
        ) : (
          <View style={styles.podiumRow}>
            {top3.map((p, idx) => (
              <View key={`${p.name}-${idx}`} style={[styles.podiumCard, idx === 0 && styles.podiumCardMain]}>
                <Text style={styles.podiumRank}>#{idx + 1}</Text>
                <Text style={styles.podiumName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.podiumWins}>{p.wins} wins</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.tableWrap}>
        <View style={styles.tableHead}>
          <Text style={[styles.headCell, styles.dateCol]}>Date</Text>
          <Text style={[styles.headCell, styles.winnerCol]}>Winner</Text>
          <Text style={[styles.headCell, styles.votesCol]}>Votes</Text>
        </View>
        {rows.length === 0 ? (
          <Text style={styles.emptySmall}>No history rows yet.</Text>
        ) : (
          rows.map((d) => (
            <View key={d.poll_date} style={styles.tableRow}>
              <Text style={[styles.rowCell, styles.dateCol]}>{d.poll_date}</Text>
              <Text style={[styles.rowCell, styles.winnerCol]} numberOfLines={1}>{d.winner_name || 'No winner'}</Text>
              <Text style={[styles.rowCell, styles.votesCol]}>{d.winner_votes || 0}</Text>
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
    backgroundColor: '#0f1227',
    borderWidth: 1,
    borderColor: '#343d77',
    gap: 14,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: '#8ba0ce', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#f8fafc', fontSize: 20, fontWeight: '900', marginTop: 2 },
  toggleRow: { flexDirection: 'row', gap: 6 },
  toggleBtn: { borderWidth: 1, borderColor: '#3e4a86', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  toggleBtnActive: { backgroundColor: '#24316a', borderColor: '#6584ff' },
  toggleText: { color: '#93a4cf', fontSize: 12, fontWeight: '700' },
  toggleTextActive: { color: '#e5ecff' },
  podiumWrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3a457d',
    backgroundColor: '#161d3b',
    padding: 10,
  },
  podiumRow: { flexDirection: 'row', gap: 8 },
  podiumCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#465692',
    backgroundColor: '#1b2550',
    padding: 10,
    gap: 2,
  },
  podiumCardMain: { borderColor: '#72a3ff', backgroundColor: '#263b7a' },
  podiumRank: { color: '#8fd4ff', fontSize: 11, fontWeight: '900' },
  podiumName: { color: '#f8fafc', fontWeight: '800', fontSize: 13 },
  podiumWins: { color: '#c6d3f2', fontSize: 11, fontWeight: '700' },
  tableWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#364270',
    overflow: 'hidden',
  },
  tableHead: { flexDirection: 'row', backgroundColor: '#1b2347', paddingVertical: 8, paddingHorizontal: 10 },
  headCell: { color: '#9fb2dd', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 10, backgroundColor: '#141c39', borderTopWidth: 1, borderTopColor: '#2f3a62' },
  rowCell: { color: '#d7e2ff', fontSize: 12, fontWeight: '600' },
  dateCol: { width: 95 },
  winnerCol: { flex: 1 },
  votesCol: { width: 46, textAlign: 'right' },
  empty: { color: '#9fb0d8', fontSize: 12, lineHeight: 18 },
  emptySmall: { color: '#7485ac', fontSize: 12, padding: 10 },
});
