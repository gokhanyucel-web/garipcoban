-- ============================================================
-- VIRGIL MIGRATION 004 — ENABLE Row-Level Security
-- ************************************************************
-- *** THIS IS THE ONLY DANGEROUS STEP. READ THIS FIRST.    ***
-- ************************************************************
-- ------------------------------------------------------------
-- Run files 001, 002, 002b, 002c, 003 and 005 FIRST.
--
-- Until now, all the rules from 003 were defined but switched OFF.
-- This file switches them ON. If a rule were wrong, visitors could
-- get an empty app. So:
--
--   1. Run ONE line at a time (one ALTER per Run), in this order.
--   2. After the first TWO (master_overrides, profiles), open the
--      live site and reload once. The house lists and profiles must
--      still appear. If they don't, run the matching rollback line
--      at the bottom for that table — the app recovers instantly.
--   3. Do this during quiet hours.
--
-- The first two are the risky ones because the app reads them at
-- startup even for logged-out visitors. The other three only affect
-- signed-in users' own data.
-- ============================================================

-- STEP 1 — house-list edits (public read policy already exists)
alter table public.master_overrides enable row level security;
--   >>> reload the live site: house lists must still load. <<<

-- STEP 2 — profiles (public read policy already exists)
alter table public.profiles enable row level security;
--   >>> reload the live site: it must still load (no blank screen). <<<

-- STEP 3 — user-created lists (owner + curator-discovery policies)
alter table public.custom_lists enable row level security;

-- STEP 4 — personal watch logs (owner-only)
alter table public.user_logs enable row level security;

-- STEP 5 — saved-lists join table (owner-only)
alter table public.vault enable row level security;

-- ------------------------------------------------------------
-- EMERGENCY ROLLBACK — disable RLS on a table (restores the old
-- permissive behavior instantly; policies stay defined but inert):
--
--   alter table public.master_overrides disable row level security;
--   alter table public.profiles         disable row level security;
--   alter table public.custom_lists     disable row level security;
--   alter table public.user_logs        disable row level security;
--   alter table public.vault            disable row level security;
-- ------------------------------------------------------------
