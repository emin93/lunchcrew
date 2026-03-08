import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { PollPanel } from '../../src/components/PollPanel';
import { useAppStateContext } from '../../src/state/AppStateContext';
import { trackEvent } from '../../src/lib/analytics';

export default function VoteScreen() {
  const state = useAppStateContext();

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.flex} contentContainerStyle={[styles.scrollContent, Platform.OS === 'web' && styles.scrollContentWeb]} keyboardShouldPersistTaps="handled">
        <View style={styles.maxWidthWrap}>
          <View style={styles.hero}>
            <Text style={styles.kicker}>Lunch planning, simplified</Text>
            <Text style={styles.title}>LunchCrew</Text>
            <Text style={styles.subtitle}>Pick a spot in seconds with your team.</Text>
            {!!state.workspace && <Text style={styles.crew}>Crew: {state.workspace.name} · {state.workspace.invite_code}</Text>}
            <Text style={styles.buildLabel}>{state.BUILD_LABEL}</Text>
          </View>

          {state.loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#22d3ee" />
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
              onOpenMaps={(optionId, url) => void trackEvent('maps_opened', { option_id: optionId, poll_id: state.poll!.id, workspace_id: state.workspace?.id, url }, state.deviceId)}
              onOpenMenu={(optionId, url) => void trackEvent('menu_opened', { option_id: optionId, poll_id: state.poll!.id, workspace_id: state.workspace?.id, url }, state.deviceId)}
              onChangeNewOption={(v) => {
                state.setSelectedSuggestion(null);
                state.setNewOption(v);
              }}
              onAddOption={state.addOption}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16, gap: 14 },
  scrollContentWeb: { minHeight: '100dvh' as any },
  maxWidthWrap: { width: '100%', maxWidth: 1024, alignSelf: 'center', gap: 14 },
  hero: { borderRadius: 20, padding: 18, backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1e293b' },
  kicker: { color: '#22d3ee', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: '#f8fafc', fontSize: 34, fontWeight: '800', marginTop: 2 },
  subtitle: { color: '#94a3b8', fontSize: 14, marginTop: 2 },
  crew: { color: '#cbd5e1', fontSize: 12, marginTop: 6, fontWeight: '700' },
  buildLabel: { color: '#475569', fontSize: 11, marginTop: 8, fontWeight: '600' },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  loadingText: { color: '#67e8f9', fontSize: 13 },
  errorBox: { borderRadius: 14, borderWidth: 1, borderColor: '#7f1d1d', backgroundColor: '#2b1014', padding: 12, gap: 8 },
  errorTitle: { color: '#fecaca', fontWeight: '800' },
  errorText: { color: '#fca5a5', fontSize: 13 },
  retryBtn: { alignSelf: 'flex-start', backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  retryBtnText: { color: '#fff', fontWeight: '700' },
});
