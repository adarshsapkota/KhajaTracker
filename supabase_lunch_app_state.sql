create table if not exists public.lunch_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  members jsonb not null default '[]'::jsonb,
  records jsonb not null default '[]'::jsonb,
  payments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lunch_app_state
add column if not exists payments jsonb not null default '[]'::jsonb;

alter table public.lunch_app_state enable row level security;

drop policy if exists "Users can view own lunch app state" on public.lunch_app_state;
create policy "Users can view own lunch app state"
on public.lunch_app_state
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own lunch app state" on public.lunch_app_state;
create policy "Users can insert own lunch app state"
on public.lunch_app_state
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own lunch app state" on public.lunch_app_state;
create policy "Users can update own lunch app state"
on public.lunch_app_state
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own lunch app state" on public.lunch_app_state;
create policy "Users can delete own lunch app state"
on public.lunch_app_state
for delete
using (auth.uid() = user_id);
