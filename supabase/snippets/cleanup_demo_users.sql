-- Optional housekeeping. Deletes demo (anonymous) users older than 7 days.
-- Their children, tasks and settings are removed too (ON DELETE CASCADE).
-- Review the SELECT first; the DELETE cannot be undone.

select id, created_at from auth.users
where is_anonymous and created_at < now() - interval '7 days';

-- delete from auth.users
-- where is_anonymous and created_at < now() - interval '7 days';
