-- Create table for loss recovery automation rules
CREATE TABLE public.loss_recovery_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Trigger: which loss reasons trigger this rule
  trigger_loss_reasons TEXT[] NOT NULL DEFAULT '{}',
  
  -- Action type: what happens when triggered
  action_type TEXT NOT NULL DEFAULT 'whatsapp_message' CHECK (action_type IN ('whatsapp_message', 'create_vehicle_alert', 'schedule_follow_up', 'notify_manager')),
  
  -- Timing
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  
  -- Message configuration (for whatsapp_message action)
  message_template TEXT,
  include_vehicle_info BOOLEAN DEFAULT true,
  include_salesperson_name BOOLEAN DEFAULT true,
  
  -- Vehicle alert configuration (for create_vehicle_alert action)
  auto_create_alert BOOLEAN DEFAULT false,
  alert_price_range_percent INTEGER DEFAULT 20,
  alert_year_range INTEGER DEFAULT 1,
  
  -- Conditions
  min_days_since_loss INTEGER,
  max_attempts_per_lead INTEGER DEFAULT 3,
  
  -- Priority (lower = higher priority)
  priority INTEGER DEFAULT 10,
  
  -- Metadata
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loss_recovery_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view loss recovery rules"
  ON public.loss_recovery_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create loss recovery rules"
  ON public.loss_recovery_rules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update loss recovery rules"
  ON public.loss_recovery_rules FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete loss recovery rules"
  ON public.loss_recovery_rules FOR DELETE
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_loss_recovery_rules_updated_at
  BEFORE UPDATE ON public.loss_recovery_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create table to track rule executions
CREATE TABLE public.loss_recovery_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.loss_recovery_rules(id) ON DELETE CASCADE,
  negotiation_id UUID NOT NULL REFERENCES public.negotiations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed', 'skipped')),
  result_message TEXT,
  executed_by UUID
);

-- Enable RLS
ALTER TABLE public.loss_recovery_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for executions
CREATE POLICY "Authenticated users can view loss recovery executions"
  ON public.loss_recovery_executions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create loss recovery executions"
  ON public.loss_recovery_executions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update loss recovery executions"
  ON public.loss_recovery_executions FOR UPDATE
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX idx_loss_recovery_rules_active ON public.loss_recovery_rules(is_active);
CREATE INDEX idx_loss_recovery_rules_trigger ON public.loss_recovery_rules USING GIN(trigger_loss_reasons);
CREATE INDEX idx_loss_recovery_executions_rule ON public.loss_recovery_executions(rule_id);
CREATE INDEX idx_loss_recovery_executions_negotiation ON public.loss_recovery_executions(negotiation_id);