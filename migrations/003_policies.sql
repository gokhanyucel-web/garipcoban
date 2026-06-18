-- ============================================================
-- VIRGIL MIGRATION 003 — Row-Level Security POLICIES
-- ------------------------------------------------------------
-- Run after 002c. These define WHO can read/write WHAT.
--
-- SAFE TO RUN ON THE LIVE APP: creating a policy on a table whose
-- RLS is still disabled has no runtime effect. Policies only start
-- enforcing once 004 enables RLS. So this whole file is inert until
-- then.
-- ============================================================
begin;

-- ---------- profiles ----------
-- Anyone (including logged-out visitors) can read profiles, so bylines
-- and curator pages render. Users may only insert/update their OWN row.
-- (The no-self-elevation rule for the role column is handled by the
--  trigger in 002b, not here — RLS controls WHICH ROWS you touch, the
--  trigger controls WHICH VALUES.)
drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public
  on public.profiles for select
  using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  using      (id = auth.uid())
  with check (id = auth.uid());

-- ---------- user_logs ----------  owner-only, every verb
drop policy if exists user_logs_all_own on public.user_logs;
create policy user_logs_all_own
  on public.user_logs for all
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- vault ----------  owner-only, every verb
drop policy if exists vault_all_own on public.vault;
create policy vault_all_own
  on public.vault for all
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- custom_lists ----------
-- (1) owner can do anything to their own rows (drafts, private lists, etc.)
drop policy if exists custom_lists_all_own on public.custom_lists;
create policy custom_lists_all_own
  on public.custom_lists for all
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

-- (2) anyone may READ a row that is published + public AND authored by a
--     curator/admin. SELECT policies are OR-combined, so the owner still
--     sees their own drafts via policy (1), and the public sees curator
--     lists via this one. Logged-out visitors have a NULL auth.uid(), so
--     policy (1) never matches them and only this one applies.
drop policy if exists custom_lists_select_discovery on public.custom_lists;
create policy custom_lists_select_discovery
  on public.custom_lists for select
  using (
        status  = 'published'
    and privacy = 'public'
    and public.is_publisher(user_id)     -- helper bypasses profiles RLS → no recursion
  );

-- ---------- master_overrides ----------
-- House-list edits are visible to everyone (the app reads them at startup,
-- even logged out). Only admins may write them. This replaces the old
-- spoofable footer "Admin" toggle.
drop policy if exists master_overrides_select_public on public.master_overrides;
create policy master_overrides_select_public
  on public.master_overrides for select
  using (true);

drop policy if exists master_overrides_write_admin on public.master_overrides;
create policy master_overrides_write_admin
  on public.master_overrides for all
  using      (public.is_admin())
  with check (public.is_admin());

commit;

-- ------------------------------------------------------------
-- ROLLBACK for 003 (safe while RLS is still disabled):
--   drop policy if exists profiles_select_public          on public.profiles;
--   drop policy if exists profiles_insert_own             on public.profiles;
--   drop policy if exists profiles_update_own             on public.profiles;
--   drop policy if exists user_logs_all_own               on public.user_logs;
--   drop policy if exists vault_all_own                   on public.vault;
--   drop policy if exists custom_lists_all_own            on public.custom_lists;
--   drop policy if exists custom_lists_select_discovery   on public.custom_lists;
--   drop policy if exists master_overrides_select_public  on public.master_overrides;
--   drop policy if exists master_overrides_write_admin    on public.master_overrides;
-- ------------------------------------------------------------
