-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create lead_qualifications table for storing qualification data
CREATE TABLE public.lead_qualifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  negotiation_id UUID REFERENCES public.negotiations(id) ON DELETE CASCADE,
  qualified_by UUID REFERENCES public.profiles(id),
  score INTEGER NOT NULL DEFAULT 0,
  vehicle_interest TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  down_payment NUMERIC,
  max_installment NUMERIC,
  payment_method TEXT,
  has_trade_in BOOLEAN DEFAULT false,
  trade_in_vehicle TEXT,
  trade_in_value NUMERIC,
  purchase_timeline TEXT,
  decision_maker BOOLEAN DEFAULT true,
  notes TEXT,
  engagement_score INTEGER DEFAULT 0,
  intent_score INTEGER DEFAULT 0,
  completeness_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_qualifications ENABLE ROW LEVEL SECURITY;

-- Create policies for lead_qualifications
CREATE POLICY "Authenticated users can view lead_qualifications"
ON public.lead_qualifications
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert lead_qualifications"
ON public.lead_qualifications
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update lead_qualifications"
ON public.lead_qualifications
FOR UPDATE
TO authenticated
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_lead_qualifications_lead_id ON public.lead_qualifications(lead_id);
CREATE INDEX idx_lead_qualifications_negotiation_id ON public.lead_qualifications(negotiation_id);
CREATE INDEX idx_lead_qualifications_score ON public.lead_qualifications(score);

-- Add trigger for updated_at
CREATE TRIGGER update_lead_qualifications_updated_at
BEFORE UPDATE ON public.lead_qualifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();