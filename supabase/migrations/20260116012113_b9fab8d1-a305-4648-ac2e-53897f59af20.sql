-- Atualizar FKs para SET NULL quando usuário for excluído

-- negotiations.salesperson_id
ALTER TABLE public.negotiations 
DROP CONSTRAINT IF EXISTS negotiations_salesperson_id_fkey;

ALTER TABLE public.negotiations 
ADD CONSTRAINT negotiations_salesperson_id_fkey 
FOREIGN KEY (salesperson_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- leads.assigned_to
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS leads_assigned_to_fkey;

ALTER TABLE public.leads 
ADD CONSTRAINT leads_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- leads.created_by (se existir FK)
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS leads_created_by_fkey;

-- lead_interactions.user_id
ALTER TABLE public.lead_interactions 
DROP CONSTRAINT IF EXISTS lead_interactions_user_id_fkey;

ALTER TABLE public.lead_interactions 
ADD CONSTRAINT lead_interactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- activity_logs.user_id
ALTER TABLE public.activity_logs 
DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;

ALTER TABLE public.activity_logs 
ADD CONSTRAINT activity_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- notifications.user_id
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- lead_assignments.user_id
ALTER TABLE public.lead_assignments 
DROP CONSTRAINT IF EXISTS lead_assignments_user_id_fkey;

ALTER TABLE public.lead_assignments 
ADD CONSTRAINT lead_assignments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- round_robin_config.user_id
ALTER TABLE public.round_robin_config 
DROP CONSTRAINT IF EXISTS round_robin_config_user_id_fkey;

ALTER TABLE public.round_robin_config 
ADD CONSTRAINT round_robin_config_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- commission_splits.user_id
ALTER TABLE public.commission_splits 
DROP CONSTRAINT IF EXISTS commission_splits_user_id_fkey;

ALTER TABLE public.commission_splits 
ADD CONSTRAINT commission_splits_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- sale_commissions.user_id
ALTER TABLE public.sale_commissions 
DROP CONSTRAINT IF EXISTS sale_commissions_user_id_fkey;

ALTER TABLE public.sale_commissions 
ADD CONSTRAINT sale_commissions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- sale_commissions.approved_by
ALTER TABLE public.sale_commissions 
DROP CONSTRAINT IF EXISTS sale_commissions_approved_by_fkey;

ALTER TABLE public.sale_commissions 
ADD CONSTRAINT sale_commissions_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- sales.seller_id
ALTER TABLE public.sales 
DROP CONSTRAINT IF EXISTS sales_seller_id_fkey;

ALTER TABLE public.sales 
ADD CONSTRAINT sales_seller_id_fkey 
FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- commission_audit_log.changed_by
ALTER TABLE public.commission_audit_log 
DROP CONSTRAINT IF EXISTS commission_audit_log_changed_by_fkey;

ALTER TABLE public.commission_audit_log 
ADD CONSTRAINT commission_audit_log_changed_by_fkey 
FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ai_agents.created_by
ALTER TABLE public.ai_agents 
DROP CONSTRAINT IF EXISTS ai_agents_created_by_fkey;

ALTER TABLE public.ai_agents 
ADD CONSTRAINT ai_agents_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ai_agent_tests.executed_by
ALTER TABLE public.ai_agent_tests 
DROP CONSTRAINT IF EXISTS ai_agent_tests_executed_by_fkey;

ALTER TABLE public.ai_agent_tests 
ADD CONSTRAINT ai_agent_tests_executed_by_fkey 
FOREIGN KEY (executed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ai_agent_human_takeover.taken_over_by
ALTER TABLE public.ai_agent_human_takeover 
DROP CONSTRAINT IF EXISTS ai_agent_human_takeover_taken_over_by_fkey;

ALTER TABLE public.ai_agent_human_takeover 
ADD CONSTRAINT ai_agent_human_takeover_taken_over_by_fkey 
FOREIGN KEY (taken_over_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- lead_qualifications.qualified_by
ALTER TABLE public.lead_qualifications 
DROP CONSTRAINT IF EXISTS lead_qualifications_qualified_by_fkey;

ALTER TABLE public.lead_qualifications 
ADD CONSTRAINT lead_qualifications_qualified_by_fkey 
FOREIGN KEY (qualified_by) REFERENCES public.profiles(id) ON DELETE SET NULL;