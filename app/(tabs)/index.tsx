import { Platform, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PollPanel } from '../../src/components/PollPanel';
import { useAppStateContext } from '../../src/state/AppStateContext';
import { trackEvent } from '../../src/lib/analytics';

export default function VoteScreen() {
  const state = useAppStateContext();

  return (
    <View style={styles.flex}>
      <View style={styles.bgGlowOne} pointerEvents="none" />
      <View style={styles.bgGlowTwo} pointerEvents="none" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical={false}
        bounces={false}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.maxWidthWrap}>
          <LinearGradient colors={['#1a2150', '#131a3a', '#0f132a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Text style={styles.kicker}>Live lunch pulse</Text>
            <Text style={styles.title}>Vote in seconds</Text>
            <Text style={styles.subtitle}>No thread chaos. Quick team consensus.</Text>

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
          </LinearGradient>

          {state.loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#6ee7ff" />
              <Text style={styles.loadingText}>Syncing crew...</Text>
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
  scrollContent: { flexGrow: 1, padding: 16, paddingBottom: 12, gap: 14 },
  maxWidthWrap: { width: '100%', maxWidth: 1024, alignSelf: 'center', gap: 14 },
  hero: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(129,149,255,0.4)',
    shadowColor: '#020617',
    shadowOpacity: 0.34,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  kicker: { color: '#92f8ff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.1 },
  title: { color: '#f8fafc', fontSize: 34, fontWeight: '900', marginTop: 4, letterSpacing: -0.8 },
  subtitle: { color: '#c0cdef', fontSize: 14, marginTop: 3, lineHeight: 20 },
  metricRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(122,142,255,0.45)',
    backgroundColor: 'rgba(16,24,55,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metricLabel: { color: '#9fb1df', fontSize: 10, fontWeight: '700', marginBottom: 2 },
  metricValue: { color: '#eff4ff', fontSize: 12, fontWeight: '900' },
  buildLabel: { color: '#7787b0', fontSize: 11, marginTop: 10, fontWeight: '700' },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  loadingText: { color: '#9ae5ff', fontSize: 13 },
  errorBox: { borderRadius: 14, borderWidth: 1, borderColor: '#7f1d1d', backgroundColor: '#2b1014', padding: 12, gap: 8 },
  errorTitle: { color: '#fecaca', fontWeight: '800' },
  errorText: { color: '#fca5a5', fontSize: 13 },
  retryBtn: { alignSelf: 'flex-start', backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  retryBtnText: { color: '#fff', fontWeight: '700' },
  bgGlowOne: {
    position: 'absolute',
    top: -100,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(56,189,248,0.16)',
  },
  bgGlowTwo: {
    position: 'absolute',
    top: 60,
    right: -90,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(139,92,246,0.14)',
  },
});
