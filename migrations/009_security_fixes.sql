-- ============================================================
-- VIRGIL MIGRATION 009 — security fix: lock down role_of()
-- ------------------------------------------------------------
-- role_of(uuid) was granted EXECUTE to anon, which let an
-- unauthenticated caller look up ANY user's role by UUID. It is not
-- used by any RLS policy (only is_publisher() and is_admin() are), so
-- remove anon/public access. is_publisher/is_admin keep their grants
-- because the anon discovery-read policy needs them.
--
-- Safe to run on any project (demo or prod). Idempotent.
-- ============================================================
begin;
revoke execute on function public.role_of(uuid) from anon, public;
commit;

-- Verify (role_of should NOT be executable by anon):
--   select has_function_privilege('anon', 'public.role_of(uuid)', 'execute');  -- expect false

-- ------------------------------------------------------------
-- ROLLBACK (re-grant, not recommended):
--   grant execute on function public.role_of(uuid) to authenticated;
-- ------------------------------------------------------------
