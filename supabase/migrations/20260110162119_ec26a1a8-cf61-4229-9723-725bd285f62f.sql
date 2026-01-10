-- Enable RLS on whatsapp_instances
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own instances or shared instances
CREATE POLICY "Users can view own or shared instances"
ON public.whatsapp_instances
FOR SELECT
USING (
  user_id = auth.uid() 
  OR created_by = auth.uid()
  OR is_shared = true
);

-- Policy: Authenticated users can create instances
CREATE POLICY "Authenticated users can create instances"
ON public.whatsapp_instances
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update their own instances
CREATE POLICY "Users can update own instances"
ON public.whatsapp_instances
FOR UPDATE
USING (user_id = auth.uid() OR created_by = auth.uid());

-- Policy: Users can delete their own instances
CREATE POLICY "Users can delete own instances"
ON public.whatsapp_instances
FOR DELETE
USING (user_id = auth.uid() OR created_by = auth.uid());