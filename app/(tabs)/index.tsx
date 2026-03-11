import { Platform, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 6, 14), paddingBottom: Math.max(insets.bottom + 132, 148) }]}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical={false}
        bounces={false}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.maxWidthWrap}>
          <View style={styles.hero}>
            <Text style={styles.kicker}>LunchCrew</Text>
            <Text style={styles.title}>Daily vote board</Text>
            <Text style={styles.subtitle}>Pick today’s lunch winner without chat noise.</Text>

            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Crew</Text>
                <Text style={styles.metricValue}>{state.workspace?.invite_code || '—'}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Options</Text>
                <Text style={styles.metricValue}>{state.options.length}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Leader</Text>
                <Text style={styles.metricValue} numberOfLines={1}>{state.topChoice || '—'}</Text>
              </View>
            </View>

            <Text style={styles.buildLabel}>{state.BUILD_LABEL}</Text>
          </View>

          {state.loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={ds.colors.accent} />
              <Text style={styles.loadingText}>Syncing crew…</Text>
            </View>
          )}

          {state.configError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Config missing</Text>
              <Text style={styles.errorText}>{state.configError}</Text>
            </View>
          )}

          {state.loadError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Connection problem</Text>
              <Text style={styles.errorText}>{state.loadError}</Text>
              <Pressable style={styles.retryBtn} onPress={() => void state.retryLoad()}>
                <Text style={styles.retryBtnText}>Retry</Text>
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
  scrollContent: { flexGrow: 1, padding: 16, gap: 16 },
  maxWidthWrap: { width: '100%', maxWidth: 980, alignSelf: 'center', gap: 14 },
  hero: {
    borderRadius: ds.radius.xl,
    padding: ds.spacing.lg,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.shell,
    gap: 10,
  },
  kicker: { color: ds.colors.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
  title: { color: ds.colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: ds.colors.textMuted, fontSize: 14, lineHeight: 20 },
  metricRow: { flexDirection: 'row', gap: 8 },
  metricCard: {
    flex: 1,
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.cardMuted,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  metricLabel: { color: ds.colors.textSoft, fontSize: 10, fontWeight: '700', marginBottom: 2 },
  metricValue: { color: ds.colors.text, fontSize: 12, fontWeight: '800' },
  buildLabel: { color: ds.colors.textSoft, fontSize: 11, marginTop: 4, fontWeight: '700' },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  loadingText: { color: ds.colors.textMuted, fontSize: 13 },
  errorBox: { borderRadius: ds.radius.md, borderWidth: 1, borderColor: '#ddb9b9', backgroundColor: ds.colors.dangerSoft, padding: 12, gap: 8 },
  errorTitle: { color: ds.colors.danger, fontWeight: '800' },
  errorText: { color: ds.colors.danger, fontSize: 13 },
  retryBtn: { alignSelf: 'flex-start', backgroundColor: ds.colors.danger, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  retryBtnText: { color: '#fff', fontWeight: '700' },
});
