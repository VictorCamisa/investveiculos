-- Drop the incorrectly created policy and recreate with correct role
DROP POLICY IF EXISTS "Vendedores veem leads das suas negociações" ON public.leads;

-- Recreate with authenticated role
CREATE POLICY "Vendedores veem leads das suas negociações" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'vendedor'::app_role) 
  AND EXISTS (
    SELECT 1 FROM negotiations 
    WHERE negotiations.lead_id = leads.id 
    AND negotiations.salesperson_id = auth.uid()
  )
);

-- Also add a policy to allow salespeople to view meta_campaigns with authenticated role
DROP POLICY IF EXISTS "Vendedores podem ver meta_campaigns" ON public.meta_campaigns;

CREATE POLICY "Vendedores podem ver meta_campaigns" 
ON public.meta_campaigns 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'vendedor'::app_role));
