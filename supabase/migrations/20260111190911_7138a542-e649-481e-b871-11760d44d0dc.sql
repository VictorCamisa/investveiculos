-- Adicionar colunas faltantes na tabela whatsapp_messages
ALTER TABLE public.whatsapp_messages 
ADD COLUMN IF NOT EXISTS remote_jid text,
ADD COLUMN IF NOT EXISTS message_id text,
ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'received',
ADD COLUMN IF NOT EXISTS instance_id uuid,
ADD COLUMN IF NOT EXISTS lead_id uuid,
ADD COLUMN IF NOT EXISTS sent_by uuid;

-- Adicionar coluna last_message_at em whatsapp_contacts se não existir
ALTER TABLE public.whatsapp_contacts
ADD COLUMN IF NOT EXISTS last_message_at timestamptz,
ADD COLUMN IF NOT EXISTS lead_id uuid;

-- Garantir permissões para service_role
GRANT ALL ON public.whatsapp_messages TO service_role;
GRANT ALL ON public.whatsapp_contacts TO service_role;