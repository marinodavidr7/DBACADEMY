-- DBACADEMY — Migración 0006: hardening de seguridad (H1)
-- Ajusta exposición pública de users y añade vista de perfil público con columnas mínimas.

-- Vista de perfiles públicos (sin email; email vive en users_private).
CREATE OR REPLACE VIEW public.user_public_profiles AS
SELECT
  uid,
  display_name,
  photo_url,
  role,
  preferred_language,
  preferred_theme,
  created_at,
  updated_at
FROM public.users;

-- Permitir lectura de la vista a clientes anon/authenticated (PostgREST).
GRANT SELECT ON public.user_public_profiles TO anon, authenticated;

-- Endurecer políticas directas sobre users:
-- Se eliminan políticas redundantes/amplias y se deja una política explícita.
-- NOTA: el cliente actual usa Firebase Auth + anon key Supabase (sin auth.uid()).
-- Para no romper lecturas de perfil, se mantiene SELECT anon, pero se recomienda
-- migrar a vista user_public_profiles + endpoint server-side para PII.
DROP POLICY IF EXISTS "public_read" ON public.users;
DROP POLICY IF EXISTS "authenticated_read_own_or_public" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_read_anon" ON public.users;

CREATE POLICY "users_read_anon" ON public.users
  FOR SELECT TO anon
  USING (true);

-- Mantener update propio para clientes autenticados Supabase (si se migra auth).
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid()::text = uid);

-- service_role mantiene acceso completo por políticas service_role_all.

COMMENT ON VIEW public.user_public_profiles IS 'Perfil público mínimo de usuarios; usar en lugar de SELECT directo sobre users desde clientes.';