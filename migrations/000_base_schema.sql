-- ============================================================
-- VIRGIL MIGRATION 000 — base schema (FRESH / DEMO projects only)
-- ------------------------------------------------------------
-- Gokhan's PRODUCTION project already has these tables (created via
-- AI Studio). DO NOT run this on prod. Run it ONLY on a new demo /
-- staging project, BEFORE 001, so the later migrations have tables
-- to alter.
--
-- Shapes are reconstructed from how the app reads/writes them. Supabase
-- provides auth.users automatically; profiles mirror it by id.
-- ============================================================
begin;

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text,
  motto      text,
  avatar_url text
);

create table if not exists public.user_logs (
  user_id  uuid not null references auth.users(id) on delete cascade,
  film_id  text not null,
  watched  boolean not null default false,
  rating   numeric not null default 0,
  notes    text default '',
  primary key (user_id, film_id)
);

create table if not exists public.vault (
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id text not null,
  primary key (user_id, list_id)
);

create table if not exists public.custom_lists (
  id      text primary key,
  -- FK to profiles (not just auth.users) so PostgREST can embed the
  -- author profile in the discovery query: select('*, profiles(...)').
  user_id uuid not null references public.profiles(id) on delete cascade,
  title   text,
  content jsonb
);

create table if not exists public.master_overrides (
  list_id text primary key,
  content jsonb
);

commit;

-- Next: run 001_schema_and_backfill.sql, then the rest in order.
--
-- Demo tip: Supabase → Authentication → Providers/Settings → turn OFF
-- "Confirm email" so test signups work instantly without a real inbox.

-- ------------------------------------------------------------
-- ROLLBACK (demo only — destroys all data in these tables):
--   drop table if exists public.master_overrides;
--   drop table if exists public.custom_lists;
--   drop table if exists public.vault;
--   drop table if exists public.user_logs;
--   drop table if exists public.profiles;
-- ------------------------------------------------------------
