-- Create table for qualification tier configuration
CREATE TABLE public.qualification_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_tier text NOT NULL DEFAULT 'Q2' CHECK (target_tier IN ('Q1', 'Q2', 'Q3')),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.qualification_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view qualification config"
ON public.qualification_config FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can update qualification config"
ON public.qualification_config FOR UPDATE
USING (is_master_user(auth.uid()) OR has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Managers can insert qualification config"
ON public.qualification_config FOR INSERT
WITH CHECK (is_master_user(auth.uid()) OR has_role(auth.uid(), 'gerente'::app_role));

-- Insert default configuration
INSERT INTO public.qualification_config (target_tier) VALUES ('Q2');

-- Add qualification_tier column to lead_qualifications table
ALTER TABLE public.lead_qualifications 
ADD COLUMN IF NOT EXISTS qualification_tier text CHECK (qualification_tier IN ('Q1', 'Q2', 'Q3'));