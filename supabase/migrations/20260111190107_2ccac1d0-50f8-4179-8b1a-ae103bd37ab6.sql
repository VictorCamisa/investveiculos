-- Conceder permissões básicas para service_role na tabela leads
GRANT ALL ON public.leads TO service_role;

-- Também para as tabelas relacionadas que o webhook precisa acessar
GRANT ALL ON public.negotiations TO service_role;
GRANT ALL ON public.customers TO service_role;
GRANT ALL ON public.whatsapp_contacts TO service_role;
GRANT ALL ON public.whatsapp_messages TO service_role;
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.lead_interactions TO service_role;
GRANT ALL ON public.whatsapp_instances TO service_role;
GRANT ALL ON public.round_robin_config TO service_role;
GRANT ALL ON public.profiles TO service_role;

-- Conceder uso das sequences (para auto-increment de IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;