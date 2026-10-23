-- Run this ONCE, by hand, in the Supabase SQL editor after your first login.
-- It is not a migration and it changes existing rows, so read it before running.

-- 1. Find your user id (the account you signed in with):
select id, email, created_at from auth.users order by created_at desc;

-- 2. Preview the tasks that have no owner yet:
select id, text, created_at from public.tasks where user_id is null order by created_at;

-- 3. Assign them to your account. Replace the uuid below with your id from step 1.
update public.tasks
set user_id = '00000000-0000-0000-0000-000000000000'   -- <-- YOUR USER ID
where user_id is null;

-- 4. Optional: put them under a child profile instead of "no child".
--    Create the child first, then point the tasks at it.
-- insert into public.children (parent_id, name, avatar)
--   values ('00000000-0000-0000-0000-000000000000', 'Daniil', '🦊')   -- <-- YOUR USER ID, child name
--   returning id;
-- update public.tasks
--   set child_id = '<CHILD ID FROM THE INSERT ABOVE>'
--   where user_id = '00000000-0000-0000-0000-000000000000' and child_id is null;

-- 5. Optional, once nothing has user_id null any more:
-- alter table public.tasks alter column user_id set not null;
