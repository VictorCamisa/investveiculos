-- Grant all privileges on vehicles table to service_role
GRANT ALL ON public.vehicles TO service_role;

-- Also grant to authenticated for good measure
GRANT ALL ON public.vehicles TO authenticated;

-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;