-- Drop the existing INSERT policy and recreate with correct check
DROP POLICY IF EXISTS "Authenticated users can create instances" ON public.whatsapp_instances;

-- Allow authenticated users to create instances where they set themselves as created_by
CREATE POLICY "Authenticated users can create instances"
ON public.whatsapp_instances
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid() OR created_by IS NULL);