-- Allow salespeople to view leads that are in their negotiations (even if not assigned directly)
CREATE POLICY "Vendedores veem leads das suas negociações" 
ON public.leads 
FOR SELECT 
USING (
  has_role(auth.uid(), 'vendedor'::app_role) 
  AND EXISTS (
    SELECT 1 FROM negotiations 
    WHERE negotiations.lead_id = leads.id 
    AND negotiations.salesperson_id = auth.uid()
  )
);