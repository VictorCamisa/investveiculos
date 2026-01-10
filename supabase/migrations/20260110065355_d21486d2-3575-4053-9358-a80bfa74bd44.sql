-- Add RLS policy to allow edge functions (service_role) to insert vehicles
CREATE POLICY "Service role can insert vehicles" 
ON public.vehicles 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Add RLS policy to allow edge functions (service_role) to update vehicles
CREATE POLICY "Service role can update vehicles" 
ON public.vehicles 
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);

-- Add RLS policy to allow edge functions (service_role) to select vehicles
CREATE POLICY "Service role can select vehicles" 
ON public.vehicles 
FOR SELECT 
TO service_role
USING (true);