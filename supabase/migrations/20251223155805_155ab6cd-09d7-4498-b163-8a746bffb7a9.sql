-- Update RLS policy for whatsapp_messages to also allow instance owners to see messages
-- Drop existing policy first
DROP POLICY IF EXISTS "Vendedores veem mensagens dos seus leads" ON public.whatsapp_messages;

-- Recreate with additional condition for instance owners
CREATE POLICY "Vendedores veem mensagens dos seus leads ou instância"
ON public.whatsapp_messages FOR SELECT
USING (
  has_role(auth.uid(), 'vendedor'::app_role) AND
  (
    -- Lead is assigned to the user
    lead_id IN (SELECT id FROM leads WHERE assigned_to = auth.uid()) OR
    -- User sent the message
    sent_by = auth.uid() OR
    -- User owns the WhatsApp instance that received/sent the message
    instance_id IN (SELECT id FROM whatsapp_instances WHERE user_id = auth.uid())
  )
);