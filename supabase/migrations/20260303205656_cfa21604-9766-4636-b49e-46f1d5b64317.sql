
-- Limpar dados de conversas de agentes IA
TRUNCATE TABLE public.ai_agent_messages CASCADE;
TRUNCATE TABLE public.ai_agent_conversations CASCADE;
TRUNCATE TABLE public.ai_agent_metrics CASCADE;

-- Limpar dados de interações e qualificações de leads
TRUNCATE TABLE public.lead_interactions CASCADE;
TRUNCATE TABLE public.lead_qualifications CASCADE;
TRUNCATE TABLE public.lead_assignments CASCADE;
TRUNCATE TABLE public.lead_costs CASCADE;

-- Limpar follow-ups e recovery
TRUNCATE TABLE public.follow_up_executions CASCADE;
TRUNCATE TABLE public.loss_recovery_executions CASCADE;

-- Limpar broadcasts
TRUNCATE TABLE public.broadcast_log_details CASCADE;
TRUNCATE TABLE public.broadcast_logs CASCADE;

-- Limpar comissões
TRUNCATE TABLE public.commission_splits CASCADE;
TRUNCATE TABLE public.commission_audit_log CASCADE;

-- Limpar contratos
TRUNCATE TABLE public.contracts CASCADE;

-- Limpar negociações
TRUNCATE TABLE public.negotiations CASCADE;

-- Limpar leads
TRUNCATE TABLE public.leads CASCADE;

-- Limpar WhatsApp messages/contacts
TRUNCATE TABLE public.whatsapp_messages CASCADE;
TRUNCATE TABLE public.whatsapp_contacts CASCADE;
