-- Allow authenticated users to create their own profile rows during bootstrap.
-- Fixes: "new row violates row-level security policy for table \"users\"/\"users_private\""

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'authenticated_insert_own_profile'
  ) THEN
    CREATE POLICY "authenticated_insert_own_profile"
      ON public.users
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid()::text = uid);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users_private' AND policyname = 'authenticated_insert_own_private'
  ) THEN
    CREATE POLICY "authenticated_insert_own_private"
      ON public.users_private
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid()::text = uid);
  END IF;
END $$;
