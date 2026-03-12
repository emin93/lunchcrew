import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { initialsForName, MAX_DISPLAY_NAME_LENGTH, normalizeDisplayName } from '../lib/helpers';
import { Workspace } from '../types';
import { ds } from './designSystem';

type Props = {
  workspace: Workspace;
  displayName: string;
  onSaveDisplayName: (name: string) => void;
  savingName: boolean;
  onShare: () => void;
  onRename: (name: string) => void;
  onCreateNewCrew: () => void;
  renaming: boolean;
};

export function WorkspacePanel({
  workspace,
  displayName,
  onSaveDisplayName,
  savingName,
  onShare,
  onRename,
  onCreateNewCrew,
  renaming,
}: Props) {
  const [nameDraft, setNameDraft] = useState(workspace.name);
  const [displayNameDraft, setDisplayNameDraft] = useState(displayName);

  useEffect(() => setNameDraft(workspace.name), [workspace.name]);
  useEffect(() => setDisplayNameDraft(displayName), [displayName]);

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>Active crew</Text></View>
        <Text style={styles.title}>{workspace.name}</Text>
        <Text style={styles.subtitle}>Keep the crew recognizable, keep invites simple, and make sure everyone shows up correctly when it’s time to vote.</Text>
      </View>

      <View style={styles.overviewGrid}>
        <View style={[styles.overviewCard, styles.overviewCardPrimary]}>
          <Text style={styles.overviewLabel}>Invite code</Text>
          <Text style={styles.overviewValue}>{workspace.invite_code}</Text>
          <Text style={styles.overviewCopy}>Share this to bring someone straight into the crew.</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Workspace</Text>
          <Text style={styles.overviewValue} numberOfLines={2}>{workspace.name}</Text>
          <Text style={styles.overviewCopy}>Renaming the crew doesn’t affect routing or data flow.</Text>
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Crew identity</Text>
          <Text style={styles.blockCopy}>Edit the name your team sees everywhere in the app.</Text>
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex]}
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="Crew name"
            placeholderTextColor={ds.colors.textSoft}
          />
          <Pressable style={[styles.actionBtn, renaming && styles.disabled]} onPress={() => onRename(nameDraft)} disabled={renaming}>
            {renaming ? <ActivityIndicator size="small" color="#10182f" /> : <Text style={styles.actionBtnText}>Save</Text>}
          </Pressable>
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Your profile</Text>
          <Text style={styles.blockCopy}>This is how you appear inside votes and crew activity.</Text>
        </View>
        <View style={styles.profileShell}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initialsForName(displayNameDraft)}</Text></View>
          <View style={styles.profileFields}>
            <TextInput
              style={styles.input}
              value={displayNameDraft}
              onChangeText={(v) => setDisplayNameDraft(normalizeDisplayName(v))}
              placeholder="Your display name"
              placeholderTextColor={ds.colors.textSoft}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
            />
            <Text style={styles.meta}>{displayNameDraft.length}/{MAX_DISPLAY_NAME_LENGTH} characters</Text>
          </View>
          <Pressable style={[styles.actionBtn, savingName && styles.disabled]} onPress={() => onSaveDisplayName(displayNameDraft)} disabled={savingName}>
            {savingName ? <ActivityIndicator size="small" color="#10182f" /> : <Text style={styles.actionBtnText}>Save</Text>}
          </Pressable>
        </View>
      </View>

      <View style={styles.actionStrip}>
        <Pressable style={styles.secondaryBtn} onPress={onShare}><Text style={styles.secondaryText}>Share invite</Text></Pressable>
        <Pressable style={[styles.secondaryBtn, styles.secondaryBtnStrong]} onPress={onCreateNewCrew}><Text style={styles.secondaryTextStrong}>Create new crew</Text></Pressable>
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
    gap: 18,
    ...ds.shadow.card,
  },
  header: { gap: 8 },
  headerBadge: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(87, 227, 194, 0.22)',
    backgroundColor: ds.colors.tealSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerBadgeText: { color: ds.colors.text, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { color: ds.colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { color: ds.colors.textMuted, fontSize: 14, lineHeight: 21, maxWidth: 680 },
  overviewGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  overviewCard: {
    minWidth: 180,
    flexGrow: 1,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: 'rgba(8, 13, 31, 0.54)',
    padding: 16,
    gap: 5,
  },
  overviewCardPrimary: { borderColor: ds.colors.accentSoftStrong, backgroundColor: 'rgba(20, 29, 58, 0.92)' },
  overviewLabel: { color: ds.colors.textSoft, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  overviewValue: { color: ds.colors.text, fontSize: 22, lineHeight: 28, fontWeight: '900' },
  overviewCopy: { color: ds.colors.textMuted, fontSize: 12, lineHeight: 18 },
  block: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: ds.colors.cardMuted,
    padding: 18,
    gap: 12,
  },
  blockHeader: { gap: 4 },
  blockTitle: { color: ds.colors.text, fontSize: 19, fontWeight: '900' },
  blockCopy: { color: ds.colors.textSoft, fontSize: 13, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profileShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: 'rgba(7, 11, 26, 0.44)',
    padding: 12,
  },
  profileFields: { flex: 1, gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    borderRadius: 18,
    backgroundColor: ds.colors.input,
    color: ds.colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  flex: { flex: 1 },
  actionBtn: {
    borderRadius: 18,
    backgroundColor: ds.colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 13,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    ...ds.shadow.glow,
  },
  actionBtnText: { color: '#10182f', fontWeight: '900', fontSize: 13 },
  disabled: { opacity: 0.7 },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: ds.colors.accentSoft,
    borderWidth: 1,
    borderColor: ds.colors.accentSoftStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: ds.colors.text, fontWeight: '900', fontSize: 16 },
  meta: { color: ds.colors.textSoft, fontSize: 12, fontWeight: '700' },
  actionStrip: {
    flexDirection: 'row',
    gap: 10,
    padding: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ds.colors.stroke,
    backgroundColor: 'rgba(7, 11, 26, 0.38)',
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ds.colors.strokeStrong,
    backgroundColor: ds.colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  secondaryBtnStrong: { backgroundColor: 'rgba(87, 227, 194, 0.12)', borderColor: 'rgba(87, 227, 194, 0.24)' },
  secondaryText: { color: ds.colors.text, fontWeight: '800', fontSize: 13 },
  secondaryTextStrong: { color: ds.colors.teal, fontWeight: '900', fontSize: 13 },
});
