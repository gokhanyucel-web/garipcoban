-- ============================================================
-- VIRGIL MIGRATION 008 — auto-create a profile on signup + backfill
-- ------------------------------------------------------------
-- Fixes: "insert or update on custom_lists violates foreign key
-- constraint custom_lists_user_id_fkey".
--
-- custom_lists.user_id references profiles(id), but a profile row was
-- only created lazily (when a user saved their identity). A user who
-- signed up but never saved a profile had no profiles row, so creating
-- or remixing a list failed the FK. This makes every auth user get a
-- profile immediately, and backfills existing users.
--
-- Safe to run on any project (demo or prod). Idempotent.
-- ============================================================
begin;

-- Create a profile row automatically whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'Initiate'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: give every existing user without a profile one now.
insert into public.profiles (id, username)
select u.id, coalesce(u.raw_user_meta_data->>'username', 'Initiate')
from   auth.users u
left join public.profiles p on p.id = u.id
where  p.id is null
on conflict (id) do nothing;

commit;

-- Verify (should return 0 — every user now has a profile):
--   select count(*) from auth.users u
--   left join public.profiles p on p.id = u.id where p.id is null;

-- ------------------------------------------------------------
-- ROLLBACK:
--   drop trigger if exists on_auth_user_created on auth.users;
--   drop function if exists public.handle_new_user();
-- (backfilled profile rows are harmless; leave them.)
-- ------------------------------------------------------------
