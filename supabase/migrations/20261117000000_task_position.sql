-- Task order: adds `position` so a parent can reorder each child's tasks.
--
-- Lower position = shown (and played in child mode) earlier. Positions are
-- per child, 0-based. Existing tasks are numbered per child by created_at,
-- so nothing moves when you run this. Safe to run more than once.
-- No RLS change is needed: the existing tasks policies already cover updates.

alter table public.tasks
  add column if not exists position integer not null default 0;

-- Backfill: number each child's tasks (and each owner's unassigned tasks) by
-- created_at. Only rows that were never positioned are touched, so re-running
-- after the app has saved an order does not undo it.
with numbered as (
  select
    id,
    row_number() over (
      partition by user_id, child_id
      order by created_at, id
    ) - 1 as new_position
  from public.tasks
)
update public.tasks t
set position = numbered.new_position
from numbered
where t.id = numbered.id
  and not exists (
    select 1 from public.tasks o
    where o.user_id is not distinct from t.user_id
      and o.child_id is not distinct from t.child_id
      and o.position <> 0
  );

create index if not exists tasks_child_position_idx on public.tasks (child_id, position);
