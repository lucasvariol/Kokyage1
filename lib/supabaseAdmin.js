import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // must be kept server-side only

console.log('🔧 Configuration Supabase Admin:');
console.log('- URL:', supabaseUrl ? 'Définie' : 'MANQUANTE');
console.log('- Service Key:', serviceRoleKey ? 'Définie' : 'MANQUANTE');

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
