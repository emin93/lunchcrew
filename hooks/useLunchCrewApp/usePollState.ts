'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { HistoryDaySummary, LeaderboardPlace, PlaceSuggestion, Poll, PollOption, Workspace, WorkspaceMember } from '@/lib/types';
import {
  addManualOption,
  addPlaceOption,
  ensureTodayPoll as ensureTodayPollRecord,
  fetchPlaceDetails,
  findCachedPlaceId,
  refreshHistory as refreshHistoryRecord,
  refreshPollData as refreshPollDataRecord,
  removePollOption,
  searchPlaceSuggestions,
  upsertVote,
} from './api';

type Params = {
  activeSearchCoords: { lat: number; lng: number } | null;
  deviceId: string;
  member: WorkspaceMember | null;
  setLoadError: (value: string | null) => void;
  workspace: Workspace | null;
};

export function usePollState({ activeSearchCoords, deviceId, member, setLoadError, workspace }: Params) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [pollDataReady, setPollDataReady] = useState(false);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [myOptionId, setMyOptionId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState('');
  const [votingOptionId, setVotingOptionId] = useState<string | null>(null);
  const [addingOption, setAddingOption] = useState(false);
  const [removingOptionId, setRemovingOptionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<PlaceSuggestion | null>(null);
  const [history7Days, setHistory7Days] = useState<HistoryDaySummary[]>([]);
  const [history30Days, setHistory30Days] = useState<HistoryDaySummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlace[]>([]);
  const [historyDataReady, setHistoryDataReady] = useState(false);
  const [show30DayHistory, setShow30DayHistory] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const topChoice = useMemo(() => options.slice().sort((a, b) => b.votes - a.votes)[0]?.name, [options]);

  async function ensureTodayPoll(workspaceId: string) {
    if (!supabase) return null;
    try {
      const todayPoll = await ensureTodayPollRecord(supabase, workspaceId);
      if (!todayPoll) setLoadError('Could not create today poll. Please retry.');
      return todayPoll;
    } catch {
      setLoadError('Network timeout while loading today poll. Please retry.');
      return null;
    }
  }

  async function refreshPollData(pollId: string, workspaceId: string, voterId: string) {
    if (!supabase) return;
    const data = await refreshPollDataRecord(supabase, pollId, workspaceId, voterId);
    if (!data) return setLoadError('Could not load poll options. Check internet and retry.');
    setOptions(data.options);
    setMyOptionId(data.myOptionId);
    setPollDataReady(true);
  }

  async function refreshHistory(workspaceId: string) {
    if (!supabase) return;
    setHistoryDataReady(false);
    const data = await refreshHistoryRecord(supabase, workspaceId);
    setHistory7Days(data.history7Days);
    setHistory30Days(data.history30Days);
    setLeaderboard(data.leaderboard);
    setHistoryDataReady(true);
  }

  async function vote(optionId: string) {
    if (!supabase || !poll || !workspace || !deviceId || votingOptionId) return;
    if (myOptionId === optionId) return;

    const previousOptionId = myOptionId;
    const previousOptions = options;
    const voterName = (member?.display_name || '').trim() || 'Guest';

    setVotingOptionId(optionId);
    setLoadError(null);
    setMyOptionId(optionId);
    setOptions((current) => current.map((opt) => {
      const withoutMe = opt.voters.filter((v) => v !== voterName);
      const wasMine = opt.id === previousOptionId;
      const isNext = opt.id === optionId;
      return {
        ...opt,
        votes: wasMine ? Math.max(0, opt.votes - 1) : isNext ? opt.votes + 1 : opt.votes,
        voters: isNext ? [...withoutMe, voterName] : withoutMe,
      };
    }));

    const { error } = await upsertVote(supabase, poll.id, optionId, deviceId);
    if (error) {
      setOptions(previousOptions);
      setMyOptionId(previousOptionId);
      setVotingOptionId(null);
      setLoadError(`Vote failed: ${error.message}`);
      return;
    }
    await refreshPollData(poll.id, workspace.id, deviceId);
    await refreshHistory(workspace.id);
    setVotingOptionId(null);
  }

  async function addOption(suggestionArg?: PlaceSuggestion | null) {
    if (!supabase || !poll || !workspace || addingOption) return false;
    const suggestion = suggestionArg ?? selectedSuggestion;
    const name = newOption.trim();
    if (!name && !suggestion) return false;
    const candidateName = (suggestion?.name || name).trim().toLowerCase();
    if (options.some((opt) => opt.name.trim().toLowerCase() === candidateName)) {
      setLoadError('That place is already in today’s shortlist. You can see it in the shortlist panel below.');
      return false;
    }
    setAddingOption(true);
    try {
      if (suggestion) {
        const details = await fetchPlaceDetails(supabase, suggestion);
        const placeCacheId = details ? await findCachedPlaceId(supabase, details) : null;
        const { error } = await addPlaceOption(supabase, poll.id, suggestion, placeCacheId, details?.detectedMenuUrl || null);
        if (error) throw error;
      } else {
        const { error } = await addManualOption(supabase, poll.id, name);
        if (error) throw error;
      }
      setNewOption('');
      setSelectedSuggestion(null);
      setSuggestions([]);
      setLoadError(null);
      await refreshPollData(poll.id, workspace.id, deviceId);
      await refreshHistory(workspace.id);
      return true;
    } catch (error: any) {
      setLoadError(error?.message || 'Could not add option.');
      return false;
    } finally {
      setAddingOption(false);
    }
  }

  async function removeOption(optionId: string) {
    if (!supabase || !poll || !workspace || removingOptionId) return false;
    setRemovingOptionId(optionId);
    setLoadError(null);
    try {
      const { error } = await removePollOption(supabase, poll.id, optionId);
      if (error) throw error;
      if (myOptionId === optionId) setMyOptionId(null);
      await refreshPollData(poll.id, workspace.id, deviceId);
      await refreshHistory(workspace.id);
      return true;
    } catch (error: any) {
      setLoadError(error?.message || 'Could not remove place.');
      return false;
    } finally {
      setRemovingOptionId(null);
    }
  }

  useEffect(() => {
    if (!workspace || !deviceId) return;
    void (async () => {
      setPollDataReady(false);
      setHistoryDataReady(false);
      const todayPoll = await ensureTodayPoll(workspace.id);
      if (!todayPoll) return;
      setPoll(todayPoll);
      await refreshPollData(todayPoll.id, workspace.id, deviceId);
      await refreshHistory(workspace.id);
    })();
  }, [workspace?.id, deviceId]);

  useEffect(() => {
    if (!supabase || !poll || !workspace || !deviceId) return;
    const client = supabase;
    const refresh = () => void refreshPollData(poll.id, workspace.id, deviceId);
    const channel = client.channel(`poll-live:${poll.id}:${workspace.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `poll_id=eq.${poll.id}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_options', filter: `poll_id=eq.${poll.id}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_members', filter: `workspace_id=eq.${workspace.id}` }, refresh)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          return;
        }
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') && !pollingRef.current) {
          pollingRef.current = setInterval(() => {
            void refreshPollData(poll.id, workspace.id, deviceId);
          }, 10000);
        }
      });
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      void client.removeChannel(channel);
    };
  }, [poll?.id, workspace?.id, deviceId]);

  useEffect(() => {
    if (!supabase) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const query = newOption.trim();
    if (query.length < 2 || selectedSuggestion) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const nextSuggestions = await searchPlaceSuggestions(supabase, query, activeSearchCoords);
        setSuggestions(nextSuggestions);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [newOption, selectedSuggestion, activeSearchCoords?.lat, activeSearchCoords?.lng]);

  return {
    poll,
    pollDataReady,
    options,
    myOptionId,
    newOption,
    votingOptionId,
    addingOption,
    removingOptionId,
    suggestions,
    loadingSuggestions,
    selectedSuggestion,
    history7Days,
    history30Days,
    leaderboard,
    historyDataReady,
    show30DayHistory,
    topChoice,
    setPoll,
    setPollDataReady,
    setHistoryDataReady,
    setNewOption,
    setSelectedSuggestion,
    setShow30DayHistory,
    ensureTodayPoll,
    refreshPollData,
    refreshHistory,
    vote,
    addOption,
    removeOption,
  };
}
