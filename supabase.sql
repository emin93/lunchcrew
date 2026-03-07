create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

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
