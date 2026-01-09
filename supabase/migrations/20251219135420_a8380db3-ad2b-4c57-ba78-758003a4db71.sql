-- ===========================================
-- SISTEMA DE NOTIFICAÇÕES
-- ===========================================
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'new_lead', 'follow_up_due', 'approval_pending', 'goal_alert', 'whatsapp_message'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas próprias notificações"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Sistema pode inserir notificações"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar suas notificações"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar suas notificações"
ON public.notifications FOR DELETE
USING (user_id = auth.uid());

-- ===========================================
-- MÓDULO WHATSAPP - INSTÂNCIAS (Evolution API)
-- ===========================================
CREATE TABLE public.whatsapp_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  instance_name TEXT NOT NULL UNIQUE, -- Nome da instância na Evolution API
  api_url TEXT NOT NULL, -- URL da Evolution API
  api_key TEXT NOT NULL, -- API Key da Evolution
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected', -- 'connected', 'disconnected', 'connecting', 'qr_code'
  qr_code TEXT, -- QR Code base64 quando necessário
  qr_code_expires_at TIMESTAMP WITH TIME ZONE,
  is_default BOOLEAN DEFAULT false,
  webhook_url TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_instances_status ON public.whatsapp_instances(status);

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gerentes podem ver instâncias WhatsApp"
ON public.whatsapp_instances FOR SELECT
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem inserir instâncias WhatsApp"
ON public.whatsapp_instances FOR INSERT
WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem atualizar instâncias WhatsApp"
ON public.whatsapp_instances FOR UPDATE
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem deletar instâncias WhatsApp"
ON public.whatsapp_instances FOR DELETE
USING (has_role(auth.uid(), 'gerente'::app_role));

-- ===========================================
-- MÓDULO WHATSAPP - CONTATOS
-- ===========================================
CREATE TABLE public.whatsapp_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  name TEXT,
  profile_pic_url TEXT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(phone)
);

CREATE INDEX idx_whatsapp_contacts_phone ON public.whatsapp_contacts(phone);
CREATE INDEX idx_whatsapp_contacts_lead ON public.whatsapp_contacts(lead_id);
CREATE INDEX idx_whatsapp_contacts_customer ON public.whatsapp_contacts(customer_id);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver contatos WhatsApp"
ON public.whatsapp_contacts FOR SELECT
USING (
  has_role(auth.uid(), 'gerente'::app_role) OR
  has_role(auth.uid(), 'vendedor'::app_role) OR
  has_role(auth.uid(), 'marketing'::app_role)
);

CREATE POLICY "Gerentes podem inserir contatos WhatsApp"
ON public.whatsapp_contacts FOR INSERT
WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Sistema pode inserir contatos WhatsApp"
ON public.whatsapp_contacts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Gerentes podem atualizar contatos WhatsApp"
ON public.whatsapp_contacts FOR UPDATE
USING (has_role(auth.uid(), 'gerente'::app_role));

-- ===========================================
-- MÓDULO WHATSAPP - MENSAGENS
-- ===========================================
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  remote_jid TEXT NOT NULL, -- JID do WhatsApp
  message_id TEXT, -- ID da mensagem no WhatsApp
  direction TEXT NOT NULL, -- 'incoming', 'outgoing'
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'audio', 'video', 'document', 'sticker'
  content TEXT,
  media_url TEXT,
  media_mime_type TEXT,
  quoted_message_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
  sent_by UUID, -- Usuário que enviou (se outgoing)
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_messages_contact ON public.whatsapp_messages(contact_id);
CREATE INDEX idx_whatsapp_messages_lead ON public.whatsapp_messages(lead_id);
CREATE INDEX idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);
CREATE INDEX idx_whatsapp_messages_remote_jid ON public.whatsapp_messages(remote_jid);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gerentes veem todas as mensagens"
ON public.whatsapp_messages FOR SELECT
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Vendedores veem mensagens dos seus leads"
ON public.whatsapp_messages FOR SELECT
USING (
  has_role(auth.uid(), 'vendedor'::app_role) AND
  (
    lead_id IN (SELECT id FROM leads WHERE assigned_to = auth.uid()) OR
    sent_by = auth.uid()
  )
);

CREATE POLICY "Marketing vê todas as mensagens"
ON public.whatsapp_messages FOR SELECT
USING (has_role(auth.uid(), 'marketing'::app_role));

CREATE POLICY "Sistema pode inserir mensagens"
ON public.whatsapp_messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem enviar mensagens"
ON public.whatsapp_messages FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'gerente'::app_role) OR
  has_role(auth.uid(), 'vendedor'::app_role)
);

CREATE POLICY "Sistema pode atualizar status mensagens"
ON public.whatsapp_messages FOR UPDATE
USING (true);

-- ===========================================
-- MÓDULO WHATSAPP - TEMPLATES DE MENSAGEM
-- ===========================================
CREATE TABLE public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'greeting', 'follow_up', 'promotion', 'info', 'custom'
  content TEXT NOT NULL,
  variables TEXT[], -- Variáveis disponíveis: {{nome}}, {{veiculo}}, {{vendedor}}
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados veem templates"
ON public.whatsapp_templates FOR SELECT
USING (
  has_role(auth.uid(), 'gerente'::app_role) OR
  has_role(auth.uid(), 'vendedor'::app_role) OR
  has_role(auth.uid(), 'marketing'::app_role)
);

CREATE POLICY "Gerentes podem gerenciar templates"
ON public.whatsapp_templates FOR ALL
USING (has_role(auth.uid(), 'gerente'::app_role));

-- ===========================================
-- TRIGGERS PARA UPDATED_AT
-- ===========================================
CREATE TRIGGER update_whatsapp_instances_updated_at
BEFORE UPDATE ON public.whatsapp_instances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_contacts_updated_at
BEFORE UPDATE ON public.whatsapp_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at
BEFORE UPDATE ON public.whatsapp_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- FUNÇÃO PARA CRIAR NOTIFICAÇÃO
-- ===========================================
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (p_user_id, p_type, p_title, p_message, p_link)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- ===========================================
-- TRIGGER PARA NOTIFICAR NOVO LEAD
-- ===========================================
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notifica o vendedor atribuído
  IF NEW.assigned_to IS NOT NULL THEN
    PERFORM public.create_notification(
      NEW.assigned_to,
      'new_lead',
      'Novo lead atribuído!',
      'O lead ' || NEW.name || ' foi atribuído a você.',
      '/crm'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_lead
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_lead();