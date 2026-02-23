
-- Drop existing SELECT policies on leads
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;

-- Vendedor vê apenas leads atribuídos a ele, gerente/master vê tudo
CREATE POLICY "Users can view their leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  is_master_user(auth.uid()) 
  OR has_role(auth.uid(), 'gerente'::app_role)
  OR assigned_to = auth.uid()
  OR created_by = auth.uid()
);

-- Drop existing SELECT policies on negotiations
DROP POLICY IF EXISTS "Usuários autenticados podem ver negociações" ON public.negotiations;

-- Vendedor vê apenas suas negociações
CREATE POLICY "Users can view their negotiations"
ON public.negotiations
FOR SELECT
TO authenticated
USING (
  is_master_user(auth.uid())
  OR has_role(auth.uid(), 'gerente'::app_role)
  OR salesperson_id = auth.uid()
);

-- Drop existing SELECT policy on lead_interactions
DROP POLICY IF EXISTS "Authenticated access lead interactions" ON public.lead_interactions;

-- Vendedor vê apenas interações dos seus leads
CREATE POLICY "Users can view their lead interactions"
ON public.lead_interactions
FOR ALL
TO authenticated
USING (
  is_master_user(auth.uid())
  OR has_role(auth.uid(), 'gerente'::app_role)
  OR user_id = auth.uid()
  OR lead_id IN (SELECT id FROM public.leads WHERE assigned_to = auth.uid() OR created_by = auth.uid())
);
