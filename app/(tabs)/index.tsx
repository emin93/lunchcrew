import { Platform, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PollPanel } from '../../src/components/PollPanel';
import { useAppStateContext } from '../../src/state/AppStateContext';
import { trackEvent } from '../../src/lib/analytics';
import { ds } from '../../src/components/designSystem';

export default function VoteScreen() {
  const state = useAppStateContext();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 8, 18), paddingBottom: Math.max(insets.bottom + 138, 156) }]}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical={false}
        bounces={false}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.maxWidthWrap}>
          <LinearGradient colors={['rgba(124, 156, 255, 0.26)', 'rgba(82, 230, 197, 0.1)', 'rgba(14, 18, 36, 0.96)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroTopRow}>
              <View style={styles.badge}><Text style={styles.badgeText}>LunchCrew • today</Text></View>
              <Text style={styles.buildLabel}>{state.BUILD_LABEL}</Text>
            </View>

            <Text style={styles.title}>Decide lunch fast, without the group chat spiral.</Text>
            <Text style={styles.subtitle}>Vote, compare nearby spots, and keep the crew moving with one clean daily board.</Text>

            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Crew code</Text>
                <Text style={styles.metricValue}>{state.workspace?.invite_code || '—'}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Places live</Text>
                <Text style={styles.metricValue}>{state.options.length}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Current leader</Text>
                <Text style={styles.metricValue} numberOfLines={1}>{state.topChoice || 'Waiting for votes'}</Text>
              </View>
            </View>
          </LinearGradient>

          {state.loading && (
            <View style={styles.noticeBox}>
              <ActivityIndicator color={ds.colors.accent} />
              <Text style={styles.noticeText}>Syncing your lunch board…</Text>
            </View>
          )}

          {state.configError && (
            <View style={[styles.messageBox, styles.errorBox]}>
              <Text style={styles.errorTitle}>Configuration missing</Text>
              <Text style={styles.errorText}>{state.configError}</Text>
            </View>
          )}

          {state.loadError && (
            <View style={[styles.messageBox, styles.errorBox]}>
              <Text style={styles.errorTitle}>Couldn’t refresh the crew</Text>
              <Text style={styles.errorText}>{state.loadError}</Text>
              <Pressable style={styles.retryBtn} onPress={() => void state.retryLoad()}>
                <Text style={styles.retryBtnText}>Try again</Text>
              </Pressable>
            </View>
          )}

          {state.poll && (
            <PollPanel
              poll={state.poll}
              options={state.options}
              myOptionId={state.myOptionId}
              votingOptionId={state.votingOptionId}
              addingOption={state.addingOption}
              newOption={state.newOption}
              topChoice={state.topChoice}
              suggestions={state.suggestions}
              loadingSuggestions={state.loadingSuggestions}
              selectedSuggestion={state.selectedSuggestion}
              onSelectSuggestion={(s) => {
                state.setSelectedSuggestion(s);
                state.setNewOption(s.name);
                void trackEvent('place_suggestion_selected', { poll_id: state.poll!.id, workspace_id: state.workspace?.id, place_id: s.externalPlaceId }, state.deviceId);
              }}
              onClearSuggestion={() => state.setSelectedSuggestion(null)}
              onVote={state.vote}
              onOpenMaps={(optionId, url) =>
                void trackEvent('maps_opened', { option_id: optionId, poll_id: state.poll!.id, workspace_id: state.workspace?.id, url }, state.deviceId)
              }
              onOpenMenu={(optionId, url) =>
                void trackEvent('menu_opened', { option_id: optionId, poll_id: state.poll!.id, workspace_id: state.workspace?.id, url }, state.deviceId)
              }
              onChangeNewOption={(v) => {
                state.setSelectedSuggestion(null);
                state.setNewOption(v);
              }}
              onAddOption={state.addOption}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, gap: 16 },
  maxWidthWrap: { width: '100%', maxWidth: 1040, alignSelf: 'center', gap: 16 },
  hero: {
    borderRadius: ds.radius.xxl,
    padding: ds.spacing.xl,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    gap: 16,
    overflow: 'hidden',
    ...ds.shadow.card,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  badge: {
    borderRadius: ds.radius.pill,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: { color: ds.colors.text, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  buildLabel: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '700' },
  title: { color: ds.colors.text, fontSize: 34, lineHeight: 40, fontWeight: '900', letterSpacing: -1.2, maxWidth: 700 },
  subtitle: { color: ds.colors.textMuted, fontSize: 15, lineHeight: 23, maxWidth: 660 },
  metricRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metricCard: {
    minWidth: 150,
    flexGrow: 1,
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: 'rgba(8, 13, 31, 0.52)',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 4,
  },
  metricLabel: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  metricValue: { color: ds.colors.text, fontSize: 15, fontWeight: '800' },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.cardSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noticeText: { color: ds.colors.textMuted, fontSize: 13, fontWeight: '600' },
  messageBox: {
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    ...ds.shadow.card,
  },
  errorBox: { borderColor: 'rgba(255, 159, 170, 0.28)', backgroundColor: ds.colors.dangerSoft },
  errorTitle: { color: ds.colors.danger, fontWeight: '900', fontSize: 14 },
  errorText: { color: '#ffd1d7', fontSize: 13, lineHeight: 19 },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: ds.colors.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: ds.radius.pill,
  },
  retryBtnText: { color: '#3c1020', fontWeight: '800', fontSize: 12 },
});
