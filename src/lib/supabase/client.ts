/**
 * Supabase client (frontend) — DBACADEMY.
 *
 * Ámbito: llamadas cliente a la base de datos Postgres (Supabase).
 *
 * Variables requeridas:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 * (La construcción es lazy: el error sucede en la primera llamada a la
 * base de datos, no al importar el módulo, para que la app siga arrancando.)
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseEnv(): { url: string; key: string } {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const procEnv = typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : {};
  const url =
    import.meta.env.VITE_SUPABASE_URL?.trim() ||
    metaEnv.VITE_SUPABASE_URL?.trim() ||
    metaEnv.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    procEnv.VITE_SUPABASE_URL?.trim() ||
    procEnv.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    '';
  // Clave pública del navegador: legacy anon o nuevo publishable key.
  // NUNCA usar aquí SUPABASE_SECRET_KEY / SERVICE_KEY (sólo servidor).
  const key =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    metaEnv.VITE_SUPABASE_ANON_KEY?.trim() ||
    metaEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    procEnv.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    procEnv.VITE_SUPABASE_ANON_KEY?.trim() ||
    procEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    '';
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseEnv();
  return Boolean(url && key);
}

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;
  const { url, key } = getSupabaseEnv();
  if (!url || !key) {
    throw new Error(
      'DBACADEMY usa Supabase para datos: falta VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY o VITE_SUPABASE_PUBLISHABLE_KEY en .env.local'
    );
  }
  client = createClient(url, key, { auth: { persistSession: true } });
  return client;
}

export const SUPABASE_URL_VAR = 'VITE_SUPABASE_URL';
export const SUPABASE_ANON_KEY_VAR = 'VITE_SUPABASE_ANON_KEY';
export default getSupabaseClient;
