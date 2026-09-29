import { createClient } from '@supabase/supabase-js';

// Cliente único de Supabase. Usa la anon key (pública): la seguridad la ponen las políticas RLS de cada tabla.
const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Faltan PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY en .env');
}

// El sitio público nunca inicia sesión: no guarda tokens en localStorage ni lee tokens de la URL.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
