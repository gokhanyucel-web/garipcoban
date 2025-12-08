import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mdozlygouynzahipgwwi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kb3pseWdvdXluemFoaXBnd3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODE5OTcsImV4cCI6MjA4MDc1Nzk5N30.cdxYlcTKAIgrDtN7b0Y0jL5nJRjIPIPWon1c0u3g91Q';

export const supabase = createClient(supabaseUrl, supabaseKey);