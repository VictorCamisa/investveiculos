-- Grant permissions on leads table to authenticated and anon roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT ON public.leads TO anon;

-- Grant permissions on customers table  
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT ON public.customers TO anon;

-- Grant permissions on whatsapp_instances table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_instances TO authenticated;
GRANT SELECT ON public.whatsapp_instances TO anon;