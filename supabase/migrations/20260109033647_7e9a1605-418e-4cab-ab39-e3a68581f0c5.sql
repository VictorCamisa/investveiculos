-- Create table for multiple payment methods per sale
CREATE TABLE public.sale_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  payment_method public.payment_method NOT NULL,
  amount NUMERIC NOT NULL,
  details TEXT,
  -- Financing specific fields
  financing_bank TEXT,
  financing_entry_value NUMERIC,
  financing_financed_value NUMERIC,
  financing_installments INTEGER,
  financing_installment_value NUMERIC,
  financing_interest_rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sale_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view payment methods"
ON public.sale_payment_methods
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert payment methods"
ON public.sale_payment_methods
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update payment methods"
ON public.sale_payment_methods
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete payment methods"
ON public.sale_payment_methods
FOR DELETE
TO authenticated
USING (true);

-- Create index for faster queries
CREATE INDEX idx_sale_payment_methods_sale_id ON public.sale_payment_methods(sale_id);