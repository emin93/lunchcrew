import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ONBOARDING_SLIDES } from '../types';

type Props = {
  width: number;
  insetsTop: number;
  insetsBottom: number;
  index: number;
  onIndexChange: (idx: number) => void;
  onSkip: () => void;
  onNext: () => void;
  scrollRef: React.RefObject<ScrollView | null>;
  buildLabel: string;
};

export function OnboardingScreen({
  width,
  insetsTop,
  insetsBottom,
  index,
  onIndexChange,
  onSkip,
  onNext,
  scrollRef,
  buildLabel,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={[styles.screen, { paddingTop: insetsTop }]}> 
        <View style={styles.top}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            bounces={false}
            overScrollMode="never"
            contentInsetAdjustmentBehavior="never"
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const next = Math.round(e.nativeEvent.contentOffset.x / width);
              if (next !== index) onIndexChange(Math.max(0, Math.min(ONBOARDING_SLIDES.length - 1, next)));
            }}
            scrollEventThrottle={16}
          >
            {ONBOARDING_SLIDES.map((item) => (
              <View key={item.title} style={{ width }}>
                <View style={styles.contentWrap}>
                  <View style={styles.content}>
                  <Text style={styles.kicker}>Welcome to LunchCrew</Text>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.subtitle}>{item.body}</Text>
                  <Text style={styles.buildLabel}>{buildLabel}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.bottom, { paddingBottom: Math.max(insetsBottom + 10, 20) }]}> 
          <View style={styles.bottomInner}>
          <View style={styles.dotsWrap}>
            {ONBOARDING_SLIDES.map((_, idx) => (
              <View key={idx} style={[styles.dot, idx === index && styles.dotActive]} />
            ))}
          </View>
          <View style={styles.rowBetween}>
            <Pressable style={styles.skipBtn} onPress={onSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={onNext}>
              <Text style={styles.primaryText}>{index === ONBOARDING_SLIDES.length - 1 ? 'Get started' : 'Next'}</Text>
            </Pressable>
          </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#030712' },
  screen: { flex: 1, padding: 0, justifyContent: 'space-between' },
  top: { flex: 1, justifyContent: 'center' },
  contentWrap: { width: '100%', alignItems: 'center' },
  content: { width: '100%', maxWidth: 760, paddingHorizontal: 22, paddingVertical: 8, justifyContent: 'center' },
  kicker: { color: '#22d3ee', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: '#f8fafc', fontSize: 34, fontWeight: '800', marginTop: 2 },
  subtitle: { color: '#94a3b8', fontSize: 14, marginTop: 2 },
  buildLabel: { color: '#475569', fontSize: 11, marginTop: 8, fontWeight: '600' },
  bottom: { paddingHorizontal: 20, gap: 18 },
  bottomInner: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 18 },
  dotsWrap: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#334155' },
  dotActive: { backgroundColor: '#22d3ee', width: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  skipBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  skipText: { color: '#cbd5e1', fontWeight: '700', fontSize: 16 },
  primaryBtn: {
    minHeight: 48,
    minWidth: 152,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#22d3ee',
  },
  primaryText: { color: '#0f172a', fontWeight: '800', fontSize: 16 },
});
