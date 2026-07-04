<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1jkDHG-X0ZcTlvtdYCYCs816SLd6rm6JW

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, and `TMDB_API_KEY`. (`.env.local` is git-ignored — keys
   never get committed.)
3. Run the app:
   `npm run dev`

## Backend (Supabase)

Roles and curator publishing are enforced in Supabase, not in the app. The SQL lives in
[`migrations/`](migrations/) — run the files in number order in the Supabase SQL editor. Start with
[`migrations/README.md`](migrations/README.md).

## Source of truth

This repo is the source of truth for the deployed app. Google AI Studio is a **sandbox** for
prototyping visual tweaks — don't re-export from it over this repo, or the roles/security code will
be overwritten.
