import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Share } from 'react-native';
import {
  BUILD_LABEL,
  DISPLAY_NAME_KEY,
  LOCATION_PROMPT_SEEN_KEY,
  MONETIZATION_LAST_PROMPT_AT_KEY,
  MONETIZATION_WAITLIST_JOINED_KEY,
  normalizeDisplayName,
  ONBOARDING_SEEN_KEY,
} from '../lib/helpers';
import { trackEvent } from '../lib/analytics';
import { useWorkspaceData } from '../hooks/useWorkspaceData';
import { usePollData } from '../hooks/usePollData';
import { isConfigured } from '../lib/supabase';

export function useAppState() {
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [requestLocation, setRequestLocation] = useState(false);
  const [showMonetizationModal, setShowMonetizationModal] = useState(false);
  const [show30DayHistory, setShow30DayHistory] = useState(false);

  const initialized = useRef(false);

  const workspaceState = useWorkspaceData({ enabled: onboardingReady && onboardingDone && !initialized.current });
  const {
    workspace,
    deviceId,
    loadError,
    setLoadError,
    createWorkspace,
    retryWorkspaceLoad,
  } = workspaceState;

  useEffect(() => {
    if (onboardingReady && onboardingDone && !initialized.current) initialized.current = true;
  }, [onboardingReady, onboardingDone]);

  const pollState = usePollData({ workspace, deviceId, onLoadError: setLoadError, requestLocation });

  const configError = !isConfigured
    ? 'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in runtime.'
    : null;

  const completeOnboarding = async (name?: string) => {
    const trimmed = normalizeDisplayName(name || '');
    if (trimmed) await AsyncStorage.setItem(DISPLAY_NAME_KEY, trimmed);
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
    setOnboardingDone(true);
  };

  const shareInvite = async () => {
    if (!workspace) return;
    const inviteLink = `https://join.lunchcrew.app?code=${workspace.invite_code}`;

    try {
      await Share.share({ title: 'LunchCrew Invite', message: `Join my LunchCrew: ${inviteLink}` });
      void trackEvent('invite_shared', { workspace_id: workspace.id, method: 'native_share' }, deviceId);
      return;
    } catch {}

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(inviteLink);
        Alert.alert('Invite link copied', 'Paste it in chat to invite your crew.');
        void trackEvent('invite_shared', { workspace_id: workspace.id, method: 'clipboard_fallback' }, deviceId);
      } catch {
        Alert.alert('Could not share', 'Copy this invite code manually: ' + workspace.invite_code);
      }
      return;
    }

    Alert.alert('Could not share', 'Copy this invite code manually: ' + workspace.invite_code);
  };

  const createNewCrew = async () => {
    setLoadError(null);
    await createWorkspace();
  };

  const retryLoad = async () => {
    if (!workspace) return retryWorkspaceLoad();
    return pollState.retryPollLoad();
  };

  useEffect(() => {
    const loadOnboarding = async () => {
      const seen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
      setOnboardingDone(seen === '1');
      setOnboardingReady(true);
    };
    void loadOnboarding();
  }, []);

  useEffect(() => {
    if (onboardingReady && onboardingDone && !isConfigured) {
      Alert.alert('Supabase missing', 'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
    }
  }, [onboardingReady, onboardingDone]);

  useEffect(() => {
    if (!onboardingReady || !onboardingDone) return;
    const askLocationPermission = async () => {
      const seen = await AsyncStorage.getItem(LOCATION_PROMPT_SEEN_KEY);
      if (seen === '1') return setRequestLocation(true);
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(LOCATION_PROMPT_SEEN_KEY, '1');
        return setRequestLocation(true);
      }

      Alert.alert(
        'Enable location for better suggestions?',
        "LunchCrew uses your location only to improve nearby autocomplete suggestions. Your location isn't stored.",
        [
          { text: 'Not now', style: 'cancel', onPress: async () => AsyncStorage.setItem(LOCATION_PROMPT_SEEN_KEY, '1') },
          { text: 'Continue', onPress: async () => { await AsyncStorage.setItem(LOCATION_PROMPT_SEEN_KEY, '1'); setRequestLocation(true); } },
        ],
      );
    };
    void askLocationPermission();
  }, [onboardingReady, onboardingDone]);

  useEffect(() => {
    if (!onboardingReady || !onboardingDone || !workspace?.id) return;

    const maybeShowMonetizationModal = async () => {
      const joined = await AsyncStorage.getItem(MONETIZATION_WAITLIST_JOINED_KEY);
      if (joined === '1') return;
      const now = Date.now();
      const lastPromptRaw = await AsyncStorage.getItem(MONETIZATION_LAST_PROMPT_AT_KEY);
      if (!lastPromptRaw) return void AsyncStorage.setItem(MONETIZATION_LAST_PROMPT_AT_KEY, String(now));
      const lastPrompt = Number(lastPromptRaw);
      if (!Number.isFinite(lastPrompt)) return void AsyncStorage.setItem(MONETIZATION_LAST_PROMPT_AT_KEY, String(now));
      if (now - lastPrompt >= 24 * 60 * 60 * 1000) setShowMonetizationModal(true);
    };

    void maybeShowMonetizationModal();
  }, [onboardingReady, onboardingDone, workspace?.id]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    html.style.backgroundColor = '#030712';
    body.style.backgroundColor = '#030712';
    body.style.margin = '0';
    body.style.overflowX = 'hidden';
    if (root) root.style.backgroundColor = '#030712';
  }, []);

  return {
    BUILD_LABEL,
    configError,
    onboardingDone,
    onboardingReady,
    completeOnboarding,
    shareInvite,
    createNewCrew,
    retryLoad,
    showMonetizationModal,
    setShowMonetizationModal,
    show30DayHistory,
    setShow30DayHistory,
    ...workspaceState,
    ...pollState,
  };
}
