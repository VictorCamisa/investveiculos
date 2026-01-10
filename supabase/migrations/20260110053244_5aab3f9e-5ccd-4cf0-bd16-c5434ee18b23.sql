-- Grant permissions to authenticated users for profiles table
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Grant permissions to authenticated users for user_roles table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- Grant permissions to authenticated users for user_permissions table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;

-- Grant permissions to authenticated users for activity_logs table
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;

-- Also grant to anon for public access if needed (read-only)
GRANT SELECT ON public.profiles TO anon;