import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { DEFAULT_OPTIONS, todayDateUTC, withTimeout } from '../lib/helpers';
import { supabase } from '../lib/supabase';
import { PlaceSuggestion, Poll, PollOption, Workspace } from '../types';

type Params = {
  workspace: Workspace | null;
  deviceId: string;
  onLoadError: (msg: string | null) => void;
};

type PlaceDetailsResponse = {
  provider: string;
  externalPlaceId: string;
  name: string;
  formattedAddress?: string | null;
  rating?: number | null;
  priceLevel?: number | null;
  googleMapsUrl?: string | null;
  websiteUrl?: string | null;
  detectedMenuUrl?: string | null;
};

export function usePollData({ workspace, deviceId, onLoadError }: Params) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [myOptionId, setMyOptionId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState('');
  const [votingOptionId, setVotingOptionId] = useState<string | null>(null);
  const [addingOption, setAddingOption] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<PlaceSuggestion | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureTodayPoll = async (workspaceId: string) => {
    if (!supabase) return null;
    const date = todayDateUTC();

    try {
      const existing = await withTimeout(
        supabase.from('polls').select('*').eq('workspace_id', workspaceId).eq('poll_date', date).maybeSingle(),
      );
      if (existing.data) return existing.data as Poll;

      const created = await withTimeout(
        supabase
          .from('polls')
          .insert({ workspace_id: workspaceId, poll_date: date, title: "Today's Lunch" })
          .select('*')
          .single(),
      );
      if (created.error || !created.data) {
        onLoadError('Could not create today poll. Please retry.');
        return null;
      }

      await withTimeout(supabase.from('poll_options').insert(DEFAULT_OPTIONS.map((name) => ({ poll_id: created.data.id, name }))));
      return created.data as Poll;
    } catch {
      onLoadError('Network timeout while loading today poll. Please retry.');
      return null;
    }
  };

  const fetchPlaceDetails = async (suggestion: PlaceSuggestion): Promise<PlaceDetailsResponse | null> => {
    if (!supabase) return null;
    const supabaseUrl = (supabase as any).supabaseUrl as string;
    const anonKey = (supabase as any).supabaseKey as string;

    const url = `${supabaseUrl}/functions/v1/places-proxy/details?placeId=${encodeURIComponent(suggestion.externalPlaceId)}`;
    const resp = await withTimeout(
      fetch(url, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }),
    );

    if (!resp.ok) {
      throw new Error(`Place details failed (${resp.status})`);
    }

    return (await resp.json()) as PlaceDetailsResponse;
  };

  const refreshPollData = async (pollId: string, workspaceId: string, voterId: string) => {
    if (!supabase) return;
    const [optionsRes, myVoteRes, votesRes, membersRes] = await Promise.all([
      withTimeout(
        supabase
          .from('poll_options')
          .select(
            'id,poll_id,name,menu_url,place_cache_id,votes(count),place:places_cache(id,provider,external_place_id,name,formatted_address,rating,price_level,google_maps_url,website_url,detected_menu_url)',
          )
          .eq('poll_id', pollId)
          .order('created_at'),
      ),
      withTimeout(supabase.from('votes').select('option_id').eq('poll_id', pollId).eq('voter_id', voterId).maybeSingle()),
      withTimeout(supabase.from('votes').select('option_id,voter_id').eq('poll_id', pollId)),
      withTimeout(supabase.from('workspace_members').select('device_id,display_name').eq('workspace_id', workspaceId)),
    ]);

    if (optionsRes.error) return onLoadError('Could not load poll options. Check internet and retry.');

    const memberNameByDevice = new Map<string, string>();
    ((membersRes.data as any[]) || []).forEach((m) => {
      const name = (m.display_name || '').trim();
      if (name) memberNameByDevice.set(m.device_id, name);
    });

    const votersByOption = new Map<string, string[]>();
    ((votesRes.data as any[]) || []).forEach((v) => {
      const optionId = v.option_id as string;
      const voterIdForVote = v.voter_id as string;
      const label = memberNameByDevice.get(voterIdForVote) || 'Guest';
      const current = votersByOption.get(optionId) || [];
      current.push(label);
      votersByOption.set(optionId, current);
    });

    const mapped: PollOption[] = ((optionsRes.data as any[]) || []).map((r) => ({
      id: r.id,
      poll_id: r.poll_id,
      name: r.name,
      votes: r.votes?.[0]?.count ?? 0,
      voters: votersByOption.get(r.id) || [],
      menu_url: r.menu_url,
      place: r.place || null,
    }));

    setOptions(mapped);
    setMyOptionId((myVoteRes.data as any)?.option_id ?? null);
  };

  const vote = async (optionId: string) => {
    if (!supabase || !poll || !workspace || !deviceId || votingOptionId) return;
    setVotingOptionId(optionId);
    const { error } = await supabase
      .from('votes')
      .upsert({ poll_id: poll.id, option_id: optionId, voter_id: deviceId }, { onConflict: 'poll_id,voter_id' });
    if (error) {
      setVotingOptionId(null);
      return Alert.alert('Vote failed', error.message);
    }
    await refreshPollData(poll.id, workspace.id, deviceId);
    setVotingOptionId(null);
  };

  const addOption = async () => {
    if (!supabase || !poll || !workspace || addingOption) return;
    const name = newOption.trim();
    if (!name) return;

    setAddingOption(true);
    try {
      if (selectedSuggestion) {
        const details = await fetchPlaceDetails(selectedSuggestion);
        let placeCacheId: string | null = null;

        if (details) {
          const placeRes = await withTimeout(
            supabase
              .from('places_cache')
              .select('id')
              .eq('provider', details.provider)
              .eq('external_place_id', details.externalPlaceId)
              .maybeSingle(),
          );
          placeCacheId = (placeRes.data as any)?.id || null;
        }

        const { error } = await supabase.from('poll_options').insert({
          poll_id: poll.id,
          name: selectedSuggestion.name,
          source: 'google_place',
          place_cache_id: placeCacheId,
          menu_url: details?.detectedMenuUrl || null,
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.from('poll_options').insert({ poll_id: poll.id, name, source: 'manual' });
        if (error) throw error;
      }

      setNewOption('');
      setSelectedSuggestion(null);
      setSuggestions([]);
      await refreshPollData(poll.id, workspace.id, deviceId);
    } catch (error: any) {
      Alert.alert('Could not add option', error?.message || 'Unknown error');
    } finally {
      setAddingOption(false);
    }
  };

  const retryPollLoad = async () => {
    onLoadError(null);
    if (workspace && deviceId) {
      const todayPoll = await ensureTodayPoll(workspace.id);
      if (todayPoll) {
        setPoll(todayPoll);
        await refreshPollData(todayPoll.id, workspace.id, deviceId);
      }
    }
  };

  useEffect(() => {
    if (!workspace || !deviceId) return;
    const load = async () => {
      const todayPoll = await ensureTodayPoll(workspace.id);
      if (!todayPoll) return;
      setPoll(todayPoll);
      await refreshPollData(todayPoll.id, workspace.id, deviceId);
    };
    void load();
  }, [workspace, deviceId]);

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
        const supabaseUrl = (supabase as any).supabaseUrl as string;
        const anonKey = (supabase as any).supabaseKey as string;
        const url = `${supabaseUrl}/functions/v1/places-proxy/autocomplete?q=${encodeURIComponent(query)}&regionCode=MX&languageCode=en`;
        const resp = await withTimeout(
          fetch(url, {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
            },
          }),
        );

        if (!resp.ok) throw new Error(`Autocomplete failed (${resp.status})`);

        const payload = await resp.json();
        setSuggestions((payload.items || []) as PlaceSuggestion[]);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [newOption, selectedSuggestion]);

  // Realtime websocket subscriptions for live sync.
  // Fallback: start a slower poll loop only if realtime fails.
  useEffect(() => {
    if (!supabase || !poll || !workspace || !deviceId) return;

    const client = supabase;
    const refresh = () => void refreshPollData(poll.id, workspace.id, deviceId);

    const channel = client
      .channel(`poll-live:${poll.id}:${workspace.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `poll_id=eq.${poll.id}` }, refresh)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_options', filter: `poll_id=eq.${poll.id}` },
        refresh,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workspace_members', filter: `workspace_id=eq.${workspace.id}` },
        refresh,
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          return;
        }

        // If websocket can't subscribe, use lightweight polling fallback.
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

  const topChoice = useMemo(() => options.slice().sort((a, b) => b.votes - a.votes)[0]?.name, [options]);

  return {
    poll,
    options,
    myOptionId,
    newOption,
    setNewOption,
    votingOptionId,
    addingOption,
    topChoice,
    vote,
    addOption,
    retryPollLoad,
    suggestions,
    loadingSuggestions,
    selectedSuggestion,
    setSelectedSuggestion,
  };
}
