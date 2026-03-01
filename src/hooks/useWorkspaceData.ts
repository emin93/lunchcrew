import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { DEVICE_ID_KEY, extractInviteCode, generateInviteCode, makeDeviceId, withTimeout } from '../lib/helpers';
import { isConfigured, supabase } from '../lib/supabase';
import { Workspace } from '../types';

type Params = { enabled: boolean };

export function useWorkspaceData({ enabled }: Params) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);
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

  const createWorkspace = async () => {
    if (!supabase) return;
    setLoading(true);
    setLoadError(null);

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('workspaces')
          .insert({ name: 'LunchCrew Workspace', invite_code: generateInviteCode() })
          .select('*')
          .single(),
      );
      setLoading(false);
      if (error || !data) return setLoadError('Could not create workspace. Check internet and retry.');
      setWorkspace(data as Workspace);
    } catch {
      setLoading(false);
      setLoadError('Network timeout while creating workspace. Please retry.');
    }
  };

  const joinByDeepLink = async (url: string) => {
    if (!supabase) return;
    const code = extractInviteCode(url);
    if (!code) return;

    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await withTimeout(
        supabase.from('workspaces').select('*').eq('invite_code', code).single(),
      );
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
  };

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

  return {
    workspace,
    deviceId,
    loading,
    loadError,
    setLoadError,
    createWorkspace,
    retryWorkspaceLoad,
  };
}
