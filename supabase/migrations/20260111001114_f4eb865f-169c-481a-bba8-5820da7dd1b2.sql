-- Fix RLS policies for ai_agents table to allow gerente access

-- Drop existing policies
DROP POLICY IF EXISTS "Masters and managers can view ai_agents" ON ai_agents;
DROP POLICY IF EXISTS "Masters and managers can create ai_agents" ON ai_agents;
DROP POLICY IF EXISTS "Masters and managers can update ai_agents" ON ai_agents;
DROP POLICY IF EXISTS "Masters and managers can delete ai_agents" ON ai_agents;

-- Create new policies using has_role function
CREATE POLICY "Gerentes podem visualizar ai_agents" 
ON ai_agents FOR SELECT 
USING (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

CREATE POLICY "Gerentes podem criar ai_agents" 
ON ai_agents FOR INSERT 
WITH CHECK (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

CREATE POLICY "Gerentes podem atualizar ai_agents" 
ON ai_agents FOR UPDATE 
USING (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

CREATE POLICY "Gerentes podem deletar ai_agents" 
ON ai_agents FOR DELETE 
USING (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

-- Also fix related tables
-- AI Agent Tools
DROP POLICY IF EXISTS "Masters and managers can view ai_agent_tools" ON ai_agent_tools;
DROP POLICY IF EXISTS "Masters and managers can manage ai_agent_tools" ON ai_agent_tools;

CREATE POLICY "Gerentes podem visualizar ai_agent_tools" 
ON ai_agent_tools FOR SELECT 
USING (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

CREATE POLICY "Gerentes podem criar ai_agent_tools" 
ON ai_agent_tools FOR INSERT 
WITH CHECK (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

CREATE POLICY "Gerentes podem atualizar ai_agent_tools" 
ON ai_agent_tools FOR UPDATE 
USING (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

CREATE POLICY "Gerentes podem deletar ai_agent_tools" 
ON ai_agent_tools FOR DELETE 
USING (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

-- AI Agent Workflows
DROP POLICY IF EXISTS "Masters and managers can view ai_agent_workflows" ON ai_agent_workflows;
DROP POLICY IF EXISTS "Masters and managers can manage ai_agent_workflows" ON ai_agent_workflows;

CREATE POLICY "Gerentes podem visualizar ai_agent_workflows" 
ON ai_agent_workflows FOR SELECT 
USING (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

CREATE POLICY "Gerentes podem gerenciar ai_agent_workflows" 
ON ai_agent_workflows FOR ALL 
USING (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

-- AI Agent Guardrails
DROP POLICY IF EXISTS "Masters and managers can view ai_agent_guardrails" ON ai_agent_guardrails;
DROP POLICY IF EXISTS "Masters and managers can manage ai_agent_guardrails" ON ai_agent_guardrails;

CREATE POLICY "Gerentes podem gerenciar ai_agent_guardrails" 
ON ai_agent_guardrails FOR ALL 
USING (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

-- AI Agent Data Sources
DROP POLICY IF EXISTS "Masters and managers can view ai_agent_data_sources" ON ai_agent_data_sources;
DROP POLICY IF EXISTS "Masters and managers can manage ai_agent_data_sources" ON ai_agent_data_sources;

CREATE POLICY "Gerentes podem gerenciar ai_agent_data_sources" 
ON ai_agent_data_sources FOR ALL 
USING (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

-- AI Agent Conversations
DROP POLICY IF EXISTS "Users can view conversations" ON ai_agent_conversations;
DROP POLICY IF EXISTS "Users can manage conversations" ON ai_agent_conversations;

CREATE POLICY "Gerentes podem gerenciar ai_agent_conversations" 
ON ai_agent_conversations FOR ALL 
USING (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

-- AI Agent Messages
DROP POLICY IF EXISTS "Users can view messages" ON ai_agent_messages;
DROP POLICY IF EXISTS "Users can manage messages" ON ai_agent_messages;

CREATE POLICY "Gerentes podem gerenciar ai_agent_messages" 
ON ai_agent_messages FOR ALL 
USING (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

-- AI Agent Metrics
DROP POLICY IF EXISTS "Masters and managers can view ai_agent_metrics" ON ai_agent_metrics;
DROP POLICY IF EXISTS "Masters and managers can manage ai_agent_metrics" ON ai_agent_metrics;

CREATE POLICY "Gerentes podem gerenciar ai_agent_metrics" 
ON ai_agent_metrics FOR ALL 
USING (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

-- AI Agent Notifications
DROP POLICY IF EXISTS "Masters and managers can view ai_agent_notifications" ON ai_agent_notifications;
DROP POLICY IF EXISTS "Masters and managers can manage ai_agent_notifications" ON ai_agent_notifications;

CREATE POLICY "Gerentes podem gerenciar ai_agent_notifications" 
ON ai_agent_notifications FOR ALL 
USING (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);

-- AI Agent Tests
DROP POLICY IF EXISTS "Masters and managers can view ai_agent_tests" ON ai_agent_tests;
DROP POLICY IF EXISTS "Masters and managers can manage ai_agent_tests" ON ai_agent_tests;

CREATE POLICY "Gerentes podem gerenciar ai_agent_tests" 
ON ai_agent_tests FOR ALL 
USING (
  public.is_master_user(auth.uid()) 
  OR public.has_role(auth.uid(), 'gerente'::app_role)
);