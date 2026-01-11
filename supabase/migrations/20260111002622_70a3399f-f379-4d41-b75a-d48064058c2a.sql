-- Fix RLS policies for lead_qualifications table

-- First ensure RLS is enabled
ALTER TABLE public.lead_qualifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can view lead_qualifications" ON public.lead_qualifications;
DROP POLICY IF EXISTS "Authenticated users can insert lead_qualifications" ON public.lead_qualifications;
DROP POLICY IF EXISTS "Authenticated users can update lead_qualifications" ON public.lead_qualifications;
DROP POLICY IF EXISTS "Authenticated users can delete lead_qualifications" ON public.lead_qualifications;

-- Create new policies for authenticated users
CREATE POLICY "Authenticated users can view lead_qualifications" 
ON public.lead_qualifications 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert lead_qualifications" 
ON public.lead_qualifications 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update lead_qualifications" 
ON public.lead_qualifications 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete lead_qualifications" 
ON public.lead_qualifications 
FOR DELETE 
USING (auth.role() = 'authenticated');