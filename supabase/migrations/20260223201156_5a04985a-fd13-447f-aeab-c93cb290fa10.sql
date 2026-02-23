
-- Update SELECT policy: vendedor só vê negociações a partir do estágio "negociando"
DROP POLICY IF EXISTS "Users can view their negotiations" ON public.negotiations;

CREATE POLICY "Users can view their negotiations"
ON public.negotiations
FOR SELECT
TO authenticated
USING (
  is_master_user(auth.uid())
  OR has_role(auth.uid(), 'gerente'::app_role)
  OR (
    salesperson_id = auth.uid()
    AND status NOT IN ('em_andamento', 'proposta_enviada')
  )
);
