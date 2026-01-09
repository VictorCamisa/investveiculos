-- Create table for vehicle interest alerts (customers waiting for similar vehicles)
CREATE TABLE public.vehicle_interest_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  negotiation_id UUID REFERENCES public.negotiations(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  -- Vehicle criteria
  vehicle_brand TEXT,
  vehicle_model TEXT,
  year_min INTEGER,
  year_max INTEGER,
  price_min NUMERIC,
  price_max NUMERIC,
  notes TEXT,
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'notified', 'expired', 'converted')),
  notified_at TIMESTAMP WITH TIME ZONE,
  notified_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  -- Audit
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_interest_alerts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view alerts" 
ON public.vehicle_interest_alerts 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create alerts" 
ON public.vehicle_interest_alerts 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update alerts" 
ON public.vehicle_interest_alerts 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete alerts" 
ON public.vehicle_interest_alerts 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_vehicle_interest_alerts_updated_at
BEFORE UPDATE ON public.vehicle_interest_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_vehicle_interest_alerts_status ON public.vehicle_interest_alerts(status);
CREATE INDEX idx_vehicle_interest_alerts_brand_model ON public.vehicle_interest_alerts(vehicle_brand, vehicle_model);