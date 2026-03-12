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
  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <View style={styles.panel}>
      <View style={styles.boardHeader}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Live floor</Text>
          <Text style={styles.pollTitle}>{poll.title}</Text>
          <Text style={styles.pollSubtitle}>A newsroom-style ballot: ranking on the left, facts in the middle, action on the right.</Text>
        </View>

        <View style={styles.statusCluster}>
          <View style={styles.statusChip}>
            <Text style={styles.statusLabel}>Votes cast</Text>
            <Text style={styles.statusValue}>{totalVotes}</Text>
          </View>
          <View style={[styles.statusChip, styles.statusChipAccent]}>
            <Text style={styles.statusLabel}>Front runner</Text>
            <Text style={styles.statusValue} numberOfLines={2}>{topChoice || 'Waiting for first vote'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.stage}>
        <View style={styles.stageRail}>
          <Text style={styles.stageRailLabel}>Ballot order</Text>
          {options.length === 0 ? (
            <View style={styles.emptyStageCard}>
              <Text style={styles.emptyStageTitle}>Open board</Text>
              <Text style={styles.emptyStageText}>No places are live yet. Seed the ballot below and the board will start ranking immediately.</Text>
            </View>
          ) : (
            options.map((opt, index) => {
              const isActive = myOptionId === opt.id;
              const isVotingThis = votingOptionId === opt.id;
              const mapsUrl = opt.place?.google_maps_url;
              const menuUrl = opt.menu_url || opt.place?.detected_menu_url || opt.place?.website_url;
              const leader = index === 0;

              return (
                <Pressable
                  key={opt.id}
                  style={({ pressed }) => [
                    styles.optionCard,
                    leader && styles.optionCardLeader,
                    isActive && styles.optionCardActive,
                    !!votingOptionId && styles.optionDisabled,
                    pressed && !votingOptionId && styles.optionCardPressed,
                  ]}
                  onPress={() => onVote(opt.id)}
                  disabled={!!votingOptionId}
                  accessibilityRole="button"
                  accessibilityLabel={`Vote for ${opt.name}`}
                >
                  <View style={styles.rankColumn}>
                    <Text style={styles.rankPrefix}>{leader ? 'Lead' : `#${index + 1}`}</Text>
                    <View style={[styles.voteDial, isActive && styles.voteDialActive]}>
                      {isVotingThis ? <ActivityIndicator size="small" color={ds.colors.accent} /> : <Text style={styles.voteDialValue}>{opt.votes}</Text>}
                      <Text style={styles.voteDialLabel}>{opt.votes === 1 ? 'vote' : 'votes'}</Text>
                    </View>
                  </View>

                  <View style={styles.optionBody}>
                    <View style={styles.optionHeading}>
                      <View style={styles.nameWrap}>
                        <View style={styles.nameRow}>
                          <Text style={styles.optionName}>{opt.name}</Text>
                          {isActive ? <Text style={styles.liveTag}>Your vote</Text> : null}
                        </View>
                        {opt.place?.formatted_address ? <Text style={styles.address}>{opt.place.formatted_address}</Text> : null}
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      {typeof opt.place?.rating === 'number' ? <Text style={[styles.metaChip, styles.metaChipGold]}>★ {opt.place.rating.toFixed(1)}</Text> : null}
                      {priceLabel(opt.place?.price_level) ? <Text style={styles.metaChip}>{priceLabel(opt.place?.price_level)}</Text> : null}
                      {mapsUrl ? (
                        <Pressable
                          style={styles.linkChip}
                          onPress={(e) => {
                            e.stopPropagation();
                            onOpenMaps(opt.id, mapsUrl);
                            void Linking.openURL(mapsUrl);
                          }}
                        >
                          <Text style={styles.linkChipText}>Maps</Text>
                        </Pressable>
                      ) : null}
                      {menuUrl ? (
                        <Pressable
                          style={styles.linkChip}
                          onPress={(e) => {
                            e.stopPropagation();
                            onOpenMenu(opt.id, menuUrl);
                            void Linking.openURL(menuUrl);
                          }}
                        >
                          <Text style={styles.linkChipText}>Menu</Text>
                        </Pressable>
                      ) : null}
                    </View>

                    {opt.voters.length > 0 ? (
                      <View style={styles.votersRow}>
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
                      <Text style={styles.noVotesText}>Still quiet. First vote changes the whole board.</Text>
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        <View style={styles.composerColumn}>
          <View style={styles.composerCard}>
            <View style={styles.composerHeader}>
              <View>
                <Text style={styles.composerEyebrow}>Assignment desk</Text>
                <Text style={styles.composerTitle}>Add another contender</Text>
              </View>
              {selectedSuggestion ? (
                <Pressable onPress={onClearSuggestion} style={styles.clearPill}>
                  <Text style={styles.clearPillText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Search nearby or type manually"
              placeholderTextColor={ds.colors.textSoft}
              value={newOption}
              onChangeText={onChangeNewOption}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (canAddOption && !addingOption) onAddOption();
              }}
            />

            {selectedSuggestion ? (
              <View style={styles.selectedCard}>
                <Text style={styles.selectedLabel}>Selected place</Text>
                <Text style={styles.selectedValue}>{selectedSuggestion.name}</Text>
              </View>
            ) : (
              <Text style={styles.composerHint}>Location is only used to improve suggestions and is never stored.</Text>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                (!canAddOption || addingOption) && styles.optionDisabled,
                pressed && canAddOption && !addingOption && styles.buttonPressed,
              ]}
              onPress={onAddOption}
              disabled={!canAddOption || addingOption}
            >
              {addingOption ? <ActivityIndicator size="small" color="#07111f" /> : <Text style={styles.primaryButtonText}>Publish to ballot</Text>}
            </Pressable>

            {showSuggestionList ? (
              <View style={styles.suggestionsWrap}>
                {loadingSuggestions ? <Text style={styles.suggestHint}>Searching places…</Text> : null}
                {showNoResults ? <Text style={styles.suggestHint}>No suggested places yet. You can still add it manually.</Text> : null}
                {suggestions.map((s, index) => (
                  <Pressable key={s.id} style={[styles.suggestionRow, index === suggestions.length - 1 && styles.suggestionRowLast]} onPress={() => onSelectSuggestion(s)}>
                    <View style={styles.suggestionCopy}>
                      <Text style={styles.suggestionName}>{s.name}</Text>
                      {s.secondaryText ? <Text style={styles.suggestionSub}>{s.secondaryText}</Text> : null}
                    </View>
                    <Text style={styles.suggestionAction}>Queue</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </View>
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
    gap: 22,
    ...ds.shadow.card,
  },
  boardHeader: { gap: 16 },
  headerCopy: { gap: 8 },
  eyebrow: { color: ds.colors.accent, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  pollTitle: { color: ds.colors.text, fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -0.9 },
  pollSubtitle: { color: ds.colors.textMuted, fontSize: 14, lineHeight: 21, maxWidth: 680 },
  statusCluster: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusChip: {
    minWidth: 170,
    flexGrow: 1,
    borderRadius: 20,
    backgroundColor: ds.colors.panel,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    padding: 14,
    gap: 4,
  },
  statusChipAccent: { backgroundColor: ds.colors.accentSoft, borderColor: ds.colors.accentSoftStrong },
  statusLabel: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  statusValue: { color: ds.colors.text, fontSize: 18, lineHeight: 23, fontWeight: '900' },
  stage: { gap: 16 },
  stageRail: { gap: 12 },
  stageRailLabel: { color: ds.colors.textSoft, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  optionCard: {
    borderRadius: 28,
    padding: 16,
    backgroundColor: ds.colors.cardMuted,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    gap: 14,
  },
  optionCardLeader: { backgroundColor: 'rgba(31, 48, 34, 0.95)', borderColor: ds.colors.accentSoftStrong },
  optionCardActive: { borderColor: ds.colors.gold, backgroundColor: 'rgba(42, 36, 18, 0.92)' },
  optionCardPressed: { transform: [{ scale: 0.992 }], opacity: 0.96 },
  optionDisabled: { opacity: 0.62 },
  rankColumn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rankPrefix: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.9 },
  voteDial: {
    minWidth: 90,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.input,
  },
  voteDialActive: { borderColor: ds.colors.gold, backgroundColor: ds.colors.goldSoft },
  voteDialValue: { color: ds.colors.text, fontSize: 24, fontWeight: '900' },
  voteDialLabel: { color: ds.colors.textSoft, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  optionBody: { gap: 10 },
  optionHeading: { gap: 6 },
  nameWrap: { gap: 4 },
  nameRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  optionName: { color: ds.colors.text, fontSize: 21, lineHeight: 26, fontWeight: '900', flexShrink: 1 },
  liveTag: { color: ds.colors.gold, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  address: { color: ds.colors.textMuted, fontSize: 13, lineHeight: 19 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: {
    color: ds.colors.text,
    fontSize: 11,
    fontWeight: '800',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.input,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaChipGold: { backgroundColor: ds.colors.goldSoft, borderColor: 'rgba(246, 212, 122, 0.24)' },
  linkChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ds.colors.accentSoftStrong,
    backgroundColor: ds.colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  linkChipText: { color: ds.colors.text, fontSize: 11, fontWeight: '800' },
  votersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  voterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.input,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  voterAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ds.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voterAvatarText: { color: ds.colors.text, fontSize: 9, fontWeight: '900' },
  voterName: { color: ds.colors.textMuted, fontSize: 11, fontWeight: '700' },
  noVotesText: { color: ds.colors.textSoft, fontSize: 12, fontWeight: '600' },
  composerColumn: { gap: 12 },
  composerCard: {
    borderRadius: 30,
    backgroundColor: ds.colors.panel,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    padding: 18,
    gap: 14,
  },
  composerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  composerEyebrow: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  composerTitle: { color: ds.colors.text, fontSize: 22, fontWeight: '900' },
  clearPill: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.input,
  },
  clearPillText: { color: ds.colors.textMuted, fontSize: 12, fontWeight: '800' },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.input,
    color: ds.colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  composerHint: { color: ds.colors.textSoft, fontSize: 12, lineHeight: 18 },
  selectedCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: ds.colors.accentSoft,
    borderWidth: 1,
    borderColor: ds.colors.accentSoftStrong,
    gap: 4,
  },
  selectedLabel: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  selectedValue: { color: ds.colors.text, fontSize: 14, fontWeight: '800' },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: ds.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...ds.shadow.glow,
  },
  primaryButtonText: { color: '#07111f', fontSize: 14, fontWeight: '900' },
  buttonPressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },
  suggestionsWrap: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.input,
    overflow: 'hidden',
  },
  suggestHint: { color: ds.colors.textMuted, fontSize: 12, padding: 12 },
  suggestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.stroke,
  },
  suggestionRowLast: { borderBottomWidth: 0 },
  suggestionCopy: { flex: 1 },
  suggestionName: { color: ds.colors.text, fontSize: 14, fontWeight: '800' },
  suggestionSub: { color: ds.colors.textSoft, fontSize: 11, marginTop: 2 },
  suggestionAction: { color: ds.colors.accent, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  emptyStageCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.cardSoft,
    padding: 18,
    gap: 6,
  },
  emptyStageTitle: { color: ds.colors.text, fontSize: 18, fontWeight: '900' },
  emptyStageText: { color: ds.colors.textMuted, fontSize: 13, lineHeight: 19 },
});
