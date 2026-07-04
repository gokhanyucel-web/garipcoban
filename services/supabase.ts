import { createClient } from '@supabase/supabase-js';

// Configured via env (vite define). Local dev -> demo project (.env.local);
// production -> Gokhan's project (host env vars). Supports both the legacy
// anon JWT and the new sb_publishable_ key format. See .env.local.example.
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_ANON_KEY — set them in .env.local (dev) or the host env (prod).');
}

export const supabase = createClient(supabaseUrl, supabaseKey);