-- ============================================================
-- VIRGIL MIGRATION 006 — smoke test (optional, run after 004)
-- ------------------------------------------------------------
-- Confirms the rules behave. The SQL editor normally runs as a
-- superuser that BYPASSES RLS, so to really test we temporarily
-- impersonate the "anon" and "authenticated" roles and fake a JWT.
--
-- Substitute two real user ids first:
--   - a NORMAL (non-curator) user's uuid
--   - a CURATOR's uuid
-- Find them with:
--   select id, email from auth.users;
--
-- Each block is wrapped so a failure prints PASS/FAIL instead of
-- aborting. Run the whole file; read the NOTICE messages.
-- ============================================================

-- ============ as ANONYMOUS (logged-out visitor) ============
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

-- (a) anon CAN see published curator lists  -> expect a number >= 0
select count(*) as anon_sees_published
from public.custom_lists where status='published' and privacy='public';

-- (b) anon CANNOT see drafts  -> expect 0
select count(*) as anon_sees_drafts
from public.custom_lists where status='draft';

-- (c) anon CAN read profiles + house edits  -> expect > 0 (if any rows exist)
select count(*) as anon_profiles  from public.profiles;
select count(*) as anon_overrides from public.master_overrides;
reset role;

-- ============ as a NORMAL USER ============
-- Replace <NORMAL_USER_UUID> in all three places below.
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('role','authenticated','sub','<NORMAL_USER_UUID>')::text, true);

-- (d) can create own private draft -> should succeed
insert into public.custom_lists (id, user_id, title, status, privacy)
values ('custom_smoketest_1', '<NORMAL_USER_UUID>', 'SMOKE', 'draft', 'private');

-- (e) publishing public as a non-curator -> MUST be blocked
do $$ begin
  update public.custom_lists set status='published', privacy='public'
    where id='custom_smoketest_1';
  raise notice 'FAIL (e): a non-curator was allowed to publish';
exception when others then
  raise notice 'PASS (e): publish blocked for non-curator (%).', sqlerrm;
end $$;

-- (f) self-elevation to curator -> MUST be blocked
do $$ begin
  update public.profiles set role='curator' where id='<NORMAL_USER_UUID>';
  raise notice 'FAIL (f): self-elevation was allowed';
exception when others then
  raise notice 'PASS (f): self-elevation blocked (%).', sqlerrm;
end $$;

-- (g) cannot read someone else's vault -> expect 0
select count(*) as sees_others_vault
from public.vault where user_id <> '<NORMAL_USER_UUID>';

delete from public.custom_lists where id='custom_smoketest_1';
reset role;

-- ============ as a CURATOR ============
-- Replace <CURATOR_UUID> below.
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('role','authenticated','sub','<CURATOR_UUID>')::text, true);

-- (h) curator CAN publish public -> should succeed
insert into public.custom_lists (id, user_id, title, status, privacy)
values ('custom_smoketest_2', '<CURATOR_UUID>', 'CRIT PICK', 'published', 'public');
delete from public.custom_lists where id='custom_smoketest_2';
reset role;

-- Expected: (b)=0, (e)=PASS, (f)=PASS, (g)=0, (d)/(h) succeed.
-- If any line behaves differently, halt and roll back that table (see 004).
