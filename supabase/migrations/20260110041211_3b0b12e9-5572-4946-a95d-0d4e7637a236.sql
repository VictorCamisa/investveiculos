-- RLS para tabelas sem políticas (precisam de autenticação)

-- Activity Logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can view logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can insert logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Channel Costs
ALTER TABLE public.channel_costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access channel costs" ON public.channel_costs;
CREATE POLICY "Authenticated access channel costs" ON public.channel_costs
  FOR ALL TO authenticated USING (true);

-- Commission Rules
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access commission rules" ON public.commission_rules;
CREATE POLICY "Authenticated access commission rules" ON public.commission_rules
  FOR ALL TO authenticated USING (true);

-- Sale Commissions
ALTER TABLE public.sale_commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access sale commissions" ON public.sale_commissions;
CREATE POLICY "Authenticated access sale commissions" ON public.sale_commissions
  FOR ALL TO authenticated USING (true);

-- Financial Categories
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access categories" ON public.financial_categories;
CREATE POLICY "Authenticated access categories" ON public.financial_categories
  FOR ALL TO authenticated USING (true);

-- Financial Transactions
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access transactions" ON public.financial_transactions;
CREATE POLICY "Authenticated access transactions" ON public.financial_transactions
  FOR ALL TO authenticated USING (true);

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see own notifications" ON public.notifications;
CREATE POLICY "Users can see own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Marketing Campaigns
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access campaigns" ON public.marketing_campaigns;
CREATE POLICY "Authenticated access campaigns" ON public.marketing_campaigns
  FOR ALL TO authenticated USING (true);

-- Meta tables
ALTER TABLE public.meta_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access meta campaigns" ON public.meta_campaigns;
CREATE POLICY "Authenticated access meta campaigns" ON public.meta_campaigns
  FOR ALL TO authenticated USING (true);

ALTER TABLE public.meta_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access meta insights" ON public.meta_insights;
CREATE POLICY "Authenticated access meta insights" ON public.meta_insights
  FOR ALL TO authenticated USING (true);

-- WhatsApp tables
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access whatsapp instances" ON public.whatsapp_instances;
CREATE POLICY "Authenticated access whatsapp instances" ON public.whatsapp_instances
  FOR ALL TO authenticated USING (true);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access whatsapp contacts" ON public.whatsapp_contacts;
CREATE POLICY "Authenticated access whatsapp contacts" ON public.whatsapp_contacts
  FOR ALL TO authenticated USING (true);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access whatsapp messages" ON public.whatsapp_messages;
CREATE POLICY "Authenticated access whatsapp messages" ON public.whatsapp_messages
  FOR ALL TO authenticated USING (true);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access whatsapp templates" ON public.whatsapp_templates;
CREATE POLICY "Authenticated access whatsapp templates" ON public.whatsapp_templates
  FOR ALL TO authenticated USING (true);

-- Vehicle Costs
ALTER TABLE public.vehicle_costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access vehicle costs" ON public.vehicle_costs;
CREATE POLICY "Authenticated access vehicle costs" ON public.vehicle_costs
  FOR ALL TO authenticated USING (true);

-- Vehicle Images
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access vehicle images" ON public.vehicle_images;
CREATE POLICY "Authenticated access vehicle images" ON public.vehicle_images
  FOR ALL TO authenticated USING (true);

-- Follow up flows
ALTER TABLE public.follow_up_flows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access follow up flows" ON public.follow_up_flows;
CREATE POLICY "Authenticated access follow up flows" ON public.follow_up_flows
  FOR ALL TO authenticated USING (true);

-- Lead interactions
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access lead interactions" ON public.lead_interactions;
CREATE POLICY "Authenticated access lead interactions" ON public.lead_interactions
  FOR ALL TO authenticated USING (true);

-- Salesperson Goals
ALTER TABLE public.salesperson_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access salesperson goals" ON public.salesperson_goals;
CREATE POLICY "Authenticated access salesperson goals" ON public.salesperson_goals
  FOR ALL TO authenticated USING (true);

-- Round Robin Config
ALTER TABLE public.round_robin_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated access round robin" ON public.round_robin_config;
CREATE POLICY "Authenticated access round robin" ON public.round_robin_config
  FOR ALL TO authenticated USING (true);