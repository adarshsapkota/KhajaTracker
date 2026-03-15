create extension if not exists pgcrypto;

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

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_profiles_username_lower_idx
on public.user_profiles (lower(username));

alter table public.user_profiles enable row level security;

drop policy if exists "Authenticated users can read profiles" on public.user_profiles;
create policy "Authenticated users can read profiles"
on public.user_profiles
for select
to authenticated
using (true);

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
on public.user_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, username, display_name)
  values (
    new.id,
    lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))),
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set
    username = excluded.username,
    display_name = excluded.display_name,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

create table if not exists public.lunch_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.lunch_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.lunch_groups(id) on delete cascade,
  invited_user_id uuid not null references auth.users(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create unique index if not exists group_invites_pending_unique_idx
on public.group_invites (group_id, invited_user_id)
where status = 'pending';

create table if not exists public.group_app_state (
  group_id uuid primary key references public.lunch_groups(id) on delete cascade,
  records jsonb not null default '[]'::jsonb,
  payments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lunch_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;
alter table public.group_app_state enable row level security;

create or replace function public.is_group_member(target_group_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id and gm.user_id = target_user_id
  );
$$;

create or replace function public.is_group_owner(target_group_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lunch_groups g
    where g.id = target_group_id and g.created_by = target_user_id
  );
$$;

drop policy if exists "Group members can view groups" on public.lunch_groups;
create policy "Group members can view groups"
on public.lunch_groups
for select
to authenticated
using (
  public.is_group_member(lunch_groups.id, auth.uid())
);

drop policy if exists "Authenticated can create groups" on public.lunch_groups;
create policy "Authenticated can create groups"
on public.lunch_groups
for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "Owners can update groups" on public.lunch_groups;
create policy "Owners can update groups"
on public.lunch_groups
for update
to authenticated
using (public.is_group_owner(lunch_groups.id, auth.uid()))
with check (public.is_group_owner(lunch_groups.id, auth.uid()));

drop policy if exists "Owners can delete groups" on public.lunch_groups;
create policy "Owners can delete groups"
on public.lunch_groups
for delete
to authenticated
using (public.is_group_owner(lunch_groups.id, auth.uid()));

drop policy if exists "Group members can view membership" on public.group_members;
create policy "Group members can view membership"
on public.group_members
for select
to authenticated
using (
  public.is_group_member(group_members.group_id, auth.uid())
);

drop policy if exists "Owners or self can add membership" on public.group_members;
create policy "Owners or self can add membership"
on public.group_members
for insert
to authenticated
with check (
  auth.uid() = user_id
  or public.is_group_owner(group_members.group_id, auth.uid())
);

drop policy if exists "Owners can remove membership" on public.group_members;
create policy "Owners can remove membership"
on public.group_members
for delete
to authenticated
using (
  public.is_group_owner(group_members.group_id, auth.uid())
  or auth.uid() = group_members.user_id
);

drop policy if exists "Users can view their invites or group owners" on public.group_invites;
create policy "Users can view their invites or group owners"
on public.group_invites
for select
to authenticated
using (
  invited_user_id = auth.uid()
  or public.is_group_owner(group_invites.group_id, auth.uid())
);

drop policy if exists "Group members can send invites" on public.group_invites;
create policy "Group members can send invites"
on public.group_invites
for insert
to authenticated
with check (
  invited_by = auth.uid()
  and public.is_group_member(group_invites.group_id, auth.uid())
);

drop policy if exists "Invited user can respond invite" on public.group_invites;
create policy "Invited user can respond invite"
on public.group_invites
for update
to authenticated
using (invited_user_id = auth.uid())
with check (invited_user_id = auth.uid());

drop policy if exists "Group members can view group app state" on public.group_app_state;
create policy "Group members can view group app state"
on public.group_app_state
for select
to authenticated
using (
  public.is_group_member(group_app_state.group_id, auth.uid())
);

drop policy if exists "Group members can upsert group app state" on public.group_app_state;
create policy "Group members can upsert group app state"
on public.group_app_state
for insert
to authenticated
with check (
  public.is_group_member(group_app_state.group_id, auth.uid())
);

drop policy if exists "Group members can update group app state" on public.group_app_state;
create policy "Group members can update group app state"
on public.group_app_state
for update
to authenticated
using (
  public.is_group_member(group_app_state.group_id, auth.uid())
)
with check (
  public.is_group_member(group_app_state.group_id, auth.uid())
);
