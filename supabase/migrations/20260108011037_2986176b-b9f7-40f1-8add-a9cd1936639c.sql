-- DELETAR TODOS OS DADOS E PROFILES (em ordem correta para evitar FK violations)

-- Deletar tabelas que referenciam profiles
DELETE FROM public.sale_commissions;
DELETE FROM public.commission_splits;
DELETE FROM public.sales;
DELETE FROM public.negotiations;
DELETE FROM public.lead_assignments;
DELETE FROM public.lead_interactions;
DELETE FROM public.lead_costs;
DELETE FROM public.leads;
DELETE FROM public.customers;
DELETE FROM public.whatsapp_messages;
DELETE FROM public.whatsapp_contacts;
DELETE FROM public.whatsapp_instances;
DELETE FROM public.follow_up_executions;
DELETE FROM public.follow_up_flows;
DELETE FROM public.financial_transactions;
DELETE FROM public.vehicles;
DELETE FROM public.marketing_campaigns;
DELETE FROM public.marketing_alerts;
DELETE FROM public.campaign_events;
DELETE FROM public.channel_costs;
DELETE FROM public.commission_audit_log;
DELETE FROM public.commission_rules;
DELETE FROM public.meta_insights;
DELETE FROM public.meta_ads;
DELETE FROM public.meta_adsets;
DELETE FROM public.meta_campaigns;
DELETE FROM public.meta_sync_logs;
DELETE FROM public.google_insights;
DELETE FROM public.google_ads;
DELETE FROM public.google_ad_groups;
DELETE FROM public.google_campaigns;
DELETE FROM public.google_sync_logs;

-- Agora deletar profiles
DELETE FROM public.profiles;