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
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 8, 18), paddingBottom: Math.max(insets.bottom + 154, 172) }]}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical={false}
        bounces={false}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.maxWidthWrap}>
          <LinearGradient colors={['rgba(140, 161, 255, 0.28)', 'rgba(87, 227, 194, 0.12)', 'rgba(10, 15, 34, 0.98)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroRow}>
              <View style={styles.heroCopy}>
                <View style={styles.eyebrowPill}><Text style={styles.eyebrowText}>LunchCrew / decision board</Text></View>
                <Text style={styles.title}>The daily board for choosing lunch without the chaotic back-and-forth.</Text>
                <Text style={styles.subtitle}>One place to compare contenders, watch momentum build, and break the tie before the group chat turns into a mess.</Text>
              </View>

              <View style={styles.buildBadge}><Text style={styles.buildText}>{state.BUILD_LABEL}</Text></View>
            </View>

            <View style={styles.heroGrid}>
              <View style={[styles.heroCard, styles.heroCardPrimary]}>
                <Text style={styles.heroCardLabel}>Current leader</Text>
                <Text style={styles.heroCardValue} numberOfLines={2}>{state.topChoice || 'Waiting for the first vote'}</Text>
                <Text style={styles.heroCardHint}>The board updates live as the crew votes.</Text>
              </View>

              <View style={styles.heroRail}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Crew code</Text>
                  <Text style={styles.metricValue}>{state.workspace?.invite_code || '—'}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Places live</Text>
                  <Text style={styles.metricValue}>{state.options.length}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Mode</Text>
                  <Text style={styles.metricValue}>Daily vote</Text>
                </View>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, gap: 18 },
  maxWidthWrap: { width: '100%', maxWidth: 1100, alignSelf: 'center', gap: 18 },
  hero: {
    borderRadius: ds.radius.xxl,
    padding: ds.spacing.xl,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    gap: 18,
    overflow: 'hidden',
    ...ds.shadow.card,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  heroCopy: { flex: 1, minWidth: 260, gap: 12 },
  eyebrowPill: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eyebrowText: { color: ds.colors.text, fontSize: 11, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  buildBadge: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: 'rgba(7,11,26,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buildText: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '800' },
  title: { color: ds.colors.text, fontSize: 34, lineHeight: 40, fontWeight: '900', letterSpacing: -1.2, maxWidth: 760 },
  subtitle: { color: ds.colors.textMuted, fontSize: 15, lineHeight: 23, maxWidth: 700 },
  heroGrid: { gap: 12 },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: 'rgba(7,11,26,0.44)',
    padding: 18,
    gap: 6,
  },
  heroCardPrimary: {
    backgroundColor: 'rgba(12,18,40,0.7)',
    borderColor: ds.colors.accentSoftStrong,
  },
  heroCardLabel: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroCardValue: { color: ds.colors.text, fontSize: 24, lineHeight: 30, fontWeight: '900' },
  heroCardHint: { color: ds.colors.textMuted, fontSize: 13, lineHeight: 19 },
  heroRail: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metricCard: {
    minWidth: 150,
    flexGrow: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: 'rgba(8, 13, 31, 0.62)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  metricLabel: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  metricValue: { color: ds.colors.text, fontSize: 15, fontWeight: '800' },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.cardSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noticeText: { color: ds.colors.textMuted, fontSize: 13, fontWeight: '600' },
  messageBox: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
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
    paddingVertical: 10,
    borderRadius: 16,
  },
  retryBtnText: { color: '#3c1020', fontWeight: '800', fontSize: 12 },
});
