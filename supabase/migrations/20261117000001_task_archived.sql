-- Archive: lets a parent move a task out of the active list without deleting it.
--
-- Archived tasks are hidden from the main list and from child mode, and shown
-- in an "Archived" dropdown at the bottom of the parent screen, where they can
-- be restored. Existing tasks stay active. Safe to run more than once.
-- No RLS change is needed: the existing tasks policies already cover updates.

alter table public.tasks
  add column if not exists archived boolean not null default false;
