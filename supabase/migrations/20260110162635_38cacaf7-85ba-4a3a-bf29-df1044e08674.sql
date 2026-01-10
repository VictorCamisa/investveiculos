-- Ensure RLS is enabled
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Revoke and re-grant permissions to ensure they are applied
REVOKE ALL ON public.whatsapp_instances FROM authenticated;
REVOKE ALL ON public.whatsapp_instances FROM anon;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_instances TO authenticated;

-- Grant read-only permissions to anon
GRANT SELECT ON public.whatsapp_instances TO anon;

-- Also grant permissions to notifications table if missing
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications TO anon;