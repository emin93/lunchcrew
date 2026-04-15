'use client';

import { useEffect } from 'react';
import { LAST_WORKSPACE_ID_KEY, extractInviteCode, storage } from '@/lib/helpers';
import { isConfigured } from '@/lib/supabase';
import { useAuthState } from './useLunchCrewApp/useAuthState';
import { useMonetizationState } from './useLunchCrewApp/useMonetizationState';
import { usePollState } from './useLunchCrewApp/usePollState';
import { useWorkspaceState } from './useLunchCrewApp/useWorkspaceState';

export function useLunchCrewApp(initialCode?: string) {
  const workspaceState = useWorkspaceState();
  const authState = useAuthState({
    deviceId: workspaceState.deviceId,
    workspace: workspaceState.workspace,
  });
  const pollState = usePollState({
    activeSearchCoords: workspaceState.activeSearchCoords,
    deviceId: workspaceState.deviceId,
    member: workspaceState.member,
    setLoadError: workspaceState.setLoadError,
    workspace: workspaceState.workspace,
  });
  const monetizationState = useMonetizationState({
    onboardingDone: workspaceState.onboardingDone,
    onboardingReady: workspaceState.onboardingReady,
    workspaceId: workspaceState.workspace?.id,
  });

  const configError = !isConfigured ? 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in runtime.' : null;

  useEffect(() => {
    if (!workspaceState.onboardingReady || !workspaceState.onboardingDone) return;
    void (async () => {
      const currentDeviceId = await workspaceState.initializeDeviceId();
      const code = extractInviteCode(initialCode || (typeof window !== 'undefined' ? window.location.pathname : ''));
      if (code) {
        await workspaceState.joinByCode(code, currentDeviceId);
        return;
      }
      const lastWorkspaceId = storage.get(LAST_WORKSPACE_ID_KEY);
      if (lastWorkspaceId) {
        const restored = await workspaceState.loadWorkspaceById(lastWorkspaceId);
        if (restored) {
          await workspaceState.setCurrentWorkspace(restored);
          await workspaceState.ensureMember(restored.id, currentDeviceId);
          return;
        }
      }
      await workspaceState.createWorkspace(currentDeviceId);
    })();
  }, [initialCode, workspaceState.onboardingDone, workspaceState.onboardingReady]);

  useEffect(() => {
    if (!workspaceState.workspace || !workspaceState.deviceId) return;
    void workspaceState.ensureMember(workspaceState.workspace.id, workspaceState.deviceId);
  }, [workspaceState.workspace?.id, workspaceState.deviceId]);

  async function retryLoad() {
    workspaceState.setLoadError(null);
    pollState.setPollDataReady(false);
    pollState.setHistoryDataReady(false);

    if (!workspaceState.workspace) {
      const lastWorkspaceId = storage.get(LAST_WORKSPACE_ID_KEY);
      if (lastWorkspaceId) {
        const restored = await workspaceState.loadWorkspaceById(lastWorkspaceId);
        if (restored) {
          await workspaceState.setCurrentWorkspace(restored);
          if (workspaceState.deviceId) await workspaceState.ensureMember(restored.id, workspaceState.deviceId);
          return;
        }
      }
      await workspaceState.createWorkspace();
      return;
    }

    if (pollState.poll && workspaceState.deviceId) {
      await pollState.refreshPollData(pollState.poll.id, workspaceState.workspace.id, workspaceState.deviceId);
      await pollState.refreshHistory(workspaceState.workspace.id);
      return;
    }

    const todayPoll = await pollState.ensureTodayPoll(workspaceState.workspace.id);
    if (todayPoll) {
      pollState.setPoll(todayPoll);
      await pollState.refreshPollData(todayPoll.id, workspaceState.workspace.id, workspaceState.deviceId);
      await pollState.refreshHistory(workspaceState.workspace.id);
    }
  }

  return {
    configError,
    onboardingDone: workspaceState.onboardingDone,
    onboardingReady: workspaceState.onboardingReady,
    completeOnboarding: workspaceState.completeOnboarding,
    shareInvite: workspaceState.shareInvite,
    createNewCrew: workspaceState.createNewCrew,
    retryLoad,
    showMonetizationModal: monetizationState.showMonetizationModal,
    setShowMonetizationModal: monetizationState.setShowMonetizationModal,
    dismissMonetizationModal: monetizationState.dismissMonetizationModal,
    show30DayHistory: pollState.show30DayHistory,
    setShow30DayHistory: pollState.setShow30DayHistory,
    workspace: workspaceState.workspace,
    deviceId: workspaceState.deviceId,
    member: workspaceState.member,
    loading: workspaceState.loading,
    renaming: workspaceState.renaming,
    savingName: workspaceState.savingName,
    loadError: workspaceState.loadError,
    setLoadError: workspaceState.setLoadError,
    renameCrew: workspaceState.renameCrew,
    saveDisplayName: workspaceState.saveDisplayName,
    poll: pollState.poll,
    pollDataReady: pollState.pollDataReady,
    options: pollState.options,
    myOptionId: pollState.myOptionId,
    newOption: pollState.newOption,
    setNewOption: pollState.setNewOption,
    votingOptionId: pollState.votingOptionId,
    addingOption: pollState.addingOption,
    removingOptionId: pollState.removingOptionId,
    topChoice: pollState.topChoice,
    vote: pollState.vote,
    addOption: pollState.addOption,
    removeOption: pollState.removeOption,
    suggestions: pollState.suggestions,
    loadingSuggestions: pollState.loadingSuggestions,
    selectedSuggestion: pollState.selectedSuggestion,
    setSelectedSuggestion: pollState.setSelectedSuggestion,
    history7Days: pollState.history7Days,
    history30Days: pollState.history30Days,
    leaderboard: pollState.leaderboard,
    historyDataReady: pollState.historyDataReady,
    searchAreaInput: workspaceState.searchAreaInput,
    setSearchAreaInput: workspaceState.setSearchAreaInput,
    searchAreaLoading: workspaceState.searchAreaLoading,
    searchAreaError: workspaceState.searchAreaError,
    clearSearchAreaError: workspaceState.clearSearchAreaError,
    applySearchArea: workspaceState.applySearchArea,
    clearSearchArea: workspaceState.clearSearchArea,
    activeSearchAreaLabel: workspaceState.activeSearchAreaLabel,
    hasCrewSearchArea: workspaceState.hasCrewSearchArea,
    geolocationAvailable: workspaceState.geolocationAvailable,
    usingCurrentLocation: workspaceState.usingCurrentLocation,
    useCurrentLocationForCrewArea: workspaceState.useCurrentLocationForCrewArea,
    authUser: authState.authUser,
    authReady: authState.authReady,
    authBusy: authState.authBusy,
    authError: authState.authError,
    setAuthError: authState.setAuthError,
    workspaceRole: authState.workspaceRole,
    workspaceHasOwner: authState.workspaceHasOwner,
    requestMagicLink: authState.requestMagicLink,
    signOutAuthUser: authState.signOutAuthUser,
    claimWorkspace: authState.claimWorkspace,
    checkoutBusy: authState.checkoutBusy,
    checkoutError: authState.checkoutError,
    setCheckoutError: authState.setCheckoutError,
    startFoundingCheckout: authState.startFoundingCheckout,
    submitFeedback: workspaceState.submitFeedback,
  };
}
