-- Create follow_up_flows table for WhatsApp follow-up automation
CREATE TABLE public.follow_up_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Segmentation filters
  target_lead_status TEXT[] DEFAULT '{}',
  target_lead_sources TEXT[] DEFAULT '{}',
  target_vehicle_interests TEXT[] DEFAULT '{}',
  target_negotiation_status TEXT[] DEFAULT '{}',
  
  -- Timing configuration
  trigger_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'after_lead_creation', 'after_status_change', 'after_inactivity', 'scheduled'
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  specific_time TIME,
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}', -- 1=Monday to 7=Sunday
  
  -- Message configuration
  message_template TEXT NOT NULL,
  include_vehicle_info BOOLEAN DEFAULT false,
  include_salesperson_name BOOLEAN DEFAULT true,
  include_company_name BOOLEAN DEFAULT true,
  
  -- WhatsApp settings
  whatsapp_button_text TEXT DEFAULT 'Enviar WhatsApp',
  
  -- Conditions
  min_days_since_last_contact INTEGER,
  max_contacts_per_lead INTEGER DEFAULT 5,
  exclude_converted_leads BOOLEAN DEFAULT true,
  exclude_lost_leads BOOLEAN DEFAULT true,
  
  -- Priority and order
  priority INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.follow_up_flows ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only managers can manage follow-up flows
CREATE POLICY "Gerentes podem ver fluxos de follow-up"
ON public.follow_up_flows
FOR SELECT
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem inserir fluxos de follow-up"
ON public.follow_up_flows
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem atualizar fluxos de follow-up"
ON public.follow_up_flows
FOR UPDATE
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem deletar fluxos de follow-up"
ON public.follow_up_flows
FOR DELETE
USING (has_role(auth.uid(), 'gerente'::app_role));

-- Salespeople can view active flows
CREATE POLICY "Vendedores podem ver fluxos ativos"
ON public.follow_up_flows
FOR SELECT
USING (has_role(auth.uid(), 'vendedor'::app_role) AND is_active = true);

-- Marketing can view flows
CREATE POLICY "Marketing pode ver fluxos de follow-up"
ON public.follow_up_flows
FOR SELECT
USING (has_role(auth.uid(), 'marketing'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_follow_up_flows_updated_at
BEFORE UPDATE ON public.follow_up_flows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create follow_up_executions table to track sent messages
CREATE TABLE public.follow_up_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.follow_up_flows(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  executed_by UUID,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message_sent TEXT,
  whatsapp_number TEXT,
  status TEXT DEFAULT 'sent' -- 'sent', 'failed', 'pending'
);

-- Enable RLS
ALTER TABLE public.follow_up_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for executions
CREATE POLICY "Gerentes podem ver todas as execuções"
ON public.follow_up_executions
FOR SELECT
USING (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Gerentes podem inserir execuções"
ON public.follow_up_executions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Vendedores podem ver e inserir suas execuções"
ON public.follow_up_executions
FOR SELECT
USING (has_role(auth.uid(), 'vendedor'::app_role) AND executed_by = auth.uid());

CREATE POLICY "Vendedores podem inserir suas execuções"
ON public.follow_up_executions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'vendedor'::app_role) AND executed_by = auth.uid());

CREATE POLICY "Marketing pode ver execuções"
ON public.follow_up_executions
FOR SELECT
USING (has_role(auth.uid(), 'marketing'::app_role));