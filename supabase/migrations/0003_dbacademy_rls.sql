-- DBACADEMY — Migration 003: RLS + policies
--
-- Nota de orden: aplica ARRANCA la app (paso 2+3: server.ts + PlatformContext ya están
-- conectados a Supabase con `service_role`); esta migración define RLS para público y
-- autenticados. Si aplicas directamente antes de conectar la app, nada rompa.
--
-- Sobre el shim Firestore del server.ts: `db.collection().doc().set()` etc. van a
-- Postgres, y la app consulta con SUPABASE_ANON_KEY equivalente (VITE vars).

-- Todos los avisos:
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END $$;

-- ------------------------------ RLS habilitada ------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ------------------------------ Políticas públicas (anon/public) ------------------------------
-- Allows 'anon' role: read access to public data.
CREATE POLICY "public_read" ON public.courses FOR SELECT TO public USING (true);
CREATE POLICY "public_read" ON public.users FOR SELECT TO public USING (true);

-- ------------------------------ Políticas authenticate ------------------------------
-- Authenticated users can read and update their own data.
CREATE POLICY "authenticated_read_own_or_public" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_enrollments_own" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid()::text = student_id);
CREATE POLICY "authenticated_read_certificates_own" ON public.certificates FOR SELECT TO authenticated USING (auth.uid()::text = student_id);
CREATE POLICY "authenticated_update_own_profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid()::text = uid);
CREATE POLICY "authenticated_read_users_private_own" ON public.users_private FOR SELECT TO authenticated USING (auth.uid()::text = uid);
CREATE POLICY "authenticated_update_users_private_own" ON public.users_private FOR UPDATE TO authenticated USING (auth.uid()::text = uid);
CREATE POLICY "authenticated_read_payments_own" ON public.payments FOR SELECT TO authenticated USING (auth.uid()::text = student_id);
CREATE POLICY "authenticated_read_forum_public" ON public.forum_threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_forum_replies_own" ON public.forum_replies FOR SELECT TO authenticated USING (true);

-- ------------------------------ service_role bypass ------------------------------
-- PostgreSQL's service_role (and owner) handles server.ts admin operations.
CREATE POLICY "service_role_all" ON public.users FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.users_private FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.courses FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.enrollments FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.payments FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.certificates FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.forum_threads FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.forum_replies FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.calendar_events FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.encrypted_notes FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.api_keys FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.custom_exercises FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.assignment_submissions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.gift_cards FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.gift_card_redemptions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.coupons FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.coupon_redemptions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.referrals FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.referral_settings FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all" ON public.settings FOR ALL TO service_role USING (true);

-- ------------------------------ Índices para más columnas usadas ------------------------------
CREATE INDEX IF NOT EXISTS enrollments_student_id_idx ON public.enrollments (student_id);
CREATE INDEX IF NOT EXISTS enrollments_course_id_idx ON public.enrollments (course_id);
CREATE INDEX IF NOT EXISTS certificates_student_id_idx ON public.certificates (student_id);
CREATE INDEX IF NOT EXISTS payments_student_id_idx ON public.payments (student_id);
CREATE INDEX IF NOT EXISTS assignment_submissions_student_id_idx ON public.assignment_submissions (student_id);
CREATE INDEX IF NOT EXISTS forum_replies_thread_id_idx ON public.forum_replies (thread_id);
CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_code_idx ON public.coupon_redemptions (coupon_code);
CREATE INDEX IF NOT EXISTS coupon_redemptions_user_id_idx ON public.coupon_redemptions (user_id);
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON public.referrals (referrer_id);
CREATE INDEX IF NOT EXISTS referrals_referred_id_idx ON public.referrals (referred_id);

-- Nota para el deploy: si aparecen errores de política 403, revisa con
--   psql: SELECT polname, polqual FROM pg_policies WHERE tablename = '<tabla>';
-- Advertencia operativa: habilitar RLS después de conectar los datos para evitar
-- cortes temporales; o aplicar esta migration primero y conectar Apps/users débiles
-- solo tras verificar políticas funcionando.
