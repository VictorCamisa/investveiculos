-- First drop all existing policies on lead_qualifications
DROP POLICY IF EXISTS "Authenticated users can view lead_qualifications" ON public.lead_qualifications;
DROP POLICY IF EXISTS "Authenticated users can insert lead_qualifications" ON public.lead_qualifications;
DROP POLICY IF EXISTS "Authenticated users can update lead_qualifications" ON public.lead_qualifications;
DROP POLICY IF EXISTS "Authenticated users can delete lead_qualifications" ON public.lead_qualifications;
DROP POLICY IF EXISTS "Service role full access on lead_qualifications" ON public.lead_qualifications;

-- Disable and re-enable RLS
ALTER TABLE public.lead_qualifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_qualifications ENABLE ROW LEVEL SECURITY;

-- Create simple permissive policy for all authenticated users
CREATE POLICY "Enable all for authenticated"
ON public.lead_qualifications
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy for anon (service role uses this in edge functions)
CREATE POLICY "Enable all for anon"
ON public.lead_qualifications
FOR ALL
TO anon
USING (true)
WITH CHECK (true);