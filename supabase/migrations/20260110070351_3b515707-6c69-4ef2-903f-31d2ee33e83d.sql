-- Grant all privileges on vehicle_images table
GRANT ALL ON public.vehicle_images TO service_role;
GRANT ALL ON public.vehicle_images TO authenticated;

-- Add RLS policies for vehicle_images
CREATE POLICY "Authenticated users can view vehicle images"
ON public.vehicle_images
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert vehicle images"
ON public.vehicle_images
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicle images"
ON public.vehicle_images
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vehicle images"
ON public.vehicle_images
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Service role can manage vehicle images"
ON public.vehicle_images
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);