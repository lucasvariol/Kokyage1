import { createClient } from '@supabase/supabase-js';
import { logEnvStatus } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // must be kept server-side only

logEnvStatus('NEXT_PUBLIC_SUPABASE_URL');
logEnvStatus('SUPABASE_SERVICE_ROLE_KEY');

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
