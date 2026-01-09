-- Allow salespeople to select Meta campaigns (needed for embedded selects in leads queries)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'meta_campaigns'
      AND policyname = 'Vendedores podem ver meta_campaigns'
  ) THEN
    CREATE POLICY "Vendedores podem ver meta_campaigns"
    ON public.meta_campaigns
    FOR SELECT
    TO authenticated
    USING (has_role(auth.uid(), 'vendedor'::app_role));
  END IF;
END $$;
