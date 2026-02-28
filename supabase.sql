-- LunchCrew minimal MVP schema
create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

-- MVP policy: open read/write for fast prototyping.
-- Tighten this before production.
create policy if not exists "workspaces_select_all"
  on public.workspaces for select
  using (true);

create policy if not exists "workspaces_insert_all"
  on public.workspaces for insert
  with check (true);
