import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl='https://yzcozynozifjfomrmirp.supabase.co';
const supabaseAnonKey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Y296eW5vemlmamZvbXJtaXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIyNTQ5NzEsImV4cCI6MjAzNzgzMDk3MX0.FL9tKLk--ntudPyBBgISLSGK93xU32H-INuCcx434O0';


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
