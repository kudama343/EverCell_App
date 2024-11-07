import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '@env'; // Import variables from .env

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
