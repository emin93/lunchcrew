'use client';

import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import {
  DEVICE_ID_KEY,
  DISPLAY_NAME_KEY,
  LAST_WORKSPACE_CODE_KEY,
  LAST_WORKSPACE_ID_KEY,
  ONBOARDING_SEEN_KEY,
  generateInviteCode,
  makeDeviceId,
  normalizeDisplayName,
  storage,
  workspacePath,
} from '@/lib/helpers';
import { supabase } from '@/lib/supabase';
import type { Workspace, WorkspaceMember } from '@/lib/types';
import {
  createWorkspace as createWorkspaceRecord,
  ensureMember as ensureMemberRecord,
  joinWorkspaceByCode,
  loadWorkspaceById as loadWorkspaceByIdRecord,
  lookupSearchArea,
  renameWorkspace,
  saveWorkspaceSearchArea as saveWorkspaceSearchAreaRecord,
  submitFeedback as submitFeedbackRecord,
  updateMemberDisplayName,
} from './api';

export function useWorkspaceState() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [member, setMember] = useState<WorkspaceMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [searchAreaInput, setSearchAreaInput] = useState('');
  const [searchAreaLoading, setSearchAreaLoading] = useState(false);
  const [searchAreaError, setSearchAreaError] = useState<string | null>(null);
  const [geolocationAvailable, setGeolocationAvailable] = useState(false);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);

  const activeSearchCoords = workspace && Number.isFinite(workspace.search_area_lat) && Number.isFinite(workspace.search_area_lng)
    ? { lat: workspace.search_area_lat as number, lng: workspace.search_area_lng as number }
    : null;
  const activeSearchAreaLabel = workspace?.search_area_label || null;
  const hasCrewSearchArea = !!activeSearchCoords && !!activeSearchAreaLabel;

  useEffect(() => {
    const seen = storage.get(ONBOARDING_SEEN_KEY);
    setOnboardingDone(seen === '1');
    setOnboardingReady(true);
  }, []);

  useEffect(() => {
    setGeolocationAvailable(typeof navigator !== 'undefined' && !!navigator.geolocation);
  }, []);

  useEffect(() => {
    setSearchAreaInput(workspace?.search_area_label || '');
  }, [workspace?.id, workspace?.search_area_label]);

  async function initializeDeviceId() {
    const currentDeviceId = storage.get(DEVICE_ID_KEY) || makeDeviceId();
    storage.set(DEVICE_ID_KEY, currentDeviceId);
    setDeviceId(currentDeviceId);
    return currentDeviceId;
  }

  async function loadWorkspaceById(workspaceId: string) {
    if (!supabase) return null;
    return loadWorkspaceByIdRecord(supabase, workspaceId);
  }

  async function setCurrentWorkspace(next: Workspace) {
    setWorkspace(next);
    storage.set(LAST_WORKSPACE_ID_KEY, next.id);
    storage.set(LAST_WORKSPACE_CODE_KEY, next.invite_code.toUpperCase());
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/\/+$/, '') || '/';
      const section = path.endsWith('/plan') ? 'plan' : path.endsWith('/history') ? 'history' : path.endsWith('/crew') ? 'crew' : 'today';
      window.history.replaceState({}, '', workspacePath(next.invite_code.toUpperCase(), section));
    }
  }

  async function ensureMember(workspaceId: string, currentDeviceId: string) {
    if (!supabase) return;
    const inserted = await ensureMemberRecord(supabase, workspaceId, currentDeviceId);
    if (inserted.error) return setLoadError('Could not initialize member profile. Please retry.');
    const baseMember = inserted.member;
    if (!baseMember) return;
    const pendingName = normalizeDisplayName(storage.get(DISPLAY_NAME_KEY) || '');
    if (baseMember.display_name?.trim()) return void setMember(baseMember);
    if (!pendingName) return void setMember(baseMember);
    const hydrated = await updateMemberDisplayName(supabase, workspaceId, currentDeviceId, pendingName);
    setMember((hydrated.data as WorkspaceMember) || baseMember);
  }

  async function createWorkspace(currentDeviceId = deviceId) {
    if (!supabase) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await createWorkspaceRecord(supabase, generateInviteCode());
      setLoading(false);
      if (!data) return setLoadError('Could not create crew. Check internet and retry.');
      await setCurrentWorkspace(data);
      if (currentDeviceId) await ensureMember(data.id, currentDeviceId);
      void trackEvent('workspace_created', { workspace_id: data.id }, currentDeviceId || undefined);
    } catch {
      setLoading(false);
      setLoadError('Network timeout while creating crew. Please retry.');
    }
  }

  async function joinByCode(code: string, currentDeviceId = deviceId) {
    if (!supabase) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await joinWorkspaceByCode(supabase, code);
      setLoading(false);
      if (!data) return setLoadError('Join failed. Invite link invalid or network issue.');
      await setCurrentWorkspace(data);
      if (currentDeviceId) await ensureMember(data.id, currentDeviceId);
      void trackEvent('workspace_joined', { workspace_id: data.id }, currentDeviceId || undefined);
    } catch {
      setLoading(false);
      setLoadError('Network timeout while joining workspace. Please retry.');
    }
  }

  async function saveDisplayName(nextName: string) {
    if (!supabase || !workspace || !deviceId) return;
    const trimmed = normalizeDisplayName(nextName);
    setSavingName(true);
    setLoadError(null);
    try {
      const { data, error } = await updateMemberDisplayName(supabase, workspace.id, deviceId, trimmed || null);
      setSavingName(false);
      if (error || !data) return setLoadError(`Could not save your name. Please retry${error?.message ? ` (${error.message})` : ''}`);
      setMember(data as WorkspaceMember);
      trimmed ? storage.set(DISPLAY_NAME_KEY, trimmed) : storage.remove(DISPLAY_NAME_KEY);
    } catch {
      setSavingName(false);
      setLoadError('Network timeout while saving your name. Please retry.');
    }
  }

  async function renameCrew(name: string) {
    if (!supabase || !workspace) return;
    const nextName = name.trim();
    if (!nextName || nextName === workspace.name) return;
    setRenaming(true);
    setLoadError(null);
    try {
      const data = await renameWorkspace(supabase, workspace.id, nextName);
      setRenaming(false);
      if (!data) return setLoadError('Could not rename crew. Please retry.');
      await setCurrentWorkspace(data);
    } catch {
      setRenaming(false);
      setLoadError('Network timeout while renaming crew. Please retry.');
    }
  }

  async function saveWorkspaceSearchArea(area: { label: string; lat: number; lng: number } | null) {
    if (!supabase || !workspace) return false;
    setSearchAreaLoading(true);
    setSearchAreaError(null);
    try {
      const data = await saveWorkspaceSearchAreaRecord(supabase, workspace.id, area);
      if (!data) {
        setSearchAreaError('Could not save crew area.');
        return false;
      }
      await setCurrentWorkspace(data);
      return true;
    } catch {
      setSearchAreaError('Network timeout while saving crew area. Please retry.');
      return false;
    } finally {
      setSearchAreaLoading(false);
    }
  }

  async function applySearchArea(rawQuery?: string) {
    const query = (rawQuery ?? searchAreaInput).trim();
    if (!query) {
      setSearchAreaError('Add a city or area first.');
      return false;
    }
    if (!supabase) {
      setSearchAreaError('Search area is unavailable right now.');
      return false;
    }
    setSearchAreaLoading(true);
    setSearchAreaError(null);
    try {
      const item = await lookupSearchArea(supabase, { query });
      if (!item) {
        setSearchAreaError('Could not find that area. Try a city, neighbourhood, or fuller address.');
        return false;
      }
      return await saveWorkspaceSearchArea({ label: item.label, lat: item.lat, lng: item.lng });
    } catch (error: any) {
      setSearchAreaError(error?.message || 'Could not set crew area.');
      return false;
    } finally {
      setSearchAreaLoading(false);
    }
  }

  async function useCurrentLocationForCrewArea() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setSearchAreaError('Current location is not available on this device.');
      return false;
    }
    if (!supabase) {
      setSearchAreaError('Search area is unavailable right now.');
      return false;
    }
    setUsingCurrentLocation(true);
    setSearchAreaError(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 7000 });
      });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const item = await lookupSearchArea(supabase, { lat, lng });
      return await saveWorkspaceSearchArea({ label: item?.label || 'Current area', lat, lng });
    } catch (error: any) {
      const message = error?.code === 1
        ? 'Location permission was denied.'
        : error?.code === 2
          ? 'Current location is unavailable right now.'
          : error?.code === 3
            ? 'Current location timed out. Please retry.'
            : error?.message || 'Could not use current location.';
      setSearchAreaError(message);
      return false;
    } finally {
      setUsingCurrentLocation(false);
    }
  }

  async function clearSearchArea() {
    setSearchAreaError(null);
    return await saveWorkspaceSearchArea(null);
  }

  function clearSearchAreaError() {
    setSearchAreaError(null);
  }

  async function submitFeedback({ email, message, source = 'crew_settings' }: { email?: string; message: string; source?: string }) {
    const cleanMessage = message.trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanMessage) return { ok: false, error: 'Write a little feedback first.' };
    if (cleanEmail && !/^\S+@\S+\.\S+$/.test(cleanEmail)) return { ok: false, error: 'That email looks off.' };
    if (!supabase) return { ok: false, error: 'Feedback is unavailable right now.' };
    const page = typeof window !== 'undefined' ? window.location.pathname : null;
    const { error } = await submitFeedbackRecord(supabase, {
      workspace,
      deviceId,
      displayName: member?.display_name || null,
      email: cleanEmail || undefined,
      message: cleanMessage,
      source,
      page,
      activeSearchAreaLabel,
    });
    if (error) return { ok: false, error: error.message || 'Could not send feedback.' };
    await trackEvent('feedback_submitted', { workspace_id: workspace?.id ?? null, source }, deviceId || undefined);
    return { ok: true };
  }

  async function shareInvite() {
    if (!workspace || typeof window === 'undefined') return;
    const inviteLink = `${window.location.origin}${workspacePath(workspace.invite_code)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'LunchCrew Invite', text: `Join my LunchCrew: ${inviteLink}`, url: inviteLink });
        return;
      }
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(inviteLink);
    } catch {}
  }

  async function completeOnboarding(name?: string) {
    const trimmed = normalizeDisplayName(name || '');
    if (trimmed) storage.set(DISPLAY_NAME_KEY, trimmed);
    storage.set(ONBOARDING_SEEN_KEY, '1');
    setOnboardingDone(true);
  }

  async function createNewCrew() {
    setLoadError(null);
    await createWorkspace();
  }

  return {
    workspace,
    deviceId,
    member,
    loading,
    renaming,
    savingName,
    loadError,
    onboardingDone,
    onboardingReady,
    searchAreaInput,
    searchAreaLoading,
    searchAreaError,
    geolocationAvailable,
    usingCurrentLocation,
    activeSearchCoords,
    activeSearchAreaLabel,
    hasCrewSearchArea,
    setLoadError,
    setSearchAreaInput,
    initializeDeviceId,
    loadWorkspaceById,
    setCurrentWorkspace,
    ensureMember,
    createWorkspace,
    joinByCode,
    saveDisplayName,
    renameCrew,
    applySearchArea,
    useCurrentLocationForCrewArea,
    clearSearchArea,
    clearSearchAreaError,
    submitFeedback,
    shareInvite,
    completeOnboarding,
    createNewCrew,
  };
}
