-- ============================================================
-- VIRGIL MIGRATION 005 — make someone a curator (or admin)
-- ------------------------------------------------------------
-- Run this BEFORE 004 (so curators exist the moment the rules
-- switch on). Re-run any time you want to add a new curator.
--
-- HOW: change the email in each statement to the person's signup
-- email, then run. Runs as the SQL-editor superuser, so the
-- no-self-elevation trigger lets it through.
-- ============================================================

-- ---- Promote a CURATOR (a critic who will publish public lists) ----
update public.profiles p
set    role = 'curator'
from   auth.users u
where  u.id = p.id
  and  lower(u.email) = lower('critic@example.com');   -- <<< EDIT THIS

-- ---- Promote your first ADMIN (can edit the house lists in-app) ----
-- update public.profiles p
-- set    role = 'admin'
-- from   auth.users u
-- where  u.id = p.id
--   and  lower(u.email) = lower('you@example.com');    -- <<< EDIT THIS

-- ---- Verify ----
select p.id, u.email, p.username, p.role
from   public.profiles p
join   auth.users u on u.id = p.id
where  p.role in ('curator','admin');

-- ------------------------------------------------------------
-- FALLBACK: if the person signed up but has no profiles row yet
-- (the app only creates a profile when they first save their
-- identity), the UPDATE above affects 0 rows. Use this instead —
-- it creates the row and sets the role in one go:
--
--   insert into public.profiles (id, username, role)
--   select u.id,
--          coalesce(u.raw_user_meta_data->>'username', 'curator'),
--          'curator'
--   from   auth.users u
--   where  lower(u.email) = lower('critic@example.com')
--   on conflict (id) do update set role = excluded.role;
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- DEMOTE someone back to a regular user:
--   update public.profiles set role = 'user' where id = '<their-uuid>';
-- ------------------------------------------------------------
