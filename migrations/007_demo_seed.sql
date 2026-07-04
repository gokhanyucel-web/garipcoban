-- ============================================================
-- VIRGIL MIGRATION 007 — demo seed (DEMO ONLY — never on prod)
-- ------------------------------------------------------------
-- Creates two demo curators and three published public lists so the
-- Critics tab / Voices strip / curator profiles / bylines have real
-- data to render. Run AFTER 000–004, in the demo SQL editor.
--
-- Idempotent: safe to re-run. These seeded users can't log in (no
-- password/identity set) — they exist only to own published lists for
-- the read-side demo. To test the WRITE path, sign up a real account
-- in the app and promote it with 005_designate_curator.sql.
-- ============================================================
begin;

-- ---- 1) Two demo auth users (owners of the curator profiles) ----
insert into auth.users (
  instance_id, id, aud, role, email,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) values
  ('00000000-0000-0000-0000-000000000000',
   '11111111-1111-1111-1111-111111111111',
   'authenticated','authenticated','demo.roger@virgil.test',
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"Roger (Demo Critic)"}'),
  ('00000000-0000-0000-0000-000000000000',
   '22222222-2222-2222-2222-222222222222',
   'authenticated','authenticated','demo.pauline@virgil.test',
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"Pauline (Demo Critic)"}')
on conflict (id) do nothing;

-- ---- 2) Their curator profiles ----
insert into public.profiles (id, username, motto, avatar_url, role) values
  ('11111111-1111-1111-1111-111111111111','Roger (Demo Critic)','Cinema is an empathy machine.',null,'curator'),
  ('22222222-2222-2222-2222-222222222222','Pauline (Demo Critic)','Trash, art, and the movies.',null,'curator')
on conflict (id) do update set role='curator', username=excluded.username, motto=excluded.motto;

-- ---- 3) Three published + public curator lists ----
-- (profiles are curators first, so the publish-authority trigger allows these.)
insert into public.custom_lists (id, user_id, title, status, privacy, author_name, updated_at, content) values
(
  'custom_demo_noir','11111111-1111-1111-1111-111111111111','ESSENTIAL NEO-NOIR',
  'published','public','Roger (Demo Critic)', now(),
  '{"title":"ESSENTIAL NEO-NOIR","subtitle":"Shadows, Rain, Regret","description":"A journey through modern noir.","status":"published","privacy":"public","author":"Roger (Demo Critic)","sherpaNotes":{},"tiers":[
    {"level":1,"name":"LEVEL 1: THE HOOK","films":[
      {"id":"chinatown-1974","title":"Chinatown","year":1974,"director":"Roman Polanski","ves":95},
      {"id":"blade-runner-1982","title":"Blade Runner","year":1982,"director":"Ridley Scott","ves":96}]},
    {"level":2,"name":"LEVEL 2: DEEP CUTS","films":[
      {"id":"blood-simple-1984","title":"Blood Simple","year":1984,"director":"Joel Coen","ves":90},
      {"id":"drive-2011","title":"Drive","year":2011,"director":"Nicolas Winding Refn","ves":88}]}]}'::jsonb
),
(
  'custom_demo_kurosawa','11111111-1111-1111-1111-111111111111','KUROSAWA 101',
  'published','public','Roger (Demo Critic)', now(),
  '{"title":"KUROSAWA 101","subtitle":"Where To Begin","description":"An entry path into Kurosawa.","status":"published","privacy":"public","author":"Roger (Demo Critic)","sherpaNotes":{},"tiers":[
    {"level":1,"name":"LEVEL 1: THE HOOK","films":[
      {"id":"seven-samurai-1954","title":"Seven Samurai","year":1954,"director":"Akira Kurosawa","ves":98},
      {"id":"yojimbo-1961","title":"Yojimbo","year":1961,"director":"Akira Kurosawa","ves":93}]},
    {"level":2,"name":"LEVEL 2: THE MASTERWORKS","films":[
      {"id":"ikiru-1952","title":"Ikiru","year":1952,"director":"Akira Kurosawa","ves":95},
      {"id":"ran-1985","title":"Ran","year":1985,"director":"Akira Kurosawa","ves":94}]}]}'::jsonb
),
(
  'custom_demo_newwave','22222222-2222-2222-2222-222222222222','FRENCH NEW WAVE PRIMER',
  'published','public','Pauline (Demo Critic)', now(),
  '{"title":"FRENCH NEW WAVE PRIMER","subtitle":"Nouvelle Vague","description":"The essentials of the movement.","status":"published","privacy":"public","author":"Pauline (Demo Critic)","sherpaNotes":{},"tiers":[
    {"level":1,"name":"LEVEL 1: THE HOOK","films":[
      {"id":"breathless-1960","title":"Breathless","year":1960,"director":"Jean-Luc Godard","ves":94},
      {"id":"the-400-blows-1959","title":"The 400 Blows","year":1959,"director":"François Truffaut","ves":96}]}]}'::jsonb
)
on conflict (id) do update set status='published', privacy='public', content=excluded.content, updated_at=now();

commit;

-- Verify:
--   select id, title, status, privacy, author_name from public.custom_lists;
--   select id, username, role from public.profiles;

-- ------------------------------------------------------------
-- ROLLBACK (demo):
--   delete from public.custom_lists where id like 'custom_demo_%';
--   delete from public.profiles where id in
--     ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');
--   delete from auth.users where id in
--     ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');
-- ------------------------------------------------------------
