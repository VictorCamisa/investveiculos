-- Add foreign key from negotiations.salesperson_id to profiles.id
ALTER TABLE public.negotiations 
ADD CONSTRAINT negotiations_salesperson_id_fkey 
FOREIGN KEY (salesperson_id) REFERENCES public.profiles(id);

-- Add foreign key from negotiations.lead_id to leads.id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'negotiations_lead_id_fkey'
  ) THEN
    ALTER TABLE public.negotiations 
    ADD CONSTRAINT negotiations_lead_id_fkey 
    FOREIGN KEY (lead_id) REFERENCES public.leads(id);
  END IF;
END $$;

-- Add foreign key from negotiations.vehicle_id to vehicles.id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'negotiations_vehicle_id_fkey'
  ) THEN
    ALTER TABLE public.negotiations 
    ADD CONSTRAINT negotiations_vehicle_id_fkey 
    FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);
  END IF;
END $$;

-- Add foreign key from negotiations.customer_id to customers.id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'negotiations_customer_id_fkey'
  ) THEN
    ALTER TABLE public.negotiations 
    ADD CONSTRAINT negotiations_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES public.customers(id);
  END IF;
END $$;