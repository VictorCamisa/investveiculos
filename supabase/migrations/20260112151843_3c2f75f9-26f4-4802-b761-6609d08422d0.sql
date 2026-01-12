-- Ensure service_role has ALL access to lead_qualifications
-- This bypasses RLS completely for edge functions
GRANT ALL ON public.lead_qualifications TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Also ensure the edge functions can access with service key (which should bypass RLS)
-- Let's create a policy that explicitly allows service_role
DROP POLICY IF EXISTS "Service role bypass" ON public.lead_qualifications;

-- For debugging: temporarily disable RLS on lead_qualifications
-- ALTER TABLE public.lead_qualifications DISABLE ROW LEVEL SECURITY;