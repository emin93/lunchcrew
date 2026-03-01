import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Poll, PollOption } from '../types';

type Props = {
  poll: Poll;
  options: PollOption[];
  myOptionId: string | null;
  votingOptionId: string | null;
  addingOption: boolean;
  newOption: string;
  topChoice?: string;
  onVote: (id: string) => void;
  onChangeNewOption: (v: string) => void;
  onAddOption: () => void;
};

export function PollPanel({
  poll,
  options,
  myOptionId,
  votingOptionId,
  addingOption,
  newOption,
  topChoice,
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
          return (
            <Pressable
              key={opt.id}
              style={[styles.optionCard, isActive && styles.optionCardActive, !!votingOptionId && styles.optionDisabled]}
              onPress={() => onVote(opt.id)}
              disabled={!!votingOptionId}
            >
              <View>
                <Text style={styles.optionName}>{opt.name}</Text>
                {isActive ? <Text style={styles.myVoteTag}>Your vote</Text> : null}
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
    alignItems: 'center',
  },
  optionCardActive: { borderColor: '#22c55e', backgroundColor: '#052e1d' },
  optionDisabled: { opacity: 0.65 },
  optionName: { color: '#e2e8f0', fontWeight: '700', fontSize: 15 },
  myVoteTag: { color: '#86efac', fontSize: 11, marginTop: 2, fontWeight: '700' },
  voteMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voteCount: { color: '#cbd5e1', fontWeight: '700', minWidth: 18, textAlign: 'right' },
  addWrap: { flexDirection: 'row', gap: 8, marginTop: 2 },
  input: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    color: '#f8fafc',
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
});
