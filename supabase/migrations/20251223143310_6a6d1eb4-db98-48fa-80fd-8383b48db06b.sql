-- Allow salespeople to view their own WhatsApp instance
CREATE POLICY "Vendedores podem ver sua própria instância WhatsApp" 
ON public.whatsapp_instances 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'vendedor'::app_role) AND user_id = auth.uid());