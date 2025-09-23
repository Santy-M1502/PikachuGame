import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://tuhoyfygiznomztqdasf.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1aG95ZnlnaXpub216dHFkYXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDA0ODYsImV4cCI6MjA3MTg3NjQ4Nn0.ZBLtrX00EYI7EKib3rISATHGR3X1S-HGMYJdyAdnGTE"; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
