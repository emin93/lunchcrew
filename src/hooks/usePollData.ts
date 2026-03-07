import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { DEFAULT_OPTIONS, todayDateUTC, withTimeout } from '../lib/helpers';
import { supabase } from '../lib/supabase';
import { Poll, PollOption, Workspace } from '../types';

type Params = {
  workspace: Workspace | null;
  deviceId: string;
  onLoadError: (msg: string | null) => void;
};

export function usePollData({ workspace, deviceId, onLoadError }: Params) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [myOptionId, setMyOptionId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState('');
  const [votingOptionId, setVotingOptionId] = useState<string | null>(null);
  const [addingOption, setAddingOption] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const refreshPollData = async (pollId: string, workspaceId: string, voterId: string) => {
    if (!supabase) return;
    const [optionsRes, myVoteRes, votesRes, membersRes] = await Promise.all([
      withTimeout(supabase.from('poll_options').select('id,poll_id,name,votes(count)').eq('poll_id', pollId).order('created_at')),
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
    const { error } = await supabase.from('poll_options').insert({ poll_id: poll.id, name });
    if (error) {
      setAddingOption(false);
      return Alert.alert('Could not add option', error.message);
    }

    setNewOption('');
    await refreshPollData(poll.id, workspace.id, deviceId);
    setAddingOption(false);
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

  // Live-ish sync across tabs/devices via lightweight polling fallback.
  useEffect(() => {
    if (!poll || !workspace || !deviceId) return;

    pollingRef.current = setInterval(() => {
      void refreshPollData(poll.id, workspace.id, deviceId);
    }, 4000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
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
  };
}
