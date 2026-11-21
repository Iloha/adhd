-- Stars: one star for each finished task.
--
-- Adds `star_events` (every star that was given or taken away) and the view
-- `child_star_balance` (the balance per child = the sum of the amounts).
-- It does not change or delete any existing row, and it is safe to run twice.
--
-- Run it in the Supabase SQL editor, after the earlier migrations (oldest first).
--
-- tasks.id is a bigint in this project. If yours is a uuid, change `task_id` below to uuid.

-- ---------------------------------------------------------------------------
-- star_events
-- ---------------------------------------------------------------------------
create table if not exists public.star_events (
  id          uuid primary key default gen_random_uuid(),
  -- Deleting a child profile deletes that child's stars (the app asks first, as for their tasks).
  child_id    uuid not null references public.children (id) on delete cascade,
  -- Deleting a task keeps the star: the event stays, without the link to the task.
  task_id     bigint references public.tasks (id) on delete set null,
  amount      integer not null check (amount <> 0),
  reason      text not null check (reason in ('task_done', 'parent_adjust')),
  created_at  timestamptz not null default now(),
  -- A finished task gives exactly one star.
  constraint star_events_task_done_is_one_star check (reason <> 'task_done' or amount = 1)
);

-- One task can only give one star per reason. Events without a task (task_id is NULL: a
-- parent adjustment, or a task that was deleted later) are not limited, as NULLs are distinct.
alter table public.star_events
  drop constraint if exists star_events_task_id_reason_key;
alter table public.star_events
  add constraint star_events_task_id_reason_key unique (task_id, reason);

-- For "the balance of a child" and "the stars of a child this week".
create index if not exists star_events_child_created_idx on public.star_events (child_id, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security: only the parent of the child can read, add and remove stars.
-- Stars are never edited, so there is no update policy.
-- ---------------------------------------------------------------------------
alter table public.star_events enable row level security;

drop policy if exists "star_events_select_own" on public.star_events;
drop policy if exists "star_events_insert_own" on public.star_events;
drop policy if exists "star_events_delete_own" on public.star_events;

create policy "star_events_select_own" on public.star_events
  for select to authenticated
  using (
    exists (
      select 1 from public.children c
      where c.id = star_events.child_id and c.parent_id = (select auth.uid())
    )
  );

-- A star can only be added to one of the parent's own children, and only for one of the parent's own tasks.
create policy "star_events_insert_own" on public.star_events
  for insert to authenticated
  with check (
    exists (
      select 1 from public.children c
      where c.id = star_events.child_id and c.parent_id = (select auth.uid())
    )
    and (
      star_events.task_id is null
      or exists (
        select 1 from public.tasks t
        where t.id = star_events.task_id and t.user_id = (select auth.uid())
      )
    )
  );

create policy "star_events_delete_own" on public.star_events
  for delete to authenticated
  using (
    exists (
      select 1 from public.children c
      where c.id = star_events.child_id and c.parent_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- child_star_balance: one row per child, with the sum of their star amounts (0 if none).
-- security_invoker makes the view use the caller's rights, so the policies above and on
-- `children` apply: a parent only sees the balances of their own children.
-- Without it a view runs with its owner's rights and would show every family's balances.
-- ---------------------------------------------------------------------------
create or replace view public.child_star_balance
  with (security_invoker = true) as
  select c.id as child_id, coalesce(sum(s.amount), 0)::integer as balance
  from public.children c
  left join public.star_events s on s.child_id = c.id
  group by c.id;

grant select on public.child_star_balance to authenticated;

-- Signed-out visitors (the anon role) get no policies, so they can read and write nothing.
