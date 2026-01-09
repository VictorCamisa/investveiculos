-- Adicionar coluna user_id na tabela whatsapp_instances para vincular instância ao vendedor
ALTER TABLE whatsapp_instances ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id);

-- Criar índice único para garantir que cada usuário tenha apenas uma instância
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_instances_user_id ON whatsapp_instances(user_id) WHERE user_id IS NOT NULL;