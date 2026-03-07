import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import { DEVICE_ID_KEY, DISPLAY_NAME_KEY, extractInviteCode, generateInviteCode, makeDeviceId, normalizeDisplayName, withTimeout } from '../lib/helpers';
import { isConfigured, supabase } from '../lib/supabase';
import { Workspace, WorkspaceMember } from '../types';

type Params = { enabled: boolean };

export function useWorkspaceData({ enabled }: Params) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [member, setMember] = useState<WorkspaceMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDeviceId = async () => {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      setDeviceId(existing);
      return existing;
    }
    const created = makeDeviceId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, created);
    setDeviceId(created);
    return created;
  };

  const ensureMember = async (workspaceId: string, currentDeviceId: string) => {
    if (!supabase) return;

    const inserted = await withTimeout(
      supabase
        .from('workspace_members')
        .upsert({ workspace_id: workspaceId, device_id: currentDeviceId }, { onConflict: 'workspace_id,device_id' })
        .select('*')
        .maybeSingle(),
    );

    if (inserted.error) {
      setLoadError('Could not initialize member profile. Please retry.');
      return;
    }

    const baseMember = inserted.data as WorkspaceMember | null;
    if (!baseMember) return;

    if (baseMember.display_name && baseMember.display_name.trim()) {
      setMember(baseMember);
      return;
    }

    const pendingName = normalizeDisplayName((await AsyncStorage.getItem(DISPLAY_NAME_KEY)) || '');
    if (!pendingName) {
      setMember(baseMember);
      return;
    }

    const hydrated = await withTimeout(
      supabase
        .from('workspace_members')
        .upsert(
          { workspace_id: workspaceId, device_id: currentDeviceId, display_name: pendingName },
          { onConflict: 'workspace_id,device_id' },
        )
        .select('*')
        .maybeSingle(),
    );

    if (!hydrated.error && hydrated.data) {
      setMember(hydrated.data as WorkspaceMember);
      return;
    }

    setMember(baseMember);
  };

  const saveDisplayName = async (nextName: string) => {
    if (!supabase || !workspace || !deviceId) return;

    const trimmed = normalizeDisplayName(nextName);
    setSavingName(true);
    setLoadError(null);

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('workspace_members')
          .upsert(
            { workspace_id: workspace.id, device_id: deviceId, display_name: trimmed || null },
            { onConflict: 'workspace_id,device_id' },
          )
          .select('*')
          .maybeSingle(),
      );

      setSavingName(false);
      if (error || !data) {
        const extra = error?.message ? ` (${error.message})` : '';
        return setLoadError(`Could not save your name. Please retry${extra}`);
      }

      setMember(data as WorkspaceMember);
      if (trimmed) await AsyncStorage.setItem(DISPLAY_NAME_KEY, trimmed);
      else await AsyncStorage.removeItem(DISPLAY_NAME_KEY);
    } catch {
      setSavingName(false);
      setLoadError('Network timeout while saving your name. Please retry.');
    }
  };

  const createWorkspace = async () => {
    if (!supabase) return;
    setLoading(true);
    setLoadError(null);

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('workspaces')
          .insert({ name: 'LunchCrew', invite_code: generateInviteCode() })
          .select('*')
          .single(),
      );
      setLoading(false);
      if (error || !data) return setLoadError('Could not create crew. Check internet and retry.');
      setWorkspace(data as Workspace);
    } catch {
      setLoading(false);
      setLoadError('Network timeout while creating crew. Please retry.');
    }
  };

  const joinByDeepLink = async (url: string) => {
    if (!supabase) return;
    const code = extractInviteCode(url);
    if (!code) return;

    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await withTimeout(supabase.from('workspaces').select('*').eq('invite_code', code).single());
      setLoading(false);
      if (error || !data) return setLoadError('Join failed. Invite link invalid or network issue.');
      setWorkspace(data as Workspace);
    } catch {
      setLoading(false);
      setLoadError('Network timeout while joining workspace. Please retry.');
    }
  };

  const retryWorkspaceLoad = async () => {
    setLoadError(null);
    if (!workspace) await createWorkspace();
    if (workspace && deviceId) await ensureMember(workspace.id, deviceId);
  };

  const renameCrew = async (name: string) => {
    if (!supabase || !workspace) return;
    const nextName = name.trim();
    if (!nextName || nextName === workspace.name) return;

    setRenaming(true);
    setLoadError(null);
    try {
      const { data, error } = await withTimeout(
        supabase.from('workspaces').update({ name: nextName }).eq('id', workspace.id).select('*').maybeSingle(),
      );
      setRenaming(false);
      if (error || !data) {
        const extra = error?.message ? ` (${error.message})` : '';
        return setLoadError(`Could not rename crew. Please retry${extra}`);
      }
      setWorkspace(data as Workspace);
    } catch {
      setRenaming(false);
      setLoadError('Network timeout while renaming crew. Please retry.');
    }
  };

  const syncWebUrlWithWorkspace = (inviteCode: string) => {
    if (Platform.OS !== 'web') return;
    try {
      const url = new URL(window.location.href);
      const current = (url.searchParams.get('code') || '').toUpperCase();
      const target = inviteCode.toUpperCase();
      if (current === target) return;
      url.searchParams.set('code', target);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    if (workspace?.invite_code) {
      syncWebUrlWithWorkspace(workspace.invite_code);
    }
  }, [workspace?.invite_code]);

  useEffect(() => {
    if (!enabled) return;
    if (!isConfigured || !supabase) return;

    const boot = async () => {
      await loadDeviceId();
      const initialUrl = await Promise.race<string | null>([
        Linking.getInitialURL(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
      ]);
      const initialCode = extractInviteCode(initialUrl || '');
      if (initialUrl && initialCode) await joinByDeepLink(initialUrl);
      else await createWorkspace();
    };

    void boot();

    const sub = Linking.addEventListener('url', (event) => {
      if (extractInviteCode(event.url)) void joinByDeepLink(event.url);
    });

    return () => sub.remove();
    // enabled gates one-time boot from App.
  }, [enabled]);

  useEffect(() => {
    if (!workspace || !deviceId || !supabase) return;
    void ensureMember(workspace.id, deviceId);
  }, [workspace?.id, deviceId]);

  return {
    workspace,
    deviceId,
    member,
    loading,
    renaming,
    savingName,
    loadError,
    setLoadError,
    createWorkspace,
    retryWorkspaceLoad,
    renameCrew,
    saveDisplayName,
  };
}
