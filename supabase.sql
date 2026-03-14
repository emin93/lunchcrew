create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  search_area_label text,
  search_area_lat double precision,
  search_area_lng double precision,
  created_at timestamptz not null default now()
);

alter table public.workspaces
  add column if not exists search_area_label text,
  add column if not exists search_area_lat double precision,
  add column if not exists search_area_lng double precision;

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  poll_date date not null,
  title text not null default 'Today''s Lunch',
  created_at timestamptz not null default now(),
  unique (workspace_id, poll_date)
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz not null default now(),
  unique (poll_id, voter_id)
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  device_id text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, device_id)
);

alter table public.workspaces enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.votes enable row level security;
alter table public.workspace_members enable row level security;

-- Open MVP policies (tighten before production)
drop policy if exists "workspaces_select_all" on public.workspaces;
drop policy if exists "workspaces_insert_all" on public.workspaces;
drop policy if exists "workspaces_update_all" on public.workspaces;
create policy "workspaces_select_all" on public.workspaces for select using (true);
create policy "workspaces_insert_all" on public.workspaces for insert with check (true);
create policy "workspaces_update_all" on public.workspaces for update using (true) with check (true);

drop policy if exists "polls_select_all" on public.polls;
drop policy if exists "polls_insert_all" on public.polls;
create policy "polls_select_all" on public.polls for select using (true);
create policy "polls_insert_all" on public.polls for insert with check (true);

drop policy if exists "poll_options_select_all" on public.poll_options;
drop policy if exists "poll_options_insert_all" on public.poll_options;
create policy "poll_options_select_all" on public.poll_options for select using (true);
create policy "poll_options_insert_all" on public.poll_options for insert with check (true);

drop policy if exists "votes_select_all" on public.votes;
drop policy if exists "votes_insert_all" on public.votes;
drop policy if exists "votes_update_all" on public.votes;
create policy "votes_select_all" on public.votes for select using (true);
create policy "votes_insert_all" on public.votes for insert with check (true);
create policy "votes_update_all" on public.votes for update using (true) with check (true);

drop policy if exists "workspace_members_select_all" on public.workspace_members;
drop policy if exists "workspace_members_insert_all" on public.workspace_members;
drop policy if exists "workspace_members_update_all" on public.workspace_members;
create policy "workspace_members_select_all" on public.workspace_members for select using (true);
create policy "workspace_members_insert_all" on public.workspace_members for insert with check (true);
create policy "workspace_members_update_all" on public.workspace_members for update using (true) with check (true);

-- Smart options v1
create table if not exists public.places_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'google',
  external_place_id text not null,
  name text not null,
  formatted_address text,
  lat double precision,
  lng double precision,
  rating numeric,
  user_ratings_total int,
  price_level int,
  business_status text,
  google_maps_url text,
  website_url text,
  detected_menu_url text,
  phone text,
  raw jsonb,
  fetched_at timestamptz not null default now(),
  unique (provider, external_place_id)
);

alter table public.poll_options
  add column if not exists place_cache_id uuid references public.places_cache(id) on delete set null,
  add column if not exists menu_url text,
  add column if not exists source text not null default 'manual';

alter table public.places_cache enable row level security;

drop policy if exists "places_cache_select_all" on public.places_cache;
drop policy if exists "places_cache_insert_all" on public.places_cache;
drop policy if exists "places_cache_update_all" on public.places_cache;
create policy "places_cache_select_all" on public.places_cache for select using (true);
create policy "places_cache_insert_all" on public.places_cache for insert with check (true);
create policy "places_cache_update_all" on public.places_cache for update using (true) with check (true);

-- Analytics v1
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  device_hash text,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at desc);
create index if not exists idx_analytics_events_event_name on public.analytics_events(event_name);

alter table public.analytics_events enable row level security;

drop policy if exists "analytics_events_select_all" on public.analytics_events;
drop policy if exists "analytics_events_insert_all" on public.analytics_events;
create policy "analytics_events_select_all" on public.analytics_events for select using (true);
create policy "analytics_events_insert_all" on public.analytics_events for insert with check (true);

create or replace view public.analytics_daily_overview as
select
  date_trunc('day', created_at)::date as day,
  count(*) as total_events,
  count(distinct coalesce(device_hash, id::text)) as active_devices,
  count(*) filter (where event_name = 'workspace_created') as workspaces_created,
  count(*) filter (where event_name = 'vote_cast') as votes_cast,
  count(*) filter (where event_name = 'poll_option_added') as options_added,
  count(*) filter (where event_name = 'maps_opened') as maps_clicks,
  count(*) filter (where event_name = 'menu_opened') as menu_clicks
from public.analytics_events
group by 1
order by 1 desc;

create or replace view public.analytics_feature_adoption as
select
  date_trunc('day', created_at)::date as day,
  count(*) filter (where event_name = 'poll_option_added') as options_total,
  count(*) filter (
    where event_name = 'poll_option_added'
      and coalesce(props->>'source', 'manual') = 'google_place'
  ) as options_google_place,
  round(
    100.0 * count(*) filter (
      where event_name = 'poll_option_added'
        and coalesce(props->>'source', 'manual') = 'google_place'
    ) / nullif(count(*) filter (where event_name = 'poll_option_added'), 0),
    2
  ) as pct_google_place,
  count(*) filter (where event_name = 'location_permission_result' and props->>'status' = 'granted') as location_granted,
  count(*) filter (where event_name = 'location_permission_result' and props->>'status' = 'denied') as location_denied
from public.analytics_events
group by 1
order by 1 desc;

-- Monetization waitlist v1
create table if not exists public.monetization_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  note text,
  workspace_id uuid references public.workspaces(id) on delete set null,
  source text not null default 'app_card',
  created_at timestamptz not null default now(),
  unique (email)
);

create index if not exists idx_monetization_waitlist_created_at on public.monetization_waitlist(created_at desc);

alter table public.monetization_waitlist enable row level security;

drop policy if exists "monetization_waitlist_select_all" on public.monetization_waitlist;
drop policy if exists "monetization_waitlist_insert_all" on public.monetization_waitlist;
create policy "monetization_waitlist_select_all" on public.monetization_waitlist for select using (true);
create policy "monetization_waitlist_insert_all" on public.monetization_waitlist for insert with check (true);

-- Feedback v1
create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  device_id text,
  display_name text,
  email text,
  message text not null,
  source text not null default 'crew_settings',
  page text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_submissions_created_at on public.feedback_submissions(created_at desc);
create index if not exists idx_feedback_submissions_workspace_id on public.feedback_submissions(workspace_id);

alter table public.feedback_submissions enable row level security;

drop policy if exists "feedback_submissions_select_all" on public.feedback_submissions;
drop policy if exists "feedback_submissions_insert_all" on public.feedback_submissions;
create policy "feedback_submissions_select_all" on public.feedback_submissions for select using (true);
create policy "feedback_submissions_insert_all" on public.feedback_submissions for insert with check (true);
