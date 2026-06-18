-- ============================================================
-- VIRGIL — consolidated ROLLBACK
-- ------------------------------------------------------------
-- Undo everything, in reverse dependency order. You rarely need
-- the whole thing — usually the per-table "disable RLS" lines in
-- STEP 1 are all you want as an emergency stop.
-- ============================================================

-- STEP 1 — emergency stop: turn the rules back OFF (instant; data untouched).
alter table public.master_overrides disable row level security;
alter table public.profiles         disable row level security;
alter table public.custom_lists     disable row level security;
alter table public.user_logs        disable row level security;
alter table public.vault            disable row level security;

-- STEP 2 — drop the policies (safe once RLS is disabled).
drop policy if exists profiles_select_public          on public.profiles;
drop policy if exists profiles_insert_own             on public.profiles;
drop policy if exists profiles_update_own             on public.profiles;
drop policy if exists user_logs_all_own               on public.user_logs;
drop policy if exists vault_all_own                   on public.vault;
drop policy if exists custom_lists_all_own            on public.custom_lists;
drop policy if exists custom_lists_select_discovery   on public.custom_lists;
drop policy if exists master_overrides_select_public  on public.master_overrides;
drop policy if exists master_overrides_write_admin    on public.master_overrides;

-- STEP 3 — drop the triggers.
drop trigger if exists trg_enforce_publish_authority on public.custom_lists;
drop trigger if exists trg_enforce_role_change       on public.profiles;
drop trigger if exists trg_enforce_role_on_insert    on public.profiles;

-- STEP 4 — drop the functions.
drop function if exists public.enforce_publish_authority();
drop function if exists public.enforce_role_change();
drop function if exists public.enforce_role_on_insert();
drop function if exists public.is_publisher(uuid);
drop function if exists public.is_admin();
drop function if exists public.role_of(uuid);

-- STEP 5 — drop the schema additions (content jsonb still holds the
-- originals, so no list data is lost). Usually you do NOT want this.
-- alter table public.profiles drop column if exists role;
-- alter table public.custom_lists
--   drop column if exists status,
--   drop column if exists privacy,
--   drop column if exists author_name,
--   drop column if exists updated_at;
-- drop index if exists public.custom_lists_published_public_idx;
