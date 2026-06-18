-- ============================================================
-- VIRGIL MIGRATION 002b — block role self-elevation
-- ------------------------------------------------------------
-- Run after 002.
--
-- WHY a trigger and not a column permission: Supabase logs every
-- signed-in user in as the same database role ("authenticated"),
-- so a plain GRANT can't tell "a user editing their own role" from
-- "an admin editing someone's role" — they look identical. The
-- trigger keys off auth.uid() + is_admin(), which is the only
-- signal that survives. It treats a NULL auth context (the SQL
-- editor / service_role / your admin tooling) as trusted, so the
-- curator-designation script in 005 is never blocked.
-- ============================================================
begin;

-- Block changing an existing profile's role unless caller is admin
-- or there is no auth context (SQL editor / service_role).
create or replace function public.enforce_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is not distinct from old.role then
    return new;                              -- role unchanged
  end if;

  if auth.uid() is null or public.is_admin() then
    return new;                              -- trusted context / admin
  end if;

  raise exception
    'role changes are not permitted (attempted % -> %)', old.role, new.role
    using errcode = '42501';                 -- insufficient_privilege
end;
$$;

drop trigger if exists trg_enforce_role_change on public.profiles;
create trigger trg_enforce_role_change
  before update on public.profiles
  for each row execute function public.enforce_role_change();

-- A brand-new profile must start as 'user' unless an admin / the SQL
-- editor created it. (The app never sends role on insert, so for
-- normal signups NEW.role is already the 'user' default.)
create or replace function public.enforce_role_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from 'user'
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'cannot self-assign role % on insert', new.role
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_role_on_insert on public.profiles;
create trigger trg_enforce_role_on_insert
  before insert on public.profiles
  for each row execute function public.enforce_role_on_insert();

commit;

-- ------------------------------------------------------------
-- ROLLBACK for 002b:
--   drop trigger if exists trg_enforce_role_change    on public.profiles;
--   drop trigger if exists trg_enforce_role_on_insert on public.profiles;
--   drop function if exists public.enforce_role_change();
--   drop function if exists public.enforce_role_on_insert();
-- ------------------------------------------------------------
