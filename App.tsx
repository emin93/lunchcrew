import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type PlaceOption = { id: string; name: string; votes: number };

const starterPlaces: PlaceOption[] = [
  { id: '1', name: 'Taco Spot', votes: 0 },
  { id: '2', name: 'Poke Bowl House', votes: 0 },
  { id: '3', name: 'Sushi Corner', votes: 0 },
];

export default function App() {
  const [workspaceName, setWorkspaceName] = useState('LunchCrew HQ');
  const [inviteCode] = useState('LUNCH-CREW-2026');
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [places, setPlaces] = useState(starterPlaces);
  const [newPlace, setNewPlace] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  const topChoice = useMemo(
    () => [...places].sort((a, b) => b.votes - a.votes)[0],
    [places],
  );

  const onJoin = () => {
    if (!name.trim()) return;
    setJoined(true);
  };

  const addPlace = () => {
    const trimmed = newPlace.trim();
    if (!trimmed) return;

    setPlaces((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), name: trimmed, votes: 0 },
    ]);
    setNewPlace('');
  };

  const voteForPlace = (id: string) => {
    if (hasVoted) return;

    setPlaces((prev) =>
      prev.map((place) =>
        place.id === id ? { ...place, votes: place.votes + 1 } : place,
      ),
    );
    setHasVoted(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🍽️ LunchCrew</Text>
        <Text style={styles.subtitle}>Plan office lunch in under 60 seconds.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Workspace</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={workspaceName}
            onChangeText={setWorkspaceName}
            placeholder="Workspace name"
            placeholderTextColor="#8d98a8"
          />
          <Text style={styles.hint}>Open invite code: {inviteCode}</Text>
        </View>

        {!joined ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Join Lunch Poll</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#8d98a8"
            />
            <Pressable style={styles.primaryButton} onPress={onJoin}>
              <Text style={styles.primaryButtonText}>Join Now</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today’s Poll (12:30 PM)</Text>
            <Text style={styles.hint}>Hey {name}, pick one place for lunch.</Text>

            {places.map((place) => (
              <Pressable
                key={place.id}
                style={styles.voteRow}
                onPress={() => voteForPlace(place.id)}
              >
                <Text style={styles.voteLabel}>{place.name}</Text>
                <Text style={styles.voteCount}>{place.votes} votes</Text>
              </Pressable>
            ))}

            <View style={styles.addRow}>
              <TextInput
                style={[styles.input, styles.addInput]}
                value={newPlace}
                onChangeText={setNewPlace}
                placeholder="Add place"
                placeholderTextColor="#8d98a8"
              />
              <Pressable style={styles.secondaryButton} onPress={addPlace}>
                <Text style={styles.secondaryButtonText}>Add</Text>
              </Pressable>
            </View>

            <Text style={styles.result}>
              Current top choice: {topChoice?.name ?? 'No options yet'}
            </Text>
            {hasVoted && (
              <Text style={styles.success}>✅ Vote saved. See you at lunch.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  container: {
    padding: 18,
    gap: 16,
  },
  title: {
    color: '#f8fafc',
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: '#cbd5e1',
    marginTop: -8,
    fontSize: 15,
  },
  card: {
    backgroundColor: '#111b2e',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#22304a',
    gap: 10,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#26334f',
    color: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hint: {
    color: '#93c5fd',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#eff6ff',
    fontWeight: '700',
  },
  voteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26334f',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  voteLabel: {
    color: '#e2e8f0',
    fontWeight: '600',
  },
  voteCount: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addInput: {
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#f1f5f9',
    fontWeight: '700',
  },
  result: {
    color: '#dbeafe',
    marginTop: 2,
  },
  success: {
    color: '#86efac',
    fontWeight: '600',
  },
});
