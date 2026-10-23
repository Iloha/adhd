-- Family data + Row Level Security.
--
-- Adds `children` and `parent_settings`, adds `user_id` / `child_id` to `tasks`,
-- and makes every row accessible only to the signed-in user who owns it.
--
-- IMPORTANT: existing rows in `tasks` get user_id = NULL, so after this migration
-- they are invisible to everyone (RLS hides rows with no owner). Run
-- supabase/snippets/assign_existing_tasks.sql after your first login to claim them.
-- This migration does not modify or delete any existing task rows.

-- ---------------------------------------------------------------------------
-- children
-- ---------------------------------------------------------------------------
create table if not exists public.children (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 40),
  avatar      text check (avatar is null or char_length(avatar) <= 16),
  created_at  timestamptz not null default now()
);

create index if not exists children_parent_id_idx on public.children (parent_id);

-- ---------------------------------------------------------------------------
-- tasks: owner + optional child
-- ---------------------------------------------------------------------------
-- user_id is filled by the database (auth.uid()), never sent by the client.
alter table public.tasks
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade;

-- child_id is nullable: NULL means "not assigned to a child profile".
-- Deleting a child profile deletes that child's tasks (the app asks for confirmation first).
alter table public.tasks
  add column if not exists child_id uuid references public.children (id) on delete cascade;

create index if not exists tasks_user_id_idx  on public.tasks (user_id);
create index if not exists tasks_child_id_idx on public.tasks (child_id);

-- ---------------------------------------------------------------------------
-- parent_settings: one row per parent, holds the bcrypt hash of the 4-digit PIN
-- ---------------------------------------------------------------------------
create table if not exists public.parent_settings (
  user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  pin_hash    text not null,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.children        enable row level security;
alter table public.tasks           enable row level security;
alter table public.parent_settings enable row level security;

-- Remove every existing policy on tasks, including any temporary "allow all" one.
do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies where schemaname = 'public' and tablename = 'tasks'
  loop
    execute format('drop policy %I on public.tasks', p.policyname);
  end loop;
end
$$;

-- children: a parent sees and manages only their own children.
-- (select auth.uid()) lets Postgres evaluate it once per query instead of once per row.
drop policy if exists "children_select_own" on public.children;
drop policy if exists "children_insert_own" on public.children;
drop policy if exists "children_update_own" on public.children;
drop policy if exists "children_delete_own" on public.children;

create policy "children_select_own" on public.children
  for select to authenticated using (parent_id = (select auth.uid()));
create policy "children_insert_own" on public.children
  for insert to authenticated with check (parent_id = (select auth.uid()));
create policy "children_update_own" on public.children
  for update to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()));
create policy "children_delete_own" on public.children
  for delete to authenticated using (parent_id = (select auth.uid()));

-- tasks: own rows only, and a task can only point at one of the owner's own children.
create policy "tasks_select_own" on public.tasks
  for select to authenticated using (user_id = (select auth.uid()));
create policy "tasks_insert_own" on public.tasks
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      tasks.child_id is null
      or exists (
        select 1 from public.children c
        where c.id = tasks.child_id and c.parent_id = (select auth.uid())
      )
    )
  );
create policy "tasks_update_own" on public.tasks
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (
      tasks.child_id is null
      or exists (
        select 1 from public.children c
        where c.id = tasks.child_id and c.parent_id = (select auth.uid())
      )
    )
  );
create policy "tasks_delete_own" on public.tasks
  for delete to authenticated using (user_id = (select auth.uid()));

-- parent_settings: own row only.
drop policy if exists "parent_settings_select_own" on public.parent_settings;
drop policy if exists "parent_settings_insert_own" on public.parent_settings;
drop policy if exists "parent_settings_update_own" on public.parent_settings;
drop policy if exists "parent_settings_delete_own" on public.parent_settings;

create policy "parent_settings_select_own" on public.parent_settings
  for select to authenticated using (user_id = (select auth.uid()));
create policy "parent_settings_insert_own" on public.parent_settings
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "parent_settings_update_own" on public.parent_settings
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "parent_settings_delete_own" on public.parent_settings
  for delete to authenticated using (user_id = (select auth.uid()));

-- Signed-out visitors (the anon role) get no policies, so they can read and write nothing.
