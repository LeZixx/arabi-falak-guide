// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://iflrjqxwxivnrhhgoobz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmbHJqcXh3eGl2bnJoaGdvb2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MzI0NTksImV4cCI6MjA2MDAwODQ1OX0.uSne35JTyjUOKtbNcGmtV-Jq0czMvFEipdliWCchpCU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);