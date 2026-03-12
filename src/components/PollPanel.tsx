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
        <View style={styles.headerContent}>
          <Text style={styles.eyebrow}>Today&apos;s poll</Text>
          <Text style={styles.pollTitle}>{poll.title}</Text>
          <Text style={styles.pollSubtitle}>Tap a place to cast your vote. Add a new option below if the perfect lunch spot isn’t listed yet.</Text>
        </View>
        {topChoice ? <View style={styles.leaderTag}><Text style={styles.leaderTagText}>Leading • {topChoice}</Text></View> : null}
      </View>

      <View style={styles.optionList}>
        {options.length === 0 ? (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyKicker}>Start the board</Text>
            <Text style={styles.emptyTitle}>No places yet.</Text>
            <Text style={styles.emptyText}>Add the first option below. Your crew’s place list sticks around while votes reset daily.</Text>
            <Text style={styles.privacyText}>Location only improves autocomplete and is never stored.</Text>
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
              <View style={styles.voteRail}>
                {isVotingThis ? <ActivityIndicator size="small" color={ds.colors.accent} /> : <Text style={styles.voteCount}>{opt.votes}</Text>}
                <Text style={styles.voteCountLabel}>{opt.votes === 1 ? 'vote' : 'votes'}</Text>
              </View>

              <View style={styles.optionMain}>
                <View style={styles.optionHeader}>
                  <View style={styles.titleWrap}>
                    <Text style={styles.optionName}>{opt.name}</Text>
                    {isActive ? <Text style={styles.myVoteTag}>Your pick</Text> : null}
                  </View>
                </View>

                {opt.place ? (
                  <View style={styles.placeMetaWrap}>
                    {opt.place.formatted_address ? <Text style={styles.placeMetaText}>{opt.place.formatted_address}</Text> : null}
                    <View style={styles.placeBadgeRow}>
                      {typeof opt.place.rating === 'number' ? <Text style={[styles.placeBadge, styles.ratingBadge]}>★ {opt.place.rating.toFixed(1)}</Text> : null}
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
                          <Text style={styles.linkBtnText}>Open maps</Text>
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
                          <Text style={styles.linkBtnText}>View menu</Text>
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
                ) : (
                  <Text style={styles.noVotesText}>No votes yet — be first.</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.composerSection}>
        <View style={styles.composerHeader}>
          <View>
            <Text style={styles.composerKicker}>Add a contender</Text>
            <Text style={styles.composerTitle}>Suggest a new lunch spot</Text>
          </View>
          {selectedSuggestion ? (
            <Pressable onPress={onClearSuggestion} accessibilityRole="button" accessibilityLabel="Clear selected suggestion">
              <Text style={styles.clearText}>Change selection</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.composerWrap}>
          <TextInput
            style={styles.input}
            placeholder="Search or type a place name"
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
            {addingOption ? <ActivityIndicator size="small" color="#10182f" /> : <Text style={styles.addBtnText}>Add place</Text>}
          </Pressable>
        </View>

        {selectedSuggestion ? (
          <View style={styles.selectedRow}>
            <Text style={styles.selectedLabel}>Selected</Text>
            <Text style={styles.selectedText}>{selectedSuggestion.name}</Text>
          </View>
        ) : null}

        {showSuggestionList ? (
          <View style={styles.suggestionsWrap}>
            {loadingSuggestions ? <Text style={styles.suggestHint}>Searching places…</Text> : null}
            {showNoResults ? <Text style={styles.suggestHint}>No places found. Try another name or add it manually.</Text> : null}
            {suggestions.map((s, index) => (
              <Pressable key={s.id} style={[styles.suggestionItem, index === suggestions.length - 1 && styles.suggestionItemLast]} onPress={() => onSelectSuggestion(s)} accessibilityRole="button">
                <View style={styles.suggestionTextWrap}>
                  <Text style={styles.suggestionName}>{s.name}</Text>
                  {s.secondaryText ? <Text style={styles.suggestionSub}>{s.secondaryText}</Text> : null}
                </View>
                <Text style={styles.suggestionAction}>Use</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
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
    gap: 20,
    ...ds.shadow.card,
  },
  headerWrap: { gap: 12 },
  headerContent: { gap: 6 },
  eyebrow: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  pollTitle: { color: ds.colors.text, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.8 },
  pollSubtitle: { color: ds.colors.textMuted, fontSize: 14, lineHeight: 21, maxWidth: 620 },
  leaderTag: {
    alignSelf: 'flex-start',
    borderRadius: ds.radius.pill,
    borderWidth: 1,
    borderColor: ds.colors.accentSoftStrong,
    backgroundColor: ds.colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leaderTagText: { color: ds.colors.text, fontSize: 12, fontWeight: '800' },
  optionList: { gap: 12 },
  optionCard: {
    borderRadius: ds.radius.xl,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.cardMuted,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
  },
  optionMain: { flex: 1, gap: 10 },
  optionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  titleWrap: { flex: 1, gap: 4 },
  optionCardActive: { borderColor: ds.colors.accentSoftStrong, backgroundColor: 'rgba(32, 43, 84, 0.98)' },
  optionCardPressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
  optionDisabled: { opacity: 0.65 },
  voteRail: {
    width: 72,
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: 'rgba(7, 12, 28, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  voteCount: { color: ds.colors.text, fontWeight: '900', minWidth: 18, textAlign: 'center', fontSize: 24 },
  voteCountLabel: { color: ds.colors.textSoft, fontWeight: '800', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.7 },
  optionName: { color: ds.colors.text, fontWeight: '900', fontSize: 19, lineHeight: 23 },
  myVoteTag: { color: ds.colors.teal, fontSize: 11, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
  placeMetaWrap: { gap: 8 },
  placeMetaText: { color: ds.colors.textMuted, fontSize: 12, lineHeight: 18 },
  placeBadgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  placeBadge: {
    color: ds.colors.text,
    fontSize: 11,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    borderRadius: ds.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: ds.colors.input,
  },
  ratingBadge: { backgroundColor: ds.colors.goldSoft, borderColor: 'rgba(255, 207, 112, 0.24)' },
  linkRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  linkBtn: {
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    borderRadius: ds.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: ds.colors.input,
  },
  linkBtnText: { color: ds.colors.text, fontSize: 12, fontWeight: '800' },
  votersWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  voterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: ds.radius.pill,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.input,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  voterAvatar: {
    width: 20,
    height: 20,
    borderRadius: ds.radius.pill,
    backgroundColor: ds.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voterAvatarText: { color: ds.colors.text, fontSize: 9, fontWeight: '900' },
  voterName: { color: ds.colors.textMuted, fontSize: 11, fontWeight: '700' },
  noVotesText: { color: ds.colors.textSoft, fontSize: 12, fontWeight: '600' },
  composerSection: {
    borderRadius: ds.radius.xl,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: 'rgba(8, 13, 31, 0.44)',
    padding: 16,
    gap: 12,
  },
  composerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  composerKicker: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  composerTitle: { color: ds.colors.text, fontSize: 18, fontWeight: '800', marginTop: 2 },
  composerWrap: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.input,
    color: ds.colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  addBtn: {
    minWidth: 116,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.accent,
    paddingHorizontal: 14,
    ...ds.shadow.glow,
  },
  addBtnPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  addBtnText: { color: '#10182f', fontWeight: '900', fontSize: 13 },
  suggestionsWrap: {
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.input,
    overflow: 'hidden',
  },
  suggestHint: { color: ds.colors.textMuted, fontSize: 12, padding: 12 },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.stroke,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  suggestionItemLast: { borderBottomWidth: 0 },
  suggestionTextWrap: { flex: 1 },
  suggestionName: { color: ds.colors.text, fontSize: 14, fontWeight: '800' },
  suggestionSub: { color: ds.colors.textSoft, fontSize: 11, marginTop: 2 },
  suggestionAction: { color: ds.colors.teal, fontSize: 12, fontWeight: '800' },
  selectedRow: {
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.accentSoftStrong,
    backgroundColor: ds.colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  selectedLabel: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  selectedText: { color: ds.colors.text, fontSize: 13, fontWeight: '800' },
  clearText: { color: ds.colors.textMuted, fontSize: 12, fontWeight: '800' },
  emptyInline: {
    borderRadius: ds.radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: ds.colors.strokeStrong,
    backgroundColor: 'rgba(8, 13, 31, 0.36)',
    padding: 16,
    gap: 6,
  },
  emptyKicker: { color: ds.colors.teal, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  emptyTitle: { color: ds.colors.text, fontSize: 20, fontWeight: '900' },
  emptyText: { color: ds.colors.textMuted, fontSize: 13, lineHeight: 19 },
  privacyText: { color: ds.colors.textSoft, fontSize: 12, lineHeight: 18 },
});
