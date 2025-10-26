// Use Supabase SSR helpers so the session is stored in cookies and
// available to server Route Handlers as well.
import { createBrowserClient } from '@supabase/ssr';

// Initialise un client Supabase en utilisant les variables d'environnement
// NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY définies dans votre fichier `.env`.
// Ces valeurs doivent provenir du tableau de bord Supabase (Settings → API).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);