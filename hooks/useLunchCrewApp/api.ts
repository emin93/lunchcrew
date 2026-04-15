import type { SupabaseClient } from '@supabase/supabase-js';
import { workspacePath, withTimeout, todayDateUTC } from '@/lib/helpers';
import type { PlaceSuggestion, Poll, Workspace, WorkspaceMember, WorkspaceRole } from '@/lib/types';
import type {
  FeedbackPayload,
  HistoryResult,
  PlaceDetailsResponse,
  PollDataResult,
  SearchArea,
  SearchAreaResponse,
  SuggestionsResult,
  WorkspaceRolesResult,
} from './types';

function getSupabaseFetchContext(client: SupabaseClient) {
  const supabaseUrl = (client as any).supabaseUrl as string;
  const anonKey = (client as any).supabaseKey as string;
  return { anonKey, supabaseUrl };
}

export async function loadWorkspaceById(client: SupabaseClient, workspaceId: string) {
  const { data, error } = await withTimeout(client.from('workspaces').select('*').eq('id', workspaceId).maybeSingle());
  if (error || !data) return null;
  return data as Workspace;
}

export async function fetchWorkspaceRoles(client: SupabaseClient, workspaceId: string, userId?: string) {
  const { data, error } = await withTimeout(
    client.from('workspace_roles').select('workspace_id,user_id,role,created_at,id').eq('workspace_id', workspaceId),
  );
  if (error) return null;
  const roles = (data || []) as WorkspaceRole[];
  const result: WorkspaceRolesResult = {
    workspaceHasOwner: roles.some((entry) => entry.role === 'owner'),
    workspaceRole: roles.find((entry) => entry.user_id === userId)?.role ?? null,
  };
  return result;
}

export async function saveWorkspaceSearchArea(client: SupabaseClient, workspaceId: string, area: SearchArea | null) {
  const updates = area
    ? { search_area_label: area.label, search_area_lat: area.lat, search_area_lng: area.lng }
    : { search_area_label: null, search_area_lat: null, search_area_lng: null };
  const { data, error } = await withTimeout(client.from('workspaces').update(updates).eq('id', workspaceId).select('*').single());
  if (error || !data) return null;
  return data as Workspace;
}

export async function requestMagicLink(
  client: SupabaseClient,
  email: string,
  mode: 'claim' | 'signin',
  inviteCode?: string,
) {
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}${inviteCode ? workspacePath(inviteCode.toUpperCase(), 'crew') : window.location.pathname}`
    : undefined;
  return client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: mode === 'claim',
    },
  });
}

export async function startFoundingCheckout(
  client: SupabaseClient,
  workspaceId: string,
) {
  const { data: sessionData } = await client.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) return { accessToken: null, data: null, error: { message: 'missing_access_token' } };
  const response = await client.functions.invoke('stripe-create-checkout', {
    body: { workspaceId },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return { ...response, accessToken };
}

export async function claimWorkspace(client: SupabaseClient, workspaceId: string, userId: string) {
  return withTimeout(
    client.from('workspace_roles').upsert(
      { workspace_id: workspaceId, user_id: userId, role: 'owner' },
      { onConflict: 'workspace_id,user_id' },
    ),
  );
}

export async function ensureMember(client: SupabaseClient, workspaceId: string, deviceId: string) {
  const inserted = await withTimeout(
    client.from('workspace_members').upsert(
      { workspace_id: workspaceId, device_id: deviceId },
      { onConflict: 'workspace_id,device_id' },
    ).select('*').maybeSingle(),
  );
  if (inserted.error) return { error: inserted.error, member: null as WorkspaceMember | null };
  return { error: null, member: (inserted.data as WorkspaceMember | null) };
}

export async function updateMemberDisplayName(client: SupabaseClient, workspaceId: string, deviceId: string, displayName: string | null) {
  return withTimeout(
    client.from('workspace_members').upsert(
      { workspace_id: workspaceId, device_id: deviceId, display_name: displayName },
      { onConflict: 'workspace_id,device_id' },
    ).select('*').maybeSingle(),
  );
}

export async function createWorkspace(client: SupabaseClient, inviteCode: string) {
  const { data, error } = await withTimeout(
    client.from('workspaces').insert({ name: 'LunchCrew', invite_code: inviteCode }).select('*').single(),
  );
  if (error || !data) return null;
  return data as Workspace;
}

export async function joinWorkspaceByCode(client: SupabaseClient, code: string) {
  const { data, error } = await withTimeout(client.from('workspaces').select('*').eq('invite_code', code).single());
  if (error || !data) return null;
  return data as Workspace;
}

export async function renameWorkspace(client: SupabaseClient, workspaceId: string, name: string) {
  const { data, error } = await withTimeout(
    client.from('workspaces').update({ name }).eq('id', workspaceId).select('*').maybeSingle(),
  );
  if (error || !data) return null;
  return data as Workspace;
}

export async function ensureTodayPoll(client: SupabaseClient, workspaceId: string) {
  const date = todayDateUTC();
  const existing = await withTimeout(client.from('polls').select('*').eq('workspace_id', workspaceId).eq('poll_date', date).maybeSingle());
  if (existing.data) return existing.data as Poll;

  const created = await withTimeout(
    client.from('polls').insert({ workspace_id: workspaceId, poll_date: date, title: "Today's Lunch" }).select('*').single(),
  );
  if (created.error || !created.data) return null;

  const prevPollRes = await withTimeout(
    client.from('polls').select('id').eq('workspace_id', workspaceId).neq('id', created.data.id).order('poll_date', { ascending: false }).limit(1).maybeSingle(),
  );
  const prevPollId = (prevPollRes.data as { id?: string } | null)?.id;
  if (prevPollId) {
    const prevOptionsRes = await withTimeout(
      client.from('poll_options').select('name,source,place_cache_id,menu_url').eq('poll_id', prevPollId).order('created_at'),
    );
    const prevOptions = (prevOptionsRes.data as any[]) || [];
    if (prevOptions.length > 0) {
      await withTimeout(
        client.from('poll_options').insert(
          prevOptions.map((option) => ({
            poll_id: created.data.id,
            name: option.name,
            source: option.source || 'manual',
            place_cache_id: option.place_cache_id || null,
            menu_url: option.menu_url || null,
          })),
        ),
      );
    }
  }

  return created.data as Poll;
}

export async function refreshPollData(client: SupabaseClient, pollId: string, workspaceId: string, voterId: string) {
  const [optionsRes, myVoteRes, votesRes, membersRes] = await Promise.all([
    withTimeout(
      client.from('poll_options')
        .select('id,poll_id,name,menu_url,place_cache_id,votes(count),place:places_cache(id,provider,external_place_id,name,formatted_address,rating,price_level,google_maps_url,website_url,detected_menu_url)')
        .eq('poll_id', pollId)
        .order('created_at'),
    ),
    withTimeout(client.from('votes').select('option_id').eq('poll_id', pollId).eq('voter_id', voterId).maybeSingle()),
    withTimeout(client.from('votes').select('option_id,voter_id').eq('poll_id', pollId)),
    withTimeout(client.from('workspace_members').select('device_id,display_name').eq('workspace_id', workspaceId)),
  ]);

  if (optionsRes.error) return null;

  const memberNameByDevice = new Map<string, string>();
  ((membersRes.data as any[]) || []).forEach((member) => {
    const name = (member.display_name || '').trim();
    if (name) memberNameByDevice.set(member.device_id, name);
  });

  const votersByOption = new Map<string, string[]>();
  ((votesRes.data as any[]) || []).forEach((vote) => {
    const current = votersByOption.get(vote.option_id as string) || [];
    current.push(memberNameByDevice.get(vote.voter_id as string) || 'Guest');
    votersByOption.set(vote.option_id as string, current);
  });

  const result: PollDataResult = {
    myOptionId: (myVoteRes.data as any)?.option_id ?? null,
    options: ((optionsRes.data as any[]) || []).map((row) => ({
      id: row.id,
      poll_id: row.poll_id,
      name: row.name,
      votes: row.votes?.[0]?.count ?? 0,
      voters: votersByOption.get(row.id) || [],
      menu_url: row.menu_url,
      place: row.place || null,
    })),
  };

  return result;
}

export async function refreshHistory(client: SupabaseClient, workspaceId: string) {
  const pollsRes = await withTimeout(
    client.from('polls').select('id,poll_date').eq('workspace_id', workspaceId).order('poll_date', { ascending: false }).limit(30),
  );
  const polls = (pollsRes.data as any[]) || [];
  if (!polls.length) {
    return {
      history7Days: [],
      history30Days: [],
      leaderboard: [],
    } satisfies HistoryResult;
  }

  const pollIds = polls.map((poll) => poll.id);
  const optionsRes = await withTimeout(client.from('poll_options').select('poll_id,name,votes(count)').in('poll_id', pollIds));
  const byPoll = new Map<string, Array<{ name: string; votes: number }>>();
  ((optionsRes.data as any[]) || []).forEach((option) => {
    const current = byPoll.get(option.poll_id) || [];
    current.push({ name: option.name, votes: option.votes?.[0]?.count ?? 0 });
    byPoll.set(option.poll_id, current);
  });

  const history30Days = polls.map((poll) => {
    const rows = byPoll.get(poll.id) || [];
    if (!rows.length) return { poll_date: poll.poll_date, winner_name: '', winner_votes: 0 };
    const top = rows.slice().sort((a, b) => b.votes - a.votes)[0];
    return { poll_date: poll.poll_date, winner_name: top.votes > 0 ? top.name : '', winner_votes: top.votes };
  });

  const wins = new Map<string, number>();
  history30Days.forEach((summary) => {
    if (summary.winner_name) wins.set(summary.winner_name, (wins.get(summary.winner_name) || 0) + 1);
  });

  return {
    history7Days: history30Days.slice(0, 7),
    history30Days,
    leaderboard: Array.from(wins.entries())
      .map(([name, count]) => ({ name, wins: count }))
      .sort((a, b) => b.wins - a.wins),
  } satisfies HistoryResult;
}

export async function fetchPlaceDetails(client: SupabaseClient, suggestion: PlaceSuggestion): Promise<PlaceDetailsResponse | null> {
  const { anonKey, supabaseUrl } = getSupabaseFetchContext(client);
  const url = `${supabaseUrl}/functions/v1/places-proxy/details?placeId=${encodeURIComponent(suggestion.externalPlaceId)}`;
  const resp = await withTimeout(fetch(url, { headers: { apikey: anonKey } }));
  if (!resp.ok) throw new Error(`Place details failed (${resp.status})`);
  return await resp.json() as PlaceDetailsResponse;
}

export async function lookupSearchArea(client: SupabaseClient, { query, lat, lng }: { query?: string; lat?: number; lng?: number }) {
  const { anonKey, supabaseUrl } = getSupabaseFetchContext(client);
  const params = new URLSearchParams({ regionCode: 'MX', languageCode: 'en' });
  const cleanQuery = (query || '').trim();
  if (cleanQuery) params.set('q', cleanQuery);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    params.set('lat', String(lat));
    params.set('lng', String(lng));
  }
  const url = `${supabaseUrl}/functions/v1/places-proxy/geocode?${params.toString()}`;
  const resp = await withTimeout(fetch(url, { headers: { apikey: anonKey } }));
  const payload = await resp.json().catch(() => ({} as any));
  if (!resp.ok) {
    const details = [payload?.googleStatus, payload?.googleMessage].filter(Boolean).join(': ');
    throw new Error(details ? `Area lookup failed - ${details}` : `Area lookup failed (${resp.status})`);
  }
  return (payload as SearchAreaResponse).item ?? null;
}

export async function searchPlaceSuggestions(client: SupabaseClient, query: string, activeSearchCoords?: { lat: number; lng: number } | null) {
  const { anonKey, supabaseUrl } = getSupabaseFetchContext(client);
  const geo = activeSearchCoords ? `&lat=${activeSearchCoords.lat}&lng=${activeSearchCoords.lng}&radiusMeters=8000` : '';
  const url = `${supabaseUrl}/functions/v1/places-proxy/autocomplete?q=${encodeURIComponent(query)}&regionCode=MX&languageCode=en${geo}`;
  const resp = await withTimeout(fetch(url, { headers: { apikey: anonKey } }));
  if (!resp.ok) throw new Error(`Autocomplete failed (${resp.status})`);
  const payload = await resp.json();
  return (payload.items || []) as SuggestionsResult;
}

export async function submitFeedback(client: SupabaseClient, payload: FeedbackPayload) {
  return client.from('feedback_submissions').insert({
    workspace_id: payload.workspace?.id ?? null,
    device_id: payload.deviceId || null,
    display_name: payload.displayName || null,
    email: payload.email || null,
    message: payload.message,
    source: payload.source,
    page: payload.page ?? null,
    metadata: {
      invite_code: payload.workspace?.invite_code ?? null,
      search_area_label: payload.activeSearchAreaLabel ?? null,
    },
  });
}

export async function upsertVote(client: SupabaseClient, pollId: string, optionId: string, voterId: string) {
  return client.from('votes').upsert({ poll_id: pollId, option_id: optionId, voter_id: voterId }, { onConflict: 'poll_id,voter_id' });
}

export async function findCachedPlaceId(client: SupabaseClient, details: PlaceDetailsResponse) {
  const placeRes = await withTimeout(
    client.from('places_cache').select('id').eq('provider', details.provider).eq('external_place_id', details.externalPlaceId).maybeSingle(),
  );
  return (placeRes.data as any)?.id || null;
}

export async function addPlaceOption(
  client: SupabaseClient,
  pollId: string,
  suggestion: PlaceSuggestion,
  placeCacheId: string | null,
  menuUrl: string | null,
) {
  return client.from('poll_options').insert({
    poll_id: pollId,
    name: suggestion.name,
    source: 'google_place',
    place_cache_id: placeCacheId,
    menu_url: menuUrl,
  });
}

export async function addManualOption(client: SupabaseClient, pollId: string, name: string) {
  return client.from('poll_options').insert({ poll_id: pollId, name, source: 'manual' });
}

export async function removePollOption(client: SupabaseClient, pollId: string, optionId: string) {
  return withTimeout(client.from('poll_options').delete().eq('id', optionId).eq('poll_id', pollId));
}
