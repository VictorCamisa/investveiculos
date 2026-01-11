
-- Add unread_count column to whatsapp_contacts
ALTER TABLE public.whatsapp_contacts 
ADD COLUMN IF NOT EXISTS unread_count integer DEFAULT 0;

-- Add comment
COMMENT ON COLUMN public.whatsapp_contacts.unread_count IS 'Contador de mensagens não lidas';
