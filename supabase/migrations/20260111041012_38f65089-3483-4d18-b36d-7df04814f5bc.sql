-- Create policy to allow service_role to insert leads (for Edge Functions)
CREATE POLICY "Service role can insert leads"
ON public.leads
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create policy to allow service_role to update leads
CREATE POLICY "Service role can update leads"
ON public.leads
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Also add for negotiations table
CREATE POLICY "Service role can insert negotiations"
ON public.negotiations
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also add for whatsapp_contacts
CREATE POLICY "Service role can insert whatsapp_contacts"
ON public.whatsapp_contacts
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update whatsapp_contacts"
ON public.whatsapp_contacts
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Also add for whatsapp_messages
CREATE POLICY "Service role can insert whatsapp_messages"
ON public.whatsapp_messages
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also add for lead_interactions
CREATE POLICY "Service role can insert lead_interactions"
ON public.lead_interactions
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also add for notifications
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);