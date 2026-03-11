import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HistoryDaySummary, LeaderboardPlace } from '../types';
import { ds } from './designSystem';

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
    borderRadius: ds.radius.xl,
    padding: ds.spacing.lg,
    backgroundColor: ds.colors.card,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    gap: 14,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: ds.colors.text, fontSize: 22, fontWeight: '800', marginTop: 2 },
  toggleRow: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    borderRadius: ds.radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: ds.colors.cardMuted,
  },
  toggleBtnActive: { backgroundColor: ds.colors.accent, borderColor: ds.colors.accentStrong },
  toggleText: { color: ds.colors.textMuted, fontSize: 12, fontWeight: '700' },
  toggleTextActive: { color: '#ffffff' },
  podiumWrap: {
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.cardMuted,
    padding: 10,
  },
  podiumRow: { flexDirection: 'row', gap: 8 },
  podiumCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: '#fffefb',
    padding: 10,
    gap: 2,
  },
  podiumCardMain: { borderColor: ds.colors.accentStrong, backgroundColor: ds.colors.accentSoft },
  podiumRank: { color: ds.colors.accentStrong, fontSize: 11, fontWeight: '900' },
  podiumName: { color: ds.colors.text, fontWeight: '800', fontSize: 13 },
  podiumWins: { color: ds.colors.textMuted, fontSize: 11, fontWeight: '700' },
  tableWrap: {
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    overflow: 'hidden',
  },
  tableHead: { flexDirection: 'row', backgroundColor: ds.colors.cardMuted, paddingVertical: 8, paddingHorizontal: 10 },
  headCell: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 10,
    backgroundColor: '#fffefb',
    borderTopWidth: 1,
    borderTopColor: ds.colors.stroke,
  },
  rowCell: { color: ds.colors.text, fontSize: 12, fontWeight: '600' },
  dateCol: { width: 95 },
  winnerCol: { flex: 1 },
  votesCol: { width: 46, textAlign: 'right' },
  empty: { color: ds.colors.textMuted, fontSize: 12, lineHeight: 18 },
  emptySmall: { color: ds.colors.textSoft, fontSize: 12, padding: 10 },
});
