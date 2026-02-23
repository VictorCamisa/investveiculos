
-- Drop the permissive ALL policy that bypasses the new SELECT restriction
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar negociações" ON public.negotiations;

-- Vendedor só pode atualizar suas próprias negociações
CREATE POLICY "Users can update their negotiations"
ON public.negotiations
FOR UPDATE
TO authenticated
USING (
  is_master_user(auth.uid())
  OR has_role(auth.uid(), 'gerente'::app_role)
  OR salesperson_id = auth.uid()
);

-- Vendedor só pode deletar suas próprias negociações
CREATE POLICY "Users can delete their negotiations"
ON public.negotiations
FOR DELETE
TO authenticated
USING (
  is_master_user(auth.uid())
  OR has_role(auth.uid(), 'gerente'::app_role)
  OR salesperson_id = auth.uid()
);

-- Qualquer autenticado pode criar negociação
CREATE POLICY "Authenticated users can insert negotiations"
ON public.negotiations
FOR INSERT
TO authenticated
WITH CHECK (true);
