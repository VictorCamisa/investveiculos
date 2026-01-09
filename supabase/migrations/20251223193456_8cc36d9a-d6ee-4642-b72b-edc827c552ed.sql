-- Garantir que usuário master tenha acesso total (SELECT/INSERT/UPDATE/DELETE) em TODAS as tabelas do schema public.
-- Isso funciona com RLS porque as políticas existentes são PERMISSIVE.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Master full access" ON public.%I;', r.tablename);

    EXECUTE format(
      'CREATE POLICY "Master full access" ON public.%I ' ||
      'FOR ALL TO authenticated ' ||
      'USING (is_master_user(auth.uid())) ' ||
      'WITH CHECK (is_master_user(auth.uid()));',
      r.tablename
    );
  END LOOP;
END $$;
