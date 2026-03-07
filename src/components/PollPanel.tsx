import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { initialsForName } from '../lib/helpers';
import { PlaceSuggestion, Poll, PollOption } from '../types';

type Props = {
  poll: Poll;
  options: PollOption[];
  myOptionId: string | null;
  votingOptionId: string | null;
  addingOption: boolean;
  newOption: string;
  topChoice?: string;
  suggestions: PlaceSuggestion[];
  loadingSuggestions: boolean;
  selectedSuggestion: PlaceSuggestion | null;
  onSelectSuggestion: (s: PlaceSuggestion) => void;
  onClearSuggestion: () => void;
  onVote: (id: string) => void;
  onChangeNewOption: (v: string) => void;
  onAddOption: () => void;
};

function priceLabel(priceLevel?: number | null) {
  if (typeof priceLevel !== 'number' || priceLevel < 0) return '';
  return '$'.repeat(Math.max(1, Math.min(4, priceLevel)));
}

export function PollPanel({
  poll,
  options,
  myOptionId,
  votingOptionId,
  addingOption,
  newOption,
  topChoice,
  suggestions,
  loadingSuggestions,
  selectedSuggestion,
  onSelectSuggestion,
  onClearSuggestion,
  onVote,
  onChangeNewOption,
  onAddOption,
}: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.rowBetween}>
        <Text style={styles.pollTitle}>{poll.title}</Text>
        {topChoice ? <Text style={styles.leaderTag}>Top: {topChoice}</Text> : null}
      </View>

      <View style={styles.optionList}>
        {options.map((opt) => {
          const isActive = myOptionId === opt.id;
          const isVotingThis = votingOptionId === opt.id;
          const mapsUrl = opt.place?.google_maps_url;
          const menuUrl = opt.menu_url || opt.place?.detected_menu_url || opt.place?.website_url;
          return (
            <Pressable
              key={opt.id}
              style={[styles.optionCard, isActive && styles.optionCardActive, !!votingOptionId && styles.optionDisabled]}
              onPress={() => onVote(opt.id)}
              disabled={!!votingOptionId}
            >
              <View style={styles.optionMain}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionName}>{opt.name}</Text>
                  {isActive ? <Text style={styles.myVoteTag}>Your vote</Text> : null}
                </View>

                {opt.place ? (
                  <View style={styles.placeMetaWrap}>
                    {opt.place.formatted_address ? <Text style={styles.placeMetaText}>{opt.place.formatted_address}</Text> : null}
                    <View style={styles.placeBadgeRow}>
                      {typeof opt.place.rating === 'number' ? <Text style={styles.placeBadge}>⭐ {opt.place.rating.toFixed(1)}</Text> : null}
                      {priceLabel(opt.place.price_level) ? <Text style={styles.placeBadge}>{priceLabel(opt.place.price_level)}</Text> : null}
                    </View>
                    <View style={styles.linkRow}>
                      {mapsUrl ? (
                        <Pressable
                          style={styles.linkBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            void Linking.openURL(mapsUrl);
                          }}
                        >
                          <Text style={styles.linkBtnText}>Open Maps</Text>
                        </Pressable>
                      ) : null}
                      {menuUrl ? (
                        <Pressable
                          style={styles.linkBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            void Linking.openURL(menuUrl);
                          }}
                        >
                          <Text style={styles.linkBtnText}>View Menu</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ) : null}

                {opt.voters.length > 0 ? (
                  <View style={styles.votersWrap}>
                    {opt.voters.map((voter, idx) => (
                      <View key={`${opt.id}-${voter}-${idx}`} style={styles.voterChip}>
                        <View style={styles.voterAvatar}>
                          <Text style={styles.voterAvatarText}>{initialsForName(voter)}</Text>
                        </View>
                        <Text style={styles.voterName}>{voter}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>

              <View style={styles.voteMeta}>
                {isVotingThis ? <ActivityIndicator size="small" color="#22d3ee" /> : null}
                <Text style={styles.voteCount}>{opt.votes}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.addWrap}>
        <TextInput
          style={styles.input}
          placeholder="Suggest a place"
          placeholderTextColor="#64748b"
          value={newOption}
          onChangeText={onChangeNewOption}
        />
        <Pressable style={[styles.addBtn, addingOption && styles.optionDisabled]} onPress={onAddOption} disabled={addingOption}>
          {addingOption ? <ActivityIndicator size="small" color="#071018" /> : <Text style={styles.addBtnText}>Add</Text>}
        </Pressable>
      </View>

      {selectedSuggestion ? (
        <View style={styles.selectedRow}>
          <Text style={styles.selectedText}>Selected: {selectedSuggestion.name}</Text>
          <Pressable onPress={onClearSuggestion}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        </View>
      ) : null}

      {!selectedSuggestion && (loadingSuggestions || suggestions.length > 0) ? (
        <View style={styles.suggestionsWrap}>
          {loadingSuggestions ? <Text style={styles.suggestHint}>Searching places…</Text> : null}
          {suggestions.map((s) => (
            <Pressable key={s.id} style={styles.suggestionItem} onPress={() => onSelectSuggestion(s)}>
              <Text style={styles.suggestionName}>{s.name}</Text>
              {s.secondaryText ? <Text style={styles.suggestionSub}>{s.secondaryText}</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  pollTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  leaderTag: { color: '#c4b5fd', fontSize: 12, fontWeight: '700' },
  optionList: { gap: 8 },
  optionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  optionMain: { flex: 1, gap: 8 },
  optionHeader: { gap: 2 },
  optionCardActive: { borderColor: '#22c55e', backgroundColor: '#052e1d' },
  optionDisabled: { opacity: 0.65 },
  optionName: { color: '#e2e8f0', fontWeight: '700', fontSize: 15 },
  myVoteTag: { color: '#86efac', fontSize: 11, marginTop: 2, fontWeight: '700' },
  placeMetaWrap: { gap: 6 },
  placeMetaText: { color: '#94a3b8', fontSize: 11 },
  placeBadgeRow: { flexDirection: 'row', gap: 6 },
  placeBadge: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  linkRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  linkBtn: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#111827',
  },
  linkBtnText: { color: '#67e8f9', fontSize: 11, fontWeight: '700' },
  votersWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  voterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0b1220',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  voterAvatar: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voterAvatarText: { color: '#e2e8f0', fontSize: 9, fontWeight: '800' },
  voterName: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  voteMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 2 },
  voteCount: { color: '#cbd5e1', fontWeight: '700', minWidth: 18, textAlign: 'right' },
  addWrap: { flexDirection: 'row', gap: 8, marginTop: 2 },
  input: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    color: '#f8fafc',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addBtn: {
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#22d3ee',
    paddingHorizontal: 12,
  },
  addBtnText: { color: '#0f172a', fontWeight: '800' },
  suggestionsWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    overflow: 'hidden',
  },
  suggestHint: { color: '#94a3b8', fontSize: 12, padding: 10 },
  suggestionItem: { paddingHorizontal: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  suggestionName: { color: '#e2e8f0', fontSize: 13, fontWeight: '700' },
  suggestionSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  selectedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedText: { color: '#67e8f9', fontSize: 12, fontWeight: '700' },
  clearText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
});
