-- Add RLS policies for authenticated users on vehicles table
CREATE POLICY "Authenticated users can view vehicles" 
ON public.vehicles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert vehicles" 
ON public.vehicles 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles" 
ON public.vehicles 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vehicles" 
ON public.vehicles 
FOR DELETE 
TO authenticated
USING (true);