import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { initialsForName } from '../lib/helpers';
import { PlaceSuggestion, Poll, PollOption } from '../types';
import { ds } from './designSystem';

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
      <View style={styles.headerWrap}>
        <View>
          <Text style={styles.eyebrow}>Today&apos;s poll</Text>
          <Text style={styles.pollTitle}>{poll.title}</Text>
        </View>
        {topChoice ? <Text style={styles.leaderTag}>Leading: {topChoice}</Text> : null}
      </View>

      <View style={styles.optionList}>
        {options.length === 0 ? (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyKicker}>Start the board</Text>
            <Text style={styles.emptyText}>Add your first place below. Places stay in your crew workspace while votes reset daily.</Text>
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
                {isVotingThis ? <ActivityIndicator size="small" color={ds.colors.accent} /> : null}
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
          placeholderTextColor={ds.colors.textSoft}
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
          {addingOption ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.addBtnText}>Add place</Text>}
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
    borderRadius: ds.radius.xl,
    padding: ds.spacing.lg,
    backgroundColor: ds.colors.card,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    gap: 14,
  },
  headerWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  eyebrow: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  pollTitle: { color: ds.colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginTop: 3 },
  leaderTag: {
    color: ds.colors.accentStrong,
    fontSize: 11,
    fontWeight: '700',
    borderRadius: ds.radius.pill,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  optionList: { gap: 10 },
  optionCard: {
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.cardMuted,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 10,
  },
  optionMain: { flex: 1, gap: 8 },
  optionHeader: { gap: 3 },
  optionCardActive: { borderColor: ds.colors.accent, backgroundColor: '#edf5f2' },
  optionCardPressed: { transform: [{ scale: 0.987 }], opacity: 0.92 },
  optionDisabled: { opacity: 0.65 },
  optionName: { color: ds.colors.text, fontWeight: '800', fontSize: 16 },
  myVoteTag: { color: ds.colors.accentStrong, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  placeMetaWrap: { gap: 6 },
  placeMetaText: { color: ds.colors.textMuted, fontSize: 11 },
  placeBadgeRow: { flexDirection: 'row', gap: 6 },
  placeBadge: {
    color: ds.colors.text,
    fontSize: 10,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    borderRadius: ds.radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#fffefb',
  },
  linkRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  linkBtn: {
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    borderRadius: ds.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fffefb',
  },
  linkBtnText: { color: ds.colors.text, fontSize: 11, fontWeight: '700' },
  votersWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  voterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: ds.radius.pill,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: '#fffefb',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  voterAvatar: {
    width: 18,
    height: 18,
    borderRadius: ds.radius.pill,
    backgroundColor: '#d6d0c0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voterAvatarText: { color: ds.colors.text, fontSize: 9, fontWeight: '800' },
  voterName: { color: ds.colors.textMuted, fontSize: 11, fontWeight: '600' },
  voteMeta: {
    minWidth: 58,
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: '#fffefb',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    alignSelf: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  voteCount: { color: ds.colors.text, fontWeight: '900', minWidth: 18, textAlign: 'center', fontSize: 18 },
  voteCountLabel: { color: ds.colors.textSoft, fontWeight: '700', fontSize: 10, textTransform: 'uppercase' },
  composerWrap: { flexDirection: 'row', gap: 8, marginTop: 4 },
  input: {
    flex: 1,
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: '#fffefb',
    color: ds.colors.text,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  addBtn: {
    minWidth: 104,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.accentStrong,
    backgroundColor: ds.colors.accent,
    paddingHorizontal: 12,
  },
  addBtnPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  addBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  suggestionsWrap: {
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: '#fffefb',
    overflow: 'hidden',
  },
  suggestHint: { color: ds.colors.textMuted, fontSize: 12, padding: 10 },
  suggestionItem: { paddingHorizontal: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: ds.colors.stroke },
  suggestionName: { color: ds.colors.text, fontSize: 13, fontWeight: '700' },
  suggestionSub: { color: ds.colors.textSoft, fontSize: 11, marginTop: 2 },
  selectedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedText: { color: ds.colors.accentStrong, fontSize: 12, fontWeight: '700' },
  clearText: { color: ds.colors.textMuted, fontSize: 12, fontWeight: '700' },
  emptyInline: { paddingHorizontal: 2, paddingBottom: 2, gap: 4 },
  emptyKicker: { color: ds.colors.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  emptyText: { color: ds.colors.textMuted, fontSize: 12, lineHeight: 18 },
  privacyText: { color: ds.colors.textSoft, fontSize: 11, lineHeight: 16 },
});
