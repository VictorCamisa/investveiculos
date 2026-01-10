-- Update INSERT policy to allow user_id to be set
DROP POLICY IF EXISTS "Authenticated users can create instances" ON public.whatsapp_instances;
CREATE POLICY "Authenticated users can create instances" 
ON public.whatsapp_instances 
FOR INSERT 
TO authenticated
WITH CHECK (
  (user_id = auth.uid() OR user_id IS NULL) AND
  (created_by = auth.uid() OR created_by IS NULL)
);