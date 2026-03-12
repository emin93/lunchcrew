'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import {
  BUILD_LABEL, DEVICE_ID_KEY, DISPLAY_NAME_KEY, LAST_WORKSPACE_ID_KEY, LOCATION_PROMPT_SEEN_KEY,
  MONETIZATION_LAST_PROMPT_AT_KEY, MONETIZATION_WAITLIST_JOINED_KEY, ONBOARDING_SEEN_KEY,
  extractInviteCode, generateInviteCode, makeDeviceId, normalizeDisplayName, storage, todayDateUTC, withTimeout,
} from '@/lib/helpers';
import { isConfigured, supabase } from '@/lib/supabase';
import type { HistoryDaySummary, LeaderboardPlace, PlaceSuggestion, Poll, PollOption, Workspace, WorkspaceMember } from '@/lib/types';

type PlaceDetailsResponse = {
  provider: string; externalPlaceId: string; name: string; formattedAddress?: string | null; rating?: number | null;
  priceLevel?: number | null; googleMapsUrl?: string | null; websiteUrl?: string | null; detectedMenuUrl?: string | null;
};

export function useLunchCrewApp(initialCode?: string) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [member, setMember] = useState<WorkspaceMember | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [myOptionId, setMyOptionId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState('');
  const [votingOptionId, setVotingOptionId] = useState<string | null>(null);
  const [addingOption, setAddingOption] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<PlaceSuggestion | null>(null);
  const [history7Days, setHistory7Days] = useState<HistoryDaySummary[]>([]);
  const [history30Days, setHistory30Days] = useState<HistoryDaySummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlace[]>([]);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [requestLocation, setRequestLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showMonetizationModal, setShowMonetizationModal] = useState(false);
  const [show30DayHistory, setShow30DayHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const configError = !isConfigured ? 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in runtime.' : null;
  const topChoice = useMemo(() => options.slice().sort((a, b) => b.votes - a.votes)[0]?.name, [options]);

  useEffect(() => {
    const seen = storage.get(ONBOARDING_SEEN_KEY);
    setOnboardingDone(seen === '1');
    setOnboardingReady(true);
  }, []);

  useEffect(() => {
    if (!onboardingReady || !onboardingDone) return;
    const seen = storage.get(LOCATION_PROMPT_SEEN_KEY);
    if (!seen) storage.set(LOCATION_PROMPT_SEEN_KEY, '1');
    setRequestLocation(true);
  }, [onboardingReady, onboardingDone]);

  useEffect(() => {
    if (!requestLocation || typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 7000 },
    );
  }, [requestLocation]);

  useEffect(() => {
    if (!onboardingReady || !onboardingDone || !supabase) return;
    const currentDeviceId = storage.get(DEVICE_ID_KEY) || makeDeviceId();
    storage.set(DEVICE_ID_KEY, currentDeviceId);
    setDeviceId(currentDeviceId);

    const boot = async () => {
      const code = extractInviteCode(initialCode || (typeof window !== 'undefined' ? window.location.href : ''));
      if (code) {
        await joinByCode(code, currentDeviceId);
        return;
      }
      const lastWorkspaceId = storage.get(LAST_WORKSPACE_ID_KEY);
      if (lastWorkspaceId) {
        const restored = await loadWorkspaceById(lastWorkspaceId);
        if (restored) {
          await setCurrentWorkspace(restored);
          await ensureMember(restored.id, currentDeviceId);
          return;
        }
      }
      await createWorkspace(currentDeviceId);
    };
    void boot();
  }, [initialCode, onboardingDone, onboardingReady]);

  async function loadWorkspaceById(workspaceId: string) {
    if (!supabase) return null;
    const { data, error } = await withTimeout(supabase.from('workspaces').select('*').eq('id', workspaceId).maybeSingle());
    if (error || !data) return null;
    return data as Workspace;
  }
  async function setCurrentWorkspace(next: Workspace) {
    setWorkspace(next);
    storage.set(LAST_WORKSPACE_ID_KEY, next.id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('code', next.invite_code.toUpperCase());
      window.history.replaceState({}, '', url.toString());
    }
  }
  async function ensureMember(workspaceId: string, currentDeviceId: string) {
    if (!supabase) return;
    const inserted = await withTimeout(supabase.from('workspace_members').upsert({ workspace_id: workspaceId, device_id: currentDeviceId }, { onConflict: 'workspace_id,device_id' }).select('*').maybeSingle());
    if (inserted.error) return setLoadError('Could not initialize member profile. Please retry.');
    const baseMember = inserted.data as WorkspaceMember | null;
    if (!baseMember) return;
    const pendingName = normalizeDisplayName(storage.get(DISPLAY_NAME_KEY) || '');
    if (baseMember.display_name?.trim()) return void setMember(baseMember);
    if (!pendingName) return void setMember(baseMember);
    const hydrated = await withTimeout(supabase.from('workspace_members').upsert({ workspace_id: workspaceId, device_id: currentDeviceId, display_name: pendingName }, { onConflict: 'workspace_id,device_id' }).select('*').maybeSingle());
    setMember((hydrated.data as WorkspaceMember) || baseMember);
  }
  async function createWorkspace(currentDeviceId = deviceId) {
    if (!supabase) return;
    setLoading(true); setLoadError(null);
    try {
      const { data, error } = await withTimeout(supabase.from('workspaces').insert({ name: 'LunchCrew', invite_code: generateInviteCode() }).select('*').single());
      setLoading(false);
      if (error || !data) return setLoadError('Could not create crew. Check internet and retry.');
      await setCurrentWorkspace(data as Workspace);
      if (currentDeviceId) await ensureMember(data.id, currentDeviceId);
      void trackEvent('workspace_created', { workspace_id: data.id }, currentDeviceId || undefined);
    } catch { setLoading(false); setLoadError('Network timeout while creating crew. Please retry.'); }
  }
  async function joinByCode(code: string, currentDeviceId = deviceId) {
    if (!supabase) return;
    setLoading(true); setLoadError(null);
    try {
      const { data, error } = await withTimeout(supabase.from('workspaces').select('*').eq('invite_code', code).single());
      setLoading(false);
      if (error || !data) return setLoadError('Join failed. Invite link invalid or network issue.');
      await setCurrentWorkspace(data as Workspace);
      if (currentDeviceId) await ensureMember(data.id, currentDeviceId);
      void trackEvent('workspace_joined', { workspace_id: data.id }, currentDeviceId || undefined);
    } catch { setLoading(false); setLoadError('Network timeout while joining workspace. Please retry.'); }
  }
  async function saveDisplayName(nextName: string) {
    if (!supabase || !workspace || !deviceId) return;
    const trimmed = normalizeDisplayName(nextName);
    setSavingName(true); setLoadError(null);
    try {
      const { data, error } = await withTimeout(supabase.from('workspace_members').upsert({ workspace_id: workspace.id, device_id: deviceId, display_name: trimmed || null }, { onConflict: 'workspace_id,device_id' }).select('*').maybeSingle());
      setSavingName(false);
      if (error || !data) return setLoadError(`Could not save your name. Please retry${error?.message ? ` (${error.message})` : ''}`);
      setMember(data as WorkspaceMember);
      trimmed ? storage.set(DISPLAY_NAME_KEY, trimmed) : storage.remove(DISPLAY_NAME_KEY);
    } catch { setSavingName(false); setLoadError('Network timeout while saving your name. Please retry.'); }
  }
  async function renameCrew(name: string) {
    if (!supabase || !workspace) return;
    const nextName = name.trim(); if (!nextName || nextName === workspace.name) return;
    setRenaming(true); setLoadError(null);
    try {
      const { data, error } = await withTimeout(supabase.from('workspaces').update({ name: nextName }).eq('id', workspace.id).select('*').maybeSingle());
      setRenaming(false);
      if (error || !data) return setLoadError(`Could not rename crew. Please retry${error?.message ? ` (${error.message})` : ''}`);
      await setCurrentWorkspace(data as Workspace);
    } catch { setRenaming(false); setLoadError('Network timeout while renaming crew. Please retry.'); }
  }
  async function ensureTodayPoll(workspaceId: string) {
    if (!supabase) return null;
    const date = todayDateUTC();
    try {
      const existing = await withTimeout(supabase.from('polls').select('*').eq('workspace_id', workspaceId).eq('poll_date', date).maybeSingle());
      if (existing.data) return existing.data as Poll;
      const created = await withTimeout(supabase.from('polls').insert({ workspace_id: workspaceId, poll_date: date, title: "Today's Lunch" }).select('*').single());
      if (created.error || !created.data) { setLoadError('Could not create today poll. Please retry.'); return null; }
      const prevPollRes = await withTimeout(supabase.from('polls').select('id').eq('workspace_id', workspaceId).neq('id', created.data.id).order('poll_date', { ascending: false }).limit(1).maybeSingle());
      const prevPollId = (prevPollRes.data as { id?: string } | null)?.id;
      if (prevPollId) {
        const prevOptionsRes = await withTimeout(supabase.from('poll_options').select('name,source,place_cache_id,menu_url').eq('poll_id', prevPollId).order('created_at'));
        const prevOptions = (prevOptionsRes.data as any[]) || [];
        if (prevOptions.length > 0) {
          await withTimeout(supabase.from('poll_options').insert(prevOptions.map((o) => ({ poll_id: created.data.id, name: o.name, source: o.source || 'manual', place_cache_id: o.place_cache_id || null, menu_url: o.menu_url || null }))));
        }
      }
      return created.data as Poll;
    } catch { setLoadError('Network timeout while loading today poll. Please retry.'); return null; }
  }
  async function refreshPollData(pollId: string, workspaceId: string, voterId: string) {
    if (!supabase) return;
    const [optionsRes, myVoteRes, votesRes, membersRes] = await Promise.all([
      withTimeout(supabase.from('poll_options').select('id,poll_id,name,menu_url,place_cache_id,votes(count),place:places_cache(id,provider,external_place_id,name,formatted_address,rating,price_level,google_maps_url,website_url,detected_menu_url)').eq('poll_id', pollId).order('created_at')),
      withTimeout(supabase.from('votes').select('option_id').eq('poll_id', pollId).eq('voter_id', voterId).maybeSingle()),
      withTimeout(supabase.from('votes').select('option_id,voter_id').eq('poll_id', pollId)),
      withTimeout(supabase.from('workspace_members').select('device_id,display_name').eq('workspace_id', workspaceId)),
    ]);
    if (optionsRes.error) return setLoadError('Could not load poll options. Check internet and retry.');
    const memberNameByDevice = new Map<string, string>();
    ((membersRes.data as any[]) || []).forEach((m) => { const name = (m.display_name || '').trim(); if (name) memberNameByDevice.set(m.device_id, name); });
    const votersByOption = new Map<string, string[]>();
    ((votesRes.data as any[]) || []).forEach((v) => {
      const current = votersByOption.get(v.option_id as string) || [];
      current.push(memberNameByDevice.get(v.voter_id as string) || 'Guest');
      votersByOption.set(v.option_id as string, current);
    });
    const mapped: PollOption[] = ((optionsRes.data as any[]) || []).map((r) => ({ id: r.id, poll_id: r.poll_id, name: r.name, votes: r.votes?.[0]?.count ?? 0, voters: votersByOption.get(r.id) || [], menu_url: r.menu_url, place: r.place || null }));
    setOptions(mapped);
    setMyOptionId((myVoteRes.data as any)?.option_id ?? null);
  }
  async function refreshHistory(workspaceId: string) {
    if (!supabase) return;
    const pollsRes = await withTimeout(supabase.from('polls').select('id,poll_date').eq('workspace_id', workspaceId).order('poll_date', { ascending: false }).limit(30));
    const polls = (pollsRes.data as any[]) || [];
    if (!polls.length) return void (setHistory7Days([]), setHistory30Days([]), setLeaderboard([]));
    const pollIds = polls.map((p) => p.id);
    const optionsRes = await withTimeout(supabase.from('poll_options').select('poll_id,name,votes(count)').in('poll_id', pollIds));
    const byPoll = new Map<string, Array<{ name: string; votes: number }>>();
    ((optionsRes.data as any[]) || []).forEach((o) => { const cur = byPoll.get(o.poll_id) || []; cur.push({ name: o.name, votes: o.votes?.[0]?.count ?? 0 }); byPoll.set(o.poll_id, cur); });
    const summaries = polls.map((p) => {
      const rows = byPoll.get(p.id) || [];
      if (!rows.length) return { poll_date: p.poll_date, winner_name: '', winner_votes: 0 };
      const top = rows.slice().sort((a, b) => b.votes - a.votes)[0];
      return { poll_date: p.poll_date, winner_name: top.votes > 0 ? top.name : '', winner_votes: top.votes };
    });
    const wins = new Map<string, number>();
    summaries.forEach((s) => { if (s.winner_name) wins.set(s.winner_name, (wins.get(s.winner_name) || 0) + 1); });
    setHistory30Days(summaries); setHistory7Days(summaries.slice(0, 7));
    setLeaderboard(Array.from(wins.entries()).map(([name, count]) => ({ name, wins: count })).sort((a, b) => b.wins - a.wins));
  }
  async function fetchPlaceDetails(suggestion: PlaceSuggestion): Promise<PlaceDetailsResponse | null> {
    if (!supabase) return null;
    const supabaseUrl = (supabase as any).supabaseUrl as string; const anonKey = (supabase as any).supabaseKey as string;
    const url = `${supabaseUrl}/functions/v1/places-proxy/details?placeId=${encodeURIComponent(suggestion.externalPlaceId)}`;
    const resp = await withTimeout(fetch(url, { headers: { apikey: anonKey } }));
    if (!resp.ok) throw new Error(`Place details failed (${resp.status})`);
    return await resp.json() as PlaceDetailsResponse;
  }
  async function vote(optionId: string) {
    if (!supabase || !poll || !workspace || !deviceId || votingOptionId) return;
    setVotingOptionId(optionId);
    const { error } = await supabase.from('votes').upsert({ poll_id: poll.id, option_id: optionId, voter_id: deviceId }, { onConflict: 'poll_id,voter_id' });
    if (error) { setVotingOptionId(null); setLoadError(`Vote failed: ${error.message}`); return; }
    await refreshPollData(poll.id, workspace.id, deviceId); await refreshHistory(workspace.id); setVotingOptionId(null);
  }
  async function addOption() {
    if (!supabase || !poll || !workspace || addingOption) return;
    const name = newOption.trim(); if (!name && !selectedSuggestion) return;
    const candidateName = (selectedSuggestion?.name || name).trim().toLowerCase();
    if (options.some((opt) => opt.name.trim().toLowerCase() === candidateName)) return setLoadError('That place is already in today’s poll.');
    setAddingOption(true);
    try {
      if (selectedSuggestion) {
        const details = await fetchPlaceDetails(selectedSuggestion);
        let placeCacheId: string | null = null;
        if (details) {
          const placeRes = await withTimeout(supabase.from('places_cache').select('id').eq('provider', details.provider).eq('external_place_id', details.externalPlaceId).maybeSingle());
          placeCacheId = (placeRes.data as any)?.id || null;
        }
        const { error } = await supabase.from('poll_options').insert({ poll_id: poll.id, name: selectedSuggestion.name, source: 'google_place', place_cache_id: placeCacheId, menu_url: details?.detectedMenuUrl || null });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('poll_options').insert({ poll_id: poll.id, name, source: 'manual' });
        if (error) throw error;
      }
      setNewOption(''); setSelectedSuggestion(null); setSuggestions([]); setLoadError(null);
      await refreshPollData(poll.id, workspace.id, deviceId); await refreshHistory(workspace.id);
    } catch (error: any) { setLoadError(error?.message || 'Could not add option.'); }
    finally { setAddingOption(false); }
  }
  async function shareInvite() {
    if (!workspace || typeof window === 'undefined') return;
    const inviteLink = `${window.location.origin}/app?code=${workspace.invite_code}`;
    try {
      if (navigator.share) { await navigator.share({ title: 'LunchCrew Invite', text: `Join my LunchCrew: ${inviteLink}`, url: inviteLink }); return; }
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(inviteLink); }
    } catch {}
  }
  async function completeOnboarding(name?: string) {
    const trimmed = normalizeDisplayName(name || ''); if (trimmed) storage.set(DISPLAY_NAME_KEY, trimmed);
    storage.set(ONBOARDING_SEEN_KEY, '1'); setOnboardingDone(true);
  }
  async function createNewCrew() { setLoadError(null); await createWorkspace(); }
  async function retryLoad() {
    setLoadError(null);
    if (!workspace) {
      const lastWorkspaceId = storage.get(LAST_WORKSPACE_ID_KEY);
      if (lastWorkspaceId) {
        const restored = await loadWorkspaceById(lastWorkspaceId);
        if (restored) { await setCurrentWorkspace(restored); if (deviceId) await ensureMember(restored.id, deviceId); return; }
      }
      await createWorkspace(); return;
    }
    if (poll && deviceId) { await refreshPollData(poll.id, workspace.id, deviceId); await refreshHistory(workspace.id); return; }
    const todayPoll = await ensureTodayPoll(workspace.id); if (todayPoll) { setPoll(todayPoll); await refreshPollData(todayPoll.id, workspace.id, deviceId); await refreshHistory(workspace.id); }
  }

  useEffect(() => { if (!workspace || !deviceId) return; void ensureMember(workspace.id, deviceId); }, [workspace?.id, deviceId]);
  useEffect(() => { if (!workspace || !deviceId) return; void (async () => { const todayPoll = await ensureTodayPoll(workspace.id); if (!todayPoll) return; setPoll(todayPoll); await refreshPollData(todayPoll.id, workspace.id, deviceId); await refreshHistory(workspace.id); })(); }, [workspace?.id, deviceId]);
  useEffect(() => {
    if (!supabase || !poll || !workspace || !deviceId) return;
    const client = supabase;
    const refresh = () => void refreshPollData(poll.id, workspace.id, deviceId);
    const channel = client.channel(`poll-live:${poll.id}:${workspace.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `poll_id=eq.${poll.id}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_options', filter: `poll_id=eq.${poll.id}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_members', filter: `workspace_id=eq.${workspace.id}` }, refresh)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } return; }
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') && !pollingRef.current) {
          pollingRef.current = setInterval(() => { void refreshPollData(poll.id, workspace.id, deviceId); }, 10000);
        }
      });
    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } void client.removeChannel(channel); };
  }, [poll?.id, workspace?.id, deviceId]);
  useEffect(() => {
    if (!supabase) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const query = newOption.trim();
    if (query.length < 2 || selectedSuggestion) { setSuggestions([]); setLoadingSuggestions(false); return; }
    searchDebounceRef.current = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const supabaseUrl = (supabase as any).supabaseUrl as string; const anonKey = (supabase as any).supabaseKey as string;
        const geo = coords ? `&lat=${coords.lat}&lng=${coords.lng}&radiusMeters=8000` : '';
        const url = `${supabaseUrl}/functions/v1/places-proxy/autocomplete?q=${encodeURIComponent(query)}&regionCode=MX&languageCode=en${geo}`;
        const resp = await withTimeout(fetch(url, { headers: { apikey: anonKey } }));
        if (!resp.ok) throw new Error(`Autocomplete failed (${resp.status})`);
        const payload = await resp.json(); setSuggestions((payload.items || []) as PlaceSuggestion[]);
      } catch { setSuggestions([]); } finally { setLoadingSuggestions(false); }
    }, 350);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [newOption, selectedSuggestion, coords?.lat, coords?.lng]);
  useEffect(() => {
    if (!onboardingReady || !onboardingDone || !workspace?.id) return;
    const joined = storage.get(MONETIZATION_WAITLIST_JOINED_KEY); if (joined === '1') return;
    const now = Date.now(); const lastPromptRaw = storage.get(MONETIZATION_LAST_PROMPT_AT_KEY);
    if (!lastPromptRaw) return void storage.set(MONETIZATION_LAST_PROMPT_AT_KEY, String(now));
    const lastPrompt = Number(lastPromptRaw); if (Number.isFinite(lastPrompt) && now - lastPrompt >= 24 * 60 * 60 * 1000) setShowMonetizationModal(true);
  }, [onboardingReady, onboardingDone, workspace?.id]);

  return {
    BUILD_LABEL, configError, onboardingDone, onboardingReady, completeOnboarding, shareInvite, createNewCrew, retryLoad,
    showMonetizationModal, setShowMonetizationModal, show30DayHistory, setShow30DayHistory,
    workspace, deviceId, member, loading, renaming, savingName, loadError, setLoadError, renameCrew, saveDisplayName,
    poll, options, myOptionId, newOption, setNewOption, votingOptionId, addingOption, topChoice, vote, addOption,
    suggestions, loadingSuggestions, selectedSuggestion, setSelectedSuggestion, history7Days, history30Days, leaderboard,
  };
}
