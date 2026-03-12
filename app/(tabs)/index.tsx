import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 8, 18), paddingBottom: Math.max(insets.bottom + 140, 160) }]}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical={false}
        bounces={false}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.maxWidthWrap}>
          <LinearGradient colors={['rgba(122, 227, 195, 0.18)', 'rgba(246, 212, 122, 0.12)', 'rgba(8, 17, 30, 0.96)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Text style={styles.kicker}>Lunch desk</Text>
            <Text style={styles.title}>Run today’s lunch vote like a live desk instead of a chaotic chat thread.</Text>
            <Text style={styles.subtitle}>The new layout treats the app like an editorial control room: headline first, current state second, ballot underneath.</Text>

            <View style={styles.metricGrid}>
              <View style={styles.metricCard}><Text style={styles.metricLabel}>Crew code</Text><Text style={styles.metricValue}>{state.workspace?.invite_code || '—'}</Text></View>
              <View style={styles.metricCard}><Text style={styles.metricLabel}>Places live</Text><Text style={styles.metricValue}>{state.options.length}</Text></View>
              <View style={styles.metricCard}><Text style={styles.metricLabel}>Current leader</Text><Text style={styles.metricValue} numberOfLines={2}>{state.topChoice || 'No leader yet'}</Text></View>
              <View style={styles.metricCard}><Text style={styles.metricLabel}>Build</Text><Text style={styles.metricValue}>{state.BUILD_LABEL}</Text></View>
            </View>
          </LinearGradient>

          {state.loading && (
            <View style={styles.noticeBox}>
              <ActivityIndicator color={ds.colors.accent} />
              <Text style={styles.noticeText}>Syncing the lunch desk…</Text>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, gap: 18 },
  maxWidthWrap: { width: '100%', maxWidth: 980, alignSelf: 'center', gap: 18 },
  hero: {
    borderRadius: ds.radius.xxl,
    padding: ds.spacing.xl,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    gap: 16,
    ...ds.shadow.card,
  },
  kicker: { color: ds.colors.accent, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { color: ds.colors.text, fontSize: 33, lineHeight: 39, fontWeight: '900', letterSpacing: -1.1, maxWidth: 760 },
  subtitle: { color: ds.colors.textMuted, fontSize: 14, lineHeight: 21, maxWidth: 700 },
  metricGrid: { gap: 10 },
  metricCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.panel,
    padding: 14,
    gap: 4,
  },
  metricLabel: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  metricValue: { color: ds.colors.text, fontSize: 16, fontWeight: '900' },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.cardSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noticeText: { color: ds.colors.textMuted, fontSize: 13, fontWeight: '600' },
  messageBox: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 10, ...ds.shadow.card },
  errorBox: { borderColor: 'rgba(255, 176, 184, 0.28)', backgroundColor: ds.colors.dangerSoft },
  errorTitle: { color: ds.colors.danger, fontWeight: '900', fontSize: 14 },
  errorText: { color: '#ffd4d8', fontSize: 13, lineHeight: 19 },
  retryBtn: { alignSelf: 'flex-start', backgroundColor: ds.colors.white, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  retryBtnText: { color: '#3b1720', fontWeight: '800', fontSize: 12 },
});
