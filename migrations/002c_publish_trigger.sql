-- ============================================================
-- VIRGIL MIGRATION 002c — only curators/admins may publish public
-- ------------------------------------------------------------
-- Run after 002b.
--
-- This is the real "curators publish, users track" rule. A regular
-- user can still create and edit private lists and fork lists for
-- themselves; they just can't make one public+published. The check
-- is on the AUTHOR (the row's user_id), so it stays correct even if
-- an admin edits on someone's behalf.
--
-- IMPORTANT: this keys off the REAL columns status/privacy (added in
-- 001). The app was updated to write those columns. If the app ever
-- regresses to writing publish state only inside the JSON blob, this
-- trigger silently never fires and discovery shows nothing.
-- ============================================================
begin;

create or replace function public.enforce_publish_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published' and new.privacy = 'public' then
    if not public.is_publisher(new.user_id) then
      raise exception
        'only curators or admins may publish public lists'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_publish_authority on public.custom_lists;
create trigger trg_enforce_publish_authority
  before insert or update on public.custom_lists
  for each row execute function public.enforce_publish_authority();

commit;

-- ------------------------------------------------------------
-- ROLLBACK for 002c:
--   drop trigger if exists trg_enforce_publish_authority on public.custom_lists;
--   drop function if exists public.enforce_publish_authority();
-- ------------------------------------------------------------
