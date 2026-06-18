-- ============================================================
-- VIRGIL MIGRATION 001 — schema promotion + role column
-- ------------------------------------------------------------
-- Run this WHOLE block first. It is idempotent (safe to re-run).
-- It does NOT enable Row-Level Security yet (see 004). The live
-- app keeps working unchanged after this block.
--
-- WHY: today the app stuffs status/privacy/author into a single
-- JSON blob ("content") because real columns don't exist. You
-- cannot filter, index, or write security rules against JSON,
-- which is exactly what curator discovery needs. This promotes
-- them to real columns and copies the existing values over.
-- ============================================================
begin;

-- A.1  custom_lists: promote real columns (all defaulted, so existing
--      inserts that don't send them keep working).
alter table public.custom_lists
  add column if not exists status      text        not null default 'draft',
  add column if not exists privacy     text        not null default 'private',
  add column if not exists author_name text,
  add column if not exists updated_at  timestamptz not null default now();

-- Value guards. Added NOT VALID first so a single dirty legacy row
-- can't abort the paste; validated after the backfill below.
alter table public.custom_lists drop constraint if exists custom_lists_status_chk;
alter table public.custom_lists
  add  constraint custom_lists_status_chk
       check (status in ('draft','published')) not valid;

alter table public.custom_lists drop constraint if exists custom_lists_privacy_chk;
alter table public.custom_lists
  add  constraint custom_lists_privacy_chk
       check (privacy in ('public','private')) not valid;

-- A.2  profiles: role column ('user' | 'curator' | 'admin').
alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.profiles drop constraint if exists profiles_role_chk;
alter table public.profiles
  add  constraint profiles_role_chk
       check (role in ('user','curator','admin')) not valid;

-- A.3  Backfill the new real columns FROM the existing content jsonb.
--      coalesce/nullif guard rows where the key is absent or empty.
update public.custom_lists
set status      = coalesce(nullif(content->>'status' , ''), 'draft'),
    privacy     = coalesce(nullif(content->>'privacy', ''), 'private'),
    author_name = coalesce(nullif(content->>'author' , ''), author_name),
    updated_at  = coalesce((content->>'updated_at')::timestamptz, updated_at, now())
where content is not null;

-- Now that the data is clean, validate the guards.
alter table public.custom_lists validate constraint custom_lists_status_chk;
alter table public.custom_lists validate constraint custom_lists_privacy_chk;
alter table public.profiles     validate constraint profiles_role_chk;

-- A.4  Index that backs the public-discovery query / Critics tab.
create index if not exists custom_lists_published_public_idx
  on public.custom_lists (status, privacy)
  where status = 'published' and privacy = 'public';

commit;

-- Sanity check (optional): see the promoted values.
--   select id, title, status, privacy, author_name from public.custom_lists limit 20;
--   select id, username, role from public.profiles limit 20;

-- ------------------------------------------------------------
-- ROLLBACK for 001 (non-destructive — content jsonb still holds
-- the originals, so no data is lost):
--   alter table public.profiles drop column if exists role;
--   alter table public.custom_lists
--     drop column if exists status,
--     drop column if exists privacy,
--     drop column if exists author_name,
--     drop column if exists updated_at;
--   drop index if exists public.custom_lists_published_public_idx;
-- ------------------------------------------------------------
