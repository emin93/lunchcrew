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
  onOpenMaps: (optionId: string, url: string) => void;
  onOpenMenu: (optionId: string, url: string) => void;
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
  onOpenMaps,
  onOpenMenu,
  onChangeNewOption,
  onAddOption,
}: Props) {
  const trimmedOption = newOption.trim();
  const canAddOption = !!selectedSuggestion || trimmedOption.length > 0;
  const showSuggestionList = !selectedSuggestion && trimmedOption.length >= 2;
  const showNoResults = showSuggestionList && !loadingSuggestions && suggestions.length === 0;

  return (
    <View style={styles.panel}>
      <View style={styles.headGlow} pointerEvents="none" />
      <View style={styles.headerWrap}>
        <View>
          <Text style={styles.eyebrow}>Today&apos;s vote</Text>
          <Text style={styles.pollTitle}>{poll.title}</Text>
        </View>
        {topChoice ? <Text style={styles.leaderTag}>Leading: {topChoice}</Text> : null}
      </View>

      <View style={styles.optionList}>
        {options.length === 0 ? (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyKicker}>Start the board</Text>
            <Text style={styles.emptyText}>
              Add your first place below. Places stay in your crew workspace while votes reset daily.
            </Text>
            <Text style={styles.privacyText}>Location only improves nearby autocomplete and is never stored.</Text>
          </View>
        ) : null}

        {options.map((opt) => {
          const isActive = myOptionId === opt.id;
          const isVotingThis = votingOptionId === opt.id;
          const mapsUrl = opt.place?.google_maps_url;
          const menuUrl = opt.menu_url || opt.place?.detected_menu_url || opt.place?.website_url;

          return (
            <Pressable
              key={opt.id}
              style={({ pressed }) => [
                styles.optionCard,
                isActive && styles.optionCardActive,
                !!votingOptionId && styles.optionDisabled,
                pressed && !votingOptionId && styles.optionCardPressed,
              ]}
              onPress={() => onVote(opt.id)}
              disabled={!!votingOptionId}
              accessibilityRole="button"
              accessibilityLabel={`Vote for ${opt.name}`}
              accessibilityHint="Double tap to cast your vote"
            >
              <View style={styles.optionMain}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionName}>{opt.name}</Text>
                  {isActive ? <Text style={styles.myVoteTag}>YOUR PICK</Text> : null}
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
                            onOpenMaps(opt.id, mapsUrl);
                            void Linking.openURL(mapsUrl);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Open ${opt.name} in maps`}
                        >
                          <Text style={styles.linkBtnText}>Maps</Text>
                        </Pressable>
                      ) : null}
                      {menuUrl ? (
                        <Pressable
                          style={styles.linkBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            onOpenMenu(opt.id, menuUrl);
                            void Linking.openURL(menuUrl);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Open ${opt.name} menu`}
                        >
                          <Text style={styles.linkBtnText}>Menu</Text>
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
                {isVotingThis ? <ActivityIndicator size="small" color="#67e8f9" /> : null}
                <Text style={styles.voteCount}>{opt.votes}</Text>
                <Text style={styles.voteCountLabel}>votes</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.composerWrap}>
        <TextInput
          style={styles.input}
          placeholder="Suggest a place"
          placeholderTextColor="#7f90bf"
          value={newOption}
          onChangeText={onChangeNewOption}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (canAddOption && !addingOption) onAddOption();
          }}
        />
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            (!canAddOption || addingOption) && styles.optionDisabled,
            pressed && canAddOption && !addingOption && styles.addBtnPressed,
          ]}
          onPress={onAddOption}
          disabled={!canAddOption || addingOption}
          accessibilityRole="button"
          accessibilityLabel="Add place option"
        >
          {addingOption ? <ActivityIndicator size="small" color="#0b1028" /> : <Text style={styles.addBtnText}>Add place</Text>}
        </Pressable>
      </View>

      {selectedSuggestion ? (
        <View style={styles.selectedRow}>
          <Text style={styles.selectedText}>Selected: {selectedSuggestion.name}</Text>
          <Pressable onPress={onClearSuggestion} accessibilityRole="button" accessibilityLabel="Clear selected suggestion">
            <Text style={styles.clearText}>Change</Text>
          </Pressable>
        </View>
      ) : null}

      {showSuggestionList ? (
        <View style={styles.suggestionsWrap}>
          {loadingSuggestions ? <Text style={styles.suggestHint}>Searching places…</Text> : null}
          {showNoResults ? <Text style={styles.suggestHint}>No places found. Try another name or add manually.</Text> : null}
          {suggestions.map((s) => (
            <Pressable key={s.id} style={styles.suggestionItem} onPress={() => onSelectSuggestion(s)} accessibilityRole="button">
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
    borderRadius: 28,
    padding: 16,
    backgroundColor: 'rgba(14,19,44,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.34)',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.34,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    overflow: 'hidden',
  },
  headGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
    top: -160,
    right: -100,
    backgroundColor: 'rgba(34,211,238,0.16)',
  },
  headerWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  eyebrow: { color: '#99aee9', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  pollTitle: { color: '#f8fafc', fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginTop: 3 },
  leaderTag: {
    color: '#cffafe',
    fontSize: 11,
    fontWeight: '800',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.45)',
    backgroundColor: 'rgba(14,116,144,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  optionList: { gap: 10 },
  optionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.45)',
    backgroundColor: 'rgba(15,23,42,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 10,
  },
  optionMain: { flex: 1, gap: 8 },
  optionHeader: { gap: 3 },
  optionCardActive: { borderColor: 'rgba(94,234,212,0.7)', backgroundColor: 'rgba(15,50,62,0.66)' },
  optionCardPressed: { transform: [{ scale: 0.987 }], opacity: 0.92 },
  optionDisabled: { opacity: 0.65 },
  optionName: { color: '#e5edff', fontWeight: '800', fontSize: 16 },
  myVoteTag: { color: '#99f6e4', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  placeMetaWrap: { gap: 6 },
  placeMetaText: { color: '#9ca8c7', fontSize: 11 },
  placeBadgeRow: { flexDirection: 'row', gap: 6 },
  placeBadge: {
    color: '#d6def4',
    fontSize: 10,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.6)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(30,41,59,0.55)',
  },
  linkRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  linkBtn: {
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.45)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(30,41,59,0.65)',
  },
  linkBtnText: { color: '#d9e4ff', fontSize: 11, fontWeight: '800' },
  votersWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  voterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.36)',
    backgroundColor: 'rgba(30,41,59,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  voterAvatar: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voterAvatarText: { color: '#f8fafc', fontSize: 9, fontWeight: '800' },
  voterName: { color: '#d2ddf8', fontSize: 11, fontWeight: '600' },
  voteMeta: {
    minWidth: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.45)',
    backgroundColor: 'rgba(15,23,42,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    alignSelf: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  voteCount: { color: '#f0f7ff', fontWeight: '900', minWidth: 18, textAlign: 'center', fontSize: 18 },
  voteCountLabel: { color: '#8ea2d5', fontWeight: '700', fontSize: 10, textTransform: 'uppercase' },
  composerWrap: { flexDirection: 'row', gap: 8, marginTop: 4 },
  input: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.45)',
    backgroundColor: 'rgba(15,23,42,0.75)',
    color: '#f8fafc',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  addBtn: {
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.7)',
    backgroundColor: '#67e8f9',
    paddingHorizontal: 12,
  },
  addBtnPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  addBtnText: { color: '#0f172a', fontWeight: '900', fontSize: 13 },
  suggestionsWrap: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.5)',
    backgroundColor: 'rgba(15,23,42,0.78)',
    overflow: 'hidden',
  },
  suggestHint: { color: '#9eb0d8', fontSize: 12, padding: 10 },
  suggestionItem: { paddingHorizontal: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(51,65,85,0.75)' },
  suggestionName: { color: '#e5edff', fontSize: 13, fontWeight: '700' },
  suggestionSub: { color: '#a3b2d3', fontSize: 11, marginTop: 2 },
  selectedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedText: { color: '#8cf2ff', fontSize: 12, fontWeight: '700' },
  clearText: { color: '#c3d4ff', fontSize: 12, fontWeight: '700' },
  emptyInline: { paddingHorizontal: 2, paddingBottom: 2, gap: 4 },
  emptyKicker: { color: '#67e8f9', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  emptyText: { color: '#a8b4d6', fontSize: 12, lineHeight: 18 },
  privacyText: { color: '#7a8bb8', fontSize: 11, lineHeight: 16 },
});
