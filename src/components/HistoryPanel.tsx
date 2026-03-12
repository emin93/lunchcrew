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
  const topThree = leaderboard.slice(0, 3);

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Crew archive</Text>
          <Text style={styles.title}>Patterns, not just receipts</Text>
          <Text style={styles.subtitle}>This view behaves like a digest: quick podium, decision volume, then the raw daily ledger.</Text>
        </View>
        <View style={styles.toggleRow}>
          <Pressable style={[styles.toggle, !show30Days && styles.toggleActive]} onPress={() => onToggleRange(false)}>
            <Text style={[styles.toggleText, !show30Days && styles.toggleTextActive]}>7 days</Text>
          </Pressable>
          <Pressable style={[styles.toggle, show30Days && styles.toggleActive]} onPress={() => onToggleRange(true)}>
            <Text style={[styles.toggleText, show30Days && styles.toggleTextActive]}>30 days</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.digestGrid}>
        <View style={styles.podiumCard}>
          <Text style={styles.sectionLabel}>Podium</Text>
          {topThree.length === 0 ? (
            <Text style={styles.empty}>No winners yet. Once the crew starts deciding, the archive will start reading like a real scoreboard.</Text>
          ) : (
            topThree.map((place, index) => (
              <View key={`${place.name}-${index}`} style={[styles.podiumRow, index === 0 && styles.podiumRowFirst]}>
                <Text style={styles.podiumRank}>{index + 1}</Text>
                <View style={styles.podiumCopy}>
                  <Text style={styles.podiumName} numberOfLines={1}>{place.name}</Text>
                  <Text style={styles.podiumWins}>{place.wins} wins</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.snapshotCard}>
          <Text style={styles.sectionLabel}>Window</Text>
          <Text style={styles.snapshotValue}>{rows.length}</Text>
          <Text style={styles.snapshotText}>{show30Days ? 'recorded lunch decisions across the past month' : 'recorded lunch decisions across the past week'}</Text>
        </View>
      </View>

      <View style={styles.ledgerCard}>
        <View style={styles.ledgerHeader}>
          <Text style={styles.ledgerTitle}>Decision ledger</Text>
          <Text style={styles.ledgerMeta}>{show30Days ? 'Monthly archive' : 'Weekly archive'}</Text>
        </View>

        <View style={styles.tableHead}>
          <Text style={[styles.headText, styles.dateCol]}>Date</Text>
          <Text style={[styles.headText, styles.winnerCol]}>Winner</Text>
          <Text style={[styles.headText, styles.voteCol]}>Votes</Text>
        </View>

        {rows.length === 0 ? (
          <Text style={styles.emptySmall}>No history rows yet.</Text>
        ) : (
          rows.map((day, index) => (
            <View key={day.poll_date} style={[styles.tableRow, index === rows.length - 1 && styles.tableRowLast]}>
              <Text style={[styles.rowText, styles.dateCol]}>{day.poll_date}</Text>
              <Text style={[styles.rowText, styles.winnerCol]} numberOfLines={1}>{day.winner_name || 'No winner'}</Text>
              <Text style={[styles.rowText, styles.voteCol]}>{day.winner_votes || 0}</Text>
            </View>
          ))
        )}
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
  header: { gap: 14 },
  headerCopy: { gap: 8 },
  eyebrow: { color: ds.colors.gold, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  title: { color: ds.colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: ds.colors.textMuted, fontSize: 14, lineHeight: 21, maxWidth: 680 },
  toggleRow: { flexDirection: 'row', gap: 8, alignSelf: 'flex-start' },
  toggle: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toggleActive: { backgroundColor: ds.colors.goldSoft, borderColor: 'rgba(246, 212, 122, 0.26)' },
  toggleText: { color: ds.colors.textMuted, fontSize: 12, fontWeight: '800' },
  toggleTextActive: { color: ds.colors.text },
  digestGrid: { gap: 12 },
  podiumCard: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.cardMuted,
    padding: 16,
    gap: 10,
  },
  sectionLabel: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.9 },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    backgroundColor: ds.colors.input,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    padding: 12,
  },
  podiumRowFirst: { backgroundColor: ds.colors.goldSoft, borderColor: 'rgba(246, 212, 122, 0.26)' },
  podiumRank: {
    width: 30,
    color: ds.colors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  podiumCopy: { flex: 1, gap: 2 },
  podiumName: { color: ds.colors.text, fontSize: 15, fontWeight: '900' },
  podiumWins: { color: ds.colors.textMuted, fontSize: 12, fontWeight: '700' },
  snapshotCard: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: ds.colors.accentSoftStrong,
    backgroundColor: ds.colors.accentSoft,
    padding: 18,
    gap: 6,
  },
  snapshotValue: { color: ds.colors.text, fontSize: 42, lineHeight: 46, fontWeight: '900' },
  snapshotText: { color: ds.colors.textMuted, fontSize: 13, lineHeight: 19, maxWidth: 320 },
  ledgerCard: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.panel,
    overflow: 'hidden',
  },
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  ledgerTitle: { color: ds.colors.text, fontSize: 18, fontWeight: '900' },
  ledgerMeta: { color: ds.colors.textSoft, fontSize: 12, fontWeight: '700' },
  tableHead: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: ds.colors.cardSoft,
    borderTopWidth: 1,
    borderTopColor: ds.colors.stroke,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.stroke,
  },
  headText: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.stroke,
    backgroundColor: 'transparent',
  },
  tableRowLast: { borderBottomWidth: 0 },
  rowText: { color: ds.colors.text, fontSize: 13, fontWeight: '700' },
  dateCol: { width: 108 },
  winnerCol: { flex: 1 },
  voteCol: { width: 56, textAlign: 'right' },
  empty: { color: ds.colors.textMuted, fontSize: 13, lineHeight: 19 },
  emptySmall: { color: ds.colors.textSoft, fontSize: 12, padding: 16 },
});
