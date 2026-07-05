# VIRGIL Supabase migrations — roles, curator publishing, RLS

These SQL files turn on **real, server-enforced roles** for VIRGIL so that:

- regular users keep **private** vaults (track films, rate, fork lists for themselves), and
- **curators** (the cinema critics) can **publish public lists** that everyone can discover.

Authorization is enforced in Postgres (Row-Level Security + triggers), **not** in the app — the
old "Admin" button in the footer was a client-side toggle that anyone could click, so it could not
be trusted.

## Who runs this

Gokhan (or whoever owns the Supabase project). Open the project →
**SQL Editor** → paste each file's contents → **Run**. The SQL editor runs as the `postgres`
superuser, which is exactly what these scripts expect.

## The golden rule

> Run the files **in number order**. Do **not** skip `004` to the end and rush it.
> `004` is the only dangerous step; everything before it leaves the live app untouched.

## Order

> **Fresh / demo project?** Run `000_base_schema.sql` FIRST — it creates the base
> tables that prod already has. **Do NOT run `000` on Gokhan's production project.**

| # | File | What it does | Safe? |
|---|------|--------------|-------|
| 1 | `001_schema_and_backfill.sql` | Adds real `status`/`privacy`/`author_name`/`updated_at` columns to `custom_lists` and a `role` column to `profiles`; backfills them from existing data. | ✅ live app unaffected |
| 2 | `008_auto_profile.sql` | Auto-creates a `profiles` row per auth user (+ backfills existing users). Required so creating/remixing a list doesn't fail the `custom_lists_user_id_fkey` foreign key. | ✅ |
| 3 | `002_role_helpers.sql` | Small helper functions used by the rules below. | ✅ |
| 4 | `002b_role_triggers.sql` | Stops a user from making themselves a curator/admin. | ✅ |
| 5 | `002c_publish_trigger.sql` | Stops a non-curator from publishing a public list. | ✅ (publishing by non-curators starts being blocked — intended) |
| 6 | `003_policies.sql` | Defines who can read/write what. Inert until step 8. | ✅ |
| 7 | `005_designate_curator.sql` | **Edit the email**, then run to make someone a curator (and your first admin). | ✅ |
| 8 | `004_enable_rls.sql` | **Turns the rules ON. The one dangerous step.** Run the blocks one at a time. | ⚠️ see file |
| 9 | `006_smoke_test.sql` | Optional checks that the rules behave. | ✅ read-only-ish |
| 10 | `009_security_fixes.sql` | Revoke anon access to `role_of()` so a user's role can't be enumerated by UUID. | ✅ run any time |

> Demo-only extras: `000_base_schema.sql` (run first on a fresh project) and `007_demo_seed.sql`
> (sample curators + lists, run after `004`). **Never run those two on prod.**

> Note the numbering quirk: run **005 before 004**. Designate at least one curator/admin *before*
> enabling RLS, so curator lists are publishable and house-list edits still have an admin the moment
> the rules switch on.

## Before step 7 (`004`)

It is the only step that can take the site down (if a policy is wrong, visitors get an empty app).
Mitigations baked into `004`:

- enable RLS **one table at a time**, in the given order;
- after the first two tables (`master_overrides`, `profiles`), reload the live site once — house
  lists and profiles must still load;
- if anything looks wrong, run the one-line rollback at the bottom of `004` for that table. It
  instantly restores the old behavior.

## Rollback

Every file has rollback notes at the bottom. `999_rollback.sql` collects them in one place. RLS can
be disabled per table with a single line and the app returns to its pre-migration behavior.

## After it's done

The app's new code reads `profiles.role` and the new columns automatically. To make someone a
curator later, just re-run `005_designate_curator.sql` with their email.
