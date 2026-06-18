-- ============================================================
-- VIRGIL MIGRATION 002 — SECURITY DEFINER role helpers
-- ------------------------------------------------------------
-- Run AFTER 001, BEFORE the policies (003) and RLS (004).
--
-- WHY "security definer": the discovery rule for custom_lists has to
-- check the AUTHOR's role, which lives in the profiles table. If a
-- policy queried profiles directly, Postgres would re-evaluate
-- profiles' own security rules during that lookup and can fall into
-- "infinite recursion detected in policy". These helper functions
-- run with the function owner's rights, so they read profiles with
-- RLS bypassed — which breaks that cycle. `set search_path = public`
-- hardens them against search_path hijacking.
--
-- RULE OF THUMB: never write `select ... from profiles` inside a
-- policy. Always go through one of these helpers.
-- ============================================================
begin;

-- Role of an arbitrary user, read WITHOUT triggering profiles RLS.
create or replace function public.role_of(uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = uid;
$$;

-- Is the CURRENT caller an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false);
$$;

-- Is a given user a "publisher" (curator or admin)?
create or replace function public.is_publisher(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('curator','admin') from public.profiles where id = uid),
    false);
$$;

-- Callers only need EXECUTE, not ownership.
revoke all on function public.role_of(uuid)      from public;
revoke all on function public.is_admin()         from public;
revoke all on function public.is_publisher(uuid) from public;
grant execute on function public.role_of(uuid)      to anon, authenticated;
grant execute on function public.is_admin()         to anon, authenticated;
grant execute on function public.is_publisher(uuid) to anon, authenticated;

commit;

-- ------------------------------------------------------------
-- ROLLBACK for 002 (drop policies in 003 first if they reference these):
--   drop function if exists public.is_publisher(uuid);
--   drop function if exists public.is_admin();
--   drop function if exists public.role_of(uuid);
-- ------------------------------------------------------------
