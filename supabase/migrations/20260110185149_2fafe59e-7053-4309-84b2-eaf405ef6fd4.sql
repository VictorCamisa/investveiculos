-- Grant permissions on negotiations table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.negotiations TO authenticated;
GRANT SELECT ON public.negotiations TO anon;

-- Grant permissions on profiles table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Grant permissions on vehicles table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT ON public.vehicles TO anon;

-- Grant permissions on sales table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT ON public.sales TO anon;

-- Grant permissions on lead_interactions table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_interactions TO authenticated;
GRANT SELECT ON public.lead_interactions TO anon;

-- Grant permissions on vehicle_costs table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_costs TO authenticated;
GRANT SELECT ON public.vehicle_costs TO anon;

-- Grant permissions on vehicle_images table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_images TO authenticated;
GRANT SELECT ON public.vehicle_images TO anon;

-- Grant permissions on sale_commissions table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_commissions TO authenticated;
GRANT SELECT ON public.sale_commissions TO anon;

-- Grant permissions on sale_payment_methods table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_payment_methods TO authenticated;
GRANT SELECT ON public.sale_payment_methods TO anon;

-- Grant permissions on notifications table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- Grant permissions on activity_logs table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;

-- Grant permissions on user_roles table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- Grant permissions on user_permissions table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;

-- Grant permissions on financial tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_categories TO authenticated;

-- Grant permissions on marketing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_costs TO authenticated;

-- Grant permissions on follow-up tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_up_flows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_up_executions TO authenticated;

-- Grant permissions on commission tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_splits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_audit_log TO authenticated;

-- Grant permissions on round robin
GRANT SELECT, INSERT, UPDATE, DELETE ON public.round_robin_config TO authenticated;

-- Grant permissions on meta/google ads tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_adsets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_ads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_sync_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_ad_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_ads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_sync_logs TO authenticated;

-- Grant permissions on whatsapp tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;

-- Grant permissions on other tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_costs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loss_recovery_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loss_recovery_executions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salesperson_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.utm_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_interest_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_simulations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mercadolibre_tokens TO authenticated;