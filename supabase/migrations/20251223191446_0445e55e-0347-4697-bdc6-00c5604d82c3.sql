-- Remover is_master de "Venda de Soluções" e adicionar a "Matheus de Almeida"
UPDATE profiles SET is_master = false WHERE id = '8e416585-5f26-4c72-aa04-9db682b425f2';
UPDATE profiles SET is_master = true WHERE id = '6c6e6c96-41d1-4ccc-a8d7-bbe1d1e62336';

-- Adicionar políticas para usuários MASTER verem TUDO

-- Leads: Master vê todos
DROP POLICY IF EXISTS "Master pode ver todos os leads" ON leads;
CREATE POLICY "Master pode ver todos os leads" ON leads FOR SELECT
USING (is_master_user(auth.uid()));

DROP POLICY IF EXISTS "Master pode atualizar todos os leads" ON leads;
CREATE POLICY "Master pode atualizar todos os leads" ON leads FOR UPDATE
USING (is_master_user(auth.uid()));

DROP POLICY IF EXISTS "Master pode inserir leads" ON leads;
CREATE POLICY "Master pode inserir leads" ON leads FOR INSERT
WITH CHECK (is_master_user(auth.uid()));

DROP POLICY IF EXISTS "Master pode deletar leads" ON leads;
CREATE POLICY "Master pode deletar leads" ON leads FOR DELETE
USING (is_master_user(auth.uid()));

-- WhatsApp Messages: Master vê todas
DROP POLICY IF EXISTS "Master vê todas as mensagens" ON whatsapp_messages;
CREATE POLICY "Master vê todas as mensagens" ON whatsapp_messages FOR SELECT
USING (is_master_user(auth.uid()));

-- WhatsApp Instances: Master vê e gerencia todas
DROP POLICY IF EXISTS "Master pode ver todas instâncias WhatsApp" ON whatsapp_instances;
CREATE POLICY "Master pode ver todas instâncias WhatsApp" ON whatsapp_instances FOR SELECT
USING (is_master_user(auth.uid()));

DROP POLICY IF EXISTS "Master pode atualizar instâncias WhatsApp" ON whatsapp_instances;
CREATE POLICY "Master pode atualizar instâncias WhatsApp" ON whatsapp_instances FOR UPDATE
USING (is_master_user(auth.uid()));

DROP POLICY IF EXISTS "Master pode inserir instâncias WhatsApp" ON whatsapp_instances;
CREATE POLICY "Master pode inserir instâncias WhatsApp" ON whatsapp_instances FOR INSERT
WITH CHECK (is_master_user(auth.uid()));

DROP POLICY IF EXISTS "Master pode deletar instâncias WhatsApp" ON whatsapp_instances;
CREATE POLICY "Master pode deletar instâncias WhatsApp" ON whatsapp_instances FOR DELETE
USING (is_master_user(auth.uid()));

-- WhatsApp Contacts: Master vê todos
DROP POLICY IF EXISTS "Master vê todos os contatos" ON whatsapp_contacts;
CREATE POLICY "Master vê todos os contatos" ON whatsapp_contacts FOR SELECT
USING (is_master_user(auth.uid()));

-- Negotiations: Master vê todas
DROP POLICY IF EXISTS "Master pode ver todas negociações" ON negotiations;
CREATE POLICY "Master pode ver todas negociações" ON negotiations FOR SELECT
USING (is_master_user(auth.uid()));

DROP POLICY IF EXISTS "Master pode atualizar negociações" ON negotiations;
CREATE POLICY "Master pode atualizar negociações" ON negotiations FOR UPDATE
USING (is_master_user(auth.uid()));

DROP POLICY IF EXISTS "Master pode inserir negociações" ON negotiations;
CREATE POLICY "Master pode inserir negociações" ON negotiations FOR INSERT
WITH CHECK (is_master_user(auth.uid()));

DROP POLICY IF EXISTS "Master pode deletar negociações" ON negotiations;
CREATE POLICY "Master pode deletar negociações" ON negotiations FOR DELETE
USING (is_master_user(auth.uid()));