
-- Contracts table
CREATE TABLE public.contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number text NOT NULL DEFAULT '',
  contract_type text NOT NULL DEFAULT 'venda',
  status text NOT NULL DEFAULT 'draft',
  customer_id uuid REFERENCES public.customers(id),
  customer_name text NOT NULL DEFAULT '',
  customer_nationality text,
  customer_profession text,
  customer_marital_status text,
  customer_rg text,
  customer_cpf text,
  customer_birth_date text,
  customer_address text,
  customer_city text,
  customer_state text,
  customer_zip text,
  customer_phone text,
  customer_email text,
  vehicle_id uuid REFERENCES public.vehicles(id),
  vehicle_brand text NOT NULL DEFAULT '',
  vehicle_model text NOT NULL DEFAULT '',
  vehicle_year text NOT NULL DEFAULT '',
  vehicle_plate text,
  vehicle_color text,
  vehicle_renavam text,
  vehicle_odometer integer,
  vehicle_value numeric NOT NULL DEFAULT 0,
  trade_in_brand text,
  trade_in_model text,
  trade_in_year text,
  trade_in_plate text,
  trade_in_color text,
  trade_in_renavam text,
  trade_in_value numeric,
  down_payment numeric,
  installments_count integer,
  installment_value numeric,
  installment_due_day integer,
  notes text,
  signed_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Auto-generate contract number
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM '[0-9]+$') AS integer)), 0) + 1
  INTO next_num
  FROM public.contracts;
  
  NEW.contract_number := 'INV-' || LPAD(next_num::text, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_contract_number
  BEFORE INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_contract_number();

-- RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage contracts"
  ON public.contracts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Broadcast logs table
CREATE TABLE public.broadcast_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name text,
  message_template text NOT NULL DEFAULT '',
  total_leads integer NOT NULL DEFAULT 0,
  success_count integer NOT NULL DEFAULT 0,
  fail_count integer NOT NULL DEFAULT 0,
  instance_id uuid REFERENCES public.whatsapp_instances(id),
  created_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.broadcast_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage broadcast_logs"
  ON public.broadcast_logs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Broadcast log details
CREATE TABLE public.broadcast_log_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broadcast_log_id uuid REFERENCES public.broadcast_logs(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id),
  lead_name text,
  phone text,
  success boolean DEFAULT false,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.broadcast_log_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage broadcast_log_details"
  ON public.broadcast_log_details FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
