'use client';

import { useEffect, useState } from 'react';
import {
  MONETIZATION_LAST_PROMPT_AT_KEY,
  MONETIZATION_WAITLIST_JOINED_KEY,
  storage,
} from '@/lib/helpers';
import {
  MONETIZATION_PROMPT_COOLDOWN_MS,
  isMonetizationSessionSnoozed,
  snoozeMonetizationForSession,
} from './monetization';

type Params = {
  onboardingDone: boolean;
  onboardingReady: boolean;
  workspaceId?: string;
};

export function useMonetizationState({ onboardingDone, onboardingReady, workspaceId }: Params) {
  const [showMonetizationModal, setShowMonetizationModal] = useState(false);

  function dismissMonetizationModal() {
    const now = Date.now();
    storage.set(MONETIZATION_LAST_PROMPT_AT_KEY, String(now));
    snoozeMonetizationForSession();
    setShowMonetizationModal(false);
  }

  useEffect(() => {
    if (!onboardingReady || !onboardingDone || !workspaceId) return;
    if (showMonetizationModal) return;
    if (isMonetizationSessionSnoozed()) return;
    const joined = storage.get(MONETIZATION_WAITLIST_JOINED_KEY);
    if (joined === '1') return;
    const now = Date.now();
    const lastPromptRaw = storage.get(MONETIZATION_LAST_PROMPT_AT_KEY);
    if (!lastPromptRaw) return void storage.set(MONETIZATION_LAST_PROMPT_AT_KEY, String(now));
    const lastPrompt = Number(lastPromptRaw);
    if (Number.isFinite(lastPrompt) && now - lastPrompt >= MONETIZATION_PROMPT_COOLDOWN_MS) {
      storage.set(MONETIZATION_LAST_PROMPT_AT_KEY, String(now));
      setShowMonetizationModal(true);
    }
  }, [onboardingReady, onboardingDone, workspaceId, showMonetizationModal]);

  return {
    showMonetizationModal,
    setShowMonetizationModal,
    dismissMonetizationModal,
  };
}
