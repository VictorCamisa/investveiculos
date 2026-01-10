-- =============================================
-- CENTRO DE COMANDO DE IA - MÓDULO COMPLETO
-- =============================================

-- 1. Tabela principal: ai_agents
CREATE TABLE public.ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  objective TEXT DEFAULT 'qualify_leads',
  status TEXT DEFAULT 'inactive',
  
  -- LLM Config
  llm_provider TEXT DEFAULT 'google',
  llm_model TEXT DEFAULT 'google/gemini-3-flash-preview',
  api_key_encrypted TEXT,
  temperature NUMERIC(2,1) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 1),
  top_p NUMERIC(2,1) DEFAULT 0.9 CHECK (top_p >= 0 AND top_p <= 1),
  max_tokens INTEGER DEFAULT 2048,
  system_prompt TEXT,
  
  -- Memory Config
  short_term_memory_type TEXT DEFAULT 'local',
  redis_host TEXT,
  redis_port INTEGER,
  redis_password_encrypted TEXT,
  context_window_size INTEGER DEFAULT 10,
  
  long_term_memory_enabled BOOLEAN DEFAULT false,
  vector_db_provider TEXT DEFAULT 'supabase',
  vector_db_config JSONB DEFAULT '{}',
  
  -- Output Config
  output_format TEXT DEFAULT 'text',
  
  -- Deployment
  deployment_channels TEXT[] DEFAULT '{}',
  embed_code TEXT,
  webhook_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- 2. Tabela de ferramentas: ai_agent_tools
CREATE TABLE public.ai_agent_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  endpoint_url TEXT,
  function_schema JSONB NOT NULL DEFAULT '{}',
  auth_method TEXT DEFAULT 'none',
  auth_credentials_encrypted TEXT,
  input_mapping JSONB,
  output_mapping JSONB,
  orchestration_rules TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de fontes de dados: ai_agent_data_sources
CREATE TABLE public.ai_agent_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  connection_config JSONB DEFAULT '{}',
  table_name TEXT,
  embeddings_enabled BOOLEAN DEFAULT false,
  text_column TEXT,
  embedding_column TEXT,
  embedding_model TEXT DEFAULT 'text-embedding-ada-002',
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de workflows: ai_agent_workflows
CREATE TABLE public.ai_agent_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  workflow_definition JSONB NOT NULL DEFAULT '{}',
  trigger_conditions JSONB,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela de guardrails: ai_agent_guardrails
CREATE TABLE public.ai_agent_guardrails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  action_on_violation TEXT DEFAULT 'block',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela de conversas: ai_agent_conversations
CREATE TABLE public.ai_agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  lead_id UUID REFERENCES public.leads(id),
  channel TEXT DEFAULT 'widget',
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}'
);

-- 7. Tabela de mensagens: ai_agent_messages
CREATE TABLE public.ai_agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  thinking TEXT,
  tool_calls JSONB,
  tool_results JSONB,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Tabela de métricas: ai_agent_metrics
CREATE TABLE public.ai_agent_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  conversations_count INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  avg_response_time_ms INTEGER,
  avg_lead_score NUMERIC(5,2),
  tool_calls_count JSONB DEFAULT '{}',
  errors_count INTEGER DEFAULT 0,
  error_types JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, date)
);

-- 9. Tabela de notificações: ai_agent_notifications
CREATE TABLE public.ai_agent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  channel_config JSONB DEFAULT '{}',
  condition_type TEXT NOT NULL,
  condition_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Tabela de testes: ai_agent_tests
CREATE TABLE public.ai_agent_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  test_type TEXT DEFAULT 'simulation',
  scenario JSONB NOT NULL DEFAULT '{}',
  expected_outcome TEXT,
  actual_outcome TEXT,
  passed BOOLEAN,
  executed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_ai_agents_status ON public.ai_agents(status);
CREATE INDEX idx_ai_agents_created_by ON public.ai_agents(created_by);
CREATE INDEX idx_ai_agent_tools_agent_id ON public.ai_agent_tools(agent_id);
CREATE INDEX idx_ai_agent_data_sources_agent_id ON public.ai_agent_data_sources(agent_id);
CREATE INDEX idx_ai_agent_workflows_agent_id ON public.ai_agent_workflows(agent_id);
CREATE INDEX idx_ai_agent_guardrails_agent_id ON public.ai_agent_guardrails(agent_id);
CREATE INDEX idx_ai_agent_conversations_agent_id ON public.ai_agent_conversations(agent_id);
CREATE INDEX idx_ai_agent_conversations_session_id ON public.ai_agent_conversations(session_id);
CREATE INDEX idx_ai_agent_messages_conversation_id ON public.ai_agent_messages(conversation_id);
CREATE INDEX idx_ai_agent_metrics_agent_date ON public.ai_agent_metrics(agent_id, date);
CREATE INDEX idx_ai_agent_notifications_agent_id ON public.ai_agent_notifications(agent_id);
CREATE INDEX idx_ai_agent_tests_agent_id ON public.ai_agent_tests(agent_id);

-- Trigger para updated_at em ai_agents
CREATE TRIGGER update_ai_agents_updated_at
  BEFORE UPDATE ON public.ai_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS em todas as tabelas
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_guardrails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_tests ENABLE ROW LEVEL SECURITY;

-- Policies para ai_agents
CREATE POLICY "Usuários autenticados podem ver agentes"
  ON public.ai_agents FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gerentes e masters podem criar agentes"
  ON public.ai_agents FOR INSERT
  WITH CHECK (
    public.is_master_user(auth.uid()) OR 
    public.has_role(auth.uid(), 'gerente'::app_role)
  );

CREATE POLICY "Gerentes e masters podem atualizar agentes"
  ON public.ai_agents FOR UPDATE
  USING (
    public.is_master_user(auth.uid()) OR 
    public.has_role(auth.uid(), 'gerente'::app_role)
  );

CREATE POLICY "Masters podem deletar agentes"
  ON public.ai_agents FOR DELETE
  USING (public.is_master_user(auth.uid()));

-- Policies para ai_agent_tools
CREATE POLICY "Usuários autenticados podem ver ferramentas"
  ON public.ai_agent_tools FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gerentes podem gerenciar ferramentas"
  ON public.ai_agent_tools FOR ALL
  USING (
    public.is_master_user(auth.uid()) OR 
    public.has_role(auth.uid(), 'gerente'::app_role)
  );

-- Policies para ai_agent_data_sources
CREATE POLICY "Usuários autenticados podem ver fontes de dados"
  ON public.ai_agent_data_sources FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gerentes podem gerenciar fontes de dados"
  ON public.ai_agent_data_sources FOR ALL
  USING (
    public.is_master_user(auth.uid()) OR 
    public.has_role(auth.uid(), 'gerente'::app_role)
  );

-- Policies para ai_agent_workflows
CREATE POLICY "Usuários autenticados podem ver workflows"
  ON public.ai_agent_workflows FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gerentes podem gerenciar workflows"
  ON public.ai_agent_workflows FOR ALL
  USING (
    public.is_master_user(auth.uid()) OR 
    public.has_role(auth.uid(), 'gerente'::app_role)
  );

-- Policies para ai_agent_guardrails
CREATE POLICY "Usuários autenticados podem ver guardrails"
  ON public.ai_agent_guardrails FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gerentes podem gerenciar guardrails"
  ON public.ai_agent_guardrails FOR ALL
  USING (
    public.is_master_user(auth.uid()) OR 
    public.has_role(auth.uid(), 'gerente'::app_role)
  );

-- Policies para ai_agent_conversations
CREATE POLICY "Usuários autenticados podem ver conversas"
  ON public.ai_agent_conversations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sistema pode criar conversas"
  ON public.ai_agent_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar conversas"
  ON public.ai_agent_conversations FOR UPDATE
  USING (true);

-- Policies para ai_agent_messages
CREATE POLICY "Usuários autenticados podem ver mensagens"
  ON public.ai_agent_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sistema pode criar mensagens"
  ON public.ai_agent_messages FOR INSERT
  WITH CHECK (true);

-- Policies para ai_agent_metrics
CREATE POLICY "Usuários autenticados podem ver métricas"
  ON public.ai_agent_metrics FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sistema pode gerenciar métricas"
  ON public.ai_agent_metrics FOR ALL
  USING (true);

-- Policies para ai_agent_notifications
CREATE POLICY "Usuários autenticados podem ver notificações"
  ON public.ai_agent_notifications FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gerentes podem gerenciar notificações"
  ON public.ai_agent_notifications FOR ALL
  USING (
    public.is_master_user(auth.uid()) OR 
    public.has_role(auth.uid(), 'gerente'::app_role)
  );

-- Policies para ai_agent_tests
CREATE POLICY "Usuários autenticados podem ver testes"
  ON public.ai_agent_tests FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gerentes podem gerenciar testes"
  ON public.ai_agent_tests FOR ALL
  USING (
    public.is_master_user(auth.uid()) OR 
    public.has_role(auth.uid(), 'gerente'::app_role)
  );