-- Conceder permissões básicas para todas as tabelas de AI Agents

-- ai_agents
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agents TO authenticated;
GRANT SELECT ON public.ai_agents TO anon;
GRANT ALL ON public.ai_agents TO service_role;

-- ai_agent_tools
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agent_tools TO authenticated;
GRANT SELECT ON public.ai_agent_tools TO anon;
GRANT ALL ON public.ai_agent_tools TO service_role;

-- ai_agent_data_sources
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agent_data_sources TO authenticated;
GRANT SELECT ON public.ai_agent_data_sources TO anon;
GRANT ALL ON public.ai_agent_data_sources TO service_role;

-- ai_agent_workflows
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agent_workflows TO authenticated;
GRANT SELECT ON public.ai_agent_workflows TO anon;
GRANT ALL ON public.ai_agent_workflows TO service_role;

-- ai_agent_guardrails
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agent_guardrails TO authenticated;
GRANT SELECT ON public.ai_agent_guardrails TO anon;
GRANT ALL ON public.ai_agent_guardrails TO service_role;

-- ai_agent_conversations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agent_conversations TO authenticated;
GRANT SELECT ON public.ai_agent_conversations TO anon;
GRANT ALL ON public.ai_agent_conversations TO service_role;

-- ai_agent_messages
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agent_messages TO authenticated;
GRANT SELECT ON public.ai_agent_messages TO anon;
GRANT ALL ON public.ai_agent_messages TO service_role;

-- ai_agent_metrics
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agent_metrics TO authenticated;
GRANT SELECT ON public.ai_agent_metrics TO anon;
GRANT ALL ON public.ai_agent_metrics TO service_role;

-- ai_agent_notifications
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agent_notifications TO authenticated;
GRANT SELECT ON public.ai_agent_notifications TO anon;
GRANT ALL ON public.ai_agent_notifications TO service_role;

-- ai_agent_tests
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agent_tests TO authenticated;
GRANT SELECT ON public.ai_agent_tests TO anon;
GRANT ALL ON public.ai_agent_tests TO service_role;