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
        <View style={styles.headerTextWrap}>
          <Text style={styles.eyebrow}>Performance</Text>
          <Text style={styles.title}>Lunch momentum</Text>
          <Text style={styles.subtitle}>Read the board in two layers: a fast summary of recurring winners, then the detailed daily record underneath.</Text>
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

      <View style={styles.topSection}>
        <View style={styles.podiumWrap}>
          <Text style={styles.sectionTitle}>Top winners</Text>
          {top3.length === 0 ? (
            <Text style={styles.empty}>No winners yet. Start voting to build your leaderboard.</Text>
          ) : (
            <View style={styles.podiumRow}>
              {top3.map((p, idx) => (
                <View key={`${p.name}-${idx}`} style={[styles.podiumCard, idx === 0 && styles.podiumCardMain]}>
                  <Text style={styles.podiumRank}>{idx === 0 ? 'Top place' : `#${idx + 1}`}</Text>
                  <Text style={styles.podiumName} numberOfLines={2}>{p.name}</Text>
                  <Text style={styles.podiumWins}>{p.wins} wins</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.snapshotCard}>
          <Text style={styles.snapshotLabel}>Snapshot</Text>
          <Text style={styles.snapshotValue}>{rows.length}</Text>
          <Text style={styles.snapshotCopy}>{show30Days ? 'recorded lunch decisions in the last month' : 'recorded lunch decisions in the last week'}</Text>
        </View>
      </View>

      <View style={styles.tableShell}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.sectionTitle}>Recent results</Text>
          <Text style={styles.tableMeta}>{show30Days ? 'Monthly rollup' : 'Weekly rollup'}</Text>
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
            rows.map((d, index) => (
              <View key={d.poll_date} style={[styles.tableRow, index === rows.length - 1 && styles.tableRowLast]}>
                <Text style={[styles.rowCell, styles.dateCol]}>{d.poll_date}</Text>
                <Text style={[styles.rowCell, styles.winnerCol]} numberOfLines={1}>{d.winner_name || 'No winner'}</Text>
                <Text style={[styles.rowCell, styles.votesCol]}>{d.winner_votes || 0}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: ds.radius.xxl,
    padding: ds.spacing.xl,
    backgroundColor: ds.colors.card,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    gap: 22,
    ...ds.shadow.card,
  },
  headerRow: { gap: 14 },
  headerTextWrap: { gap: 6 },
  eyebrow: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: ds.colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: ds.colors.textMuted, fontSize: 14, lineHeight: 21, maxWidth: 660 },
  toggleRow: { flexDirection: 'row', gap: 8, alignSelf: 'flex-start' },
  toggleBtn: {
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: ds.colors.cardMuted,
  },
  toggleBtnActive: { backgroundColor: ds.colors.accentSoft, borderColor: ds.colors.accentSoftStrong },
  toggleText: { color: ds.colors.textMuted, fontSize: 12, fontWeight: '800' },
  toggleTextActive: { color: ds.colors.text },
  topSection: { gap: 12 },
  sectionTitle: { color: ds.colors.text, fontSize: 16, fontWeight: '800' },
  podiumWrap: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.cardMuted,
    padding: 16,
    gap: 14,
  },
  podiumRow: { flexDirection: 'row', gap: 10 },
  podiumCard: {
    flex: 1,
    minHeight: 128,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.input,
    padding: 14,
    gap: 6,
    justifyContent: 'space-between',
  },
  podiumCardMain: { borderColor: 'rgba(255, 207, 114, 0.3)', backgroundColor: 'rgba(52, 39, 10, 0.38)' },
  podiumRank: { color: ds.colors.gold, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  podiumName: { color: ds.colors.text, fontWeight: '900', fontSize: 16, lineHeight: 21 },
  podiumWins: { color: ds.colors.textMuted, fontSize: 12, fontWeight: '700' },
  snapshotCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.panel,
    padding: 18,
    gap: 4,
  },
  snapshotLabel: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  snapshotValue: { color: ds.colors.text, fontSize: 36, lineHeight: 40, fontWeight: '900' },
  snapshotCopy: { color: ds.colors.textMuted, fontSize: 13, lineHeight: 19, maxWidth: 300 },
  tableShell: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.panel,
    padding: 16,
    gap: 12,
  },
  tableHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  tableMeta: { color: ds.colors.textSoft, fontSize: 12, fontWeight: '700' },
  tableWrap: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    overflow: 'hidden',
  },
  tableHead: { flexDirection: 'row', backgroundColor: ds.colors.cardMuted, paddingVertical: 11, paddingHorizontal: 12 },
  headCell: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 13,
    paddingHorizontal: 12,
    backgroundColor: ds.colors.input,
    borderTopWidth: 1,
    borderTopColor: ds.colors.stroke,
  },
  tableRowLast: { borderBottomWidth: 0 },
  rowCell: { color: ds.colors.text, fontSize: 13, fontWeight: '700' },
  dateCol: { width: 104 },
  winnerCol: { flex: 1 },
  votesCol: { width: 56, textAlign: 'right' },
  empty: { color: ds.colors.textMuted, fontSize: 13, lineHeight: 19 },
  emptySmall: { color: ds.colors.textSoft, fontSize: 12, padding: 12 },
});
