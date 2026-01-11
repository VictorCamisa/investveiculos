
-- Create contact for Victor Camisa
INSERT INTO public.whatsapp_contacts (phone, name, lead_id, last_message_at, unread_count)
VALUES ('5511965734341', 'Victor Camisa', 'b18f7059-a8b5-4ed6-b188-be6d60ae413d', NOW(), 1);

-- Get the contact ID and update the message
UPDATE public.whatsapp_messages 
SET contact_id = (SELECT id FROM public.whatsapp_contacts WHERE phone = '5511965734341' LIMIT 1)
WHERE lead_id = 'b18f7059-a8b5-4ed6-b188-be6d60ae413d' AND contact_id IS NULL;

-- Connect AI Agent "InvestVeiculos" to WhatsApp instance "Botinvestdois"
UPDATE public.ai_agents 
SET 
  whatsapp_instance_id = '5a073fbb-9f6d-4c7d-a651-67e5e293672f',
  whatsapp_auto_reply = true
WHERE id = 'fa5d99bf-bec8-4fe6-a821-028b862c683f';
