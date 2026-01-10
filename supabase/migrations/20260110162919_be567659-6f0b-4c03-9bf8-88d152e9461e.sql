-- Drop existing SELECT policy and recreate a simpler one
DROP POLICY IF EXISTS "Users can view own or shared instances" ON public.whatsapp_instances;

-- Allow authenticated users to view all instances (managers need to see all)
CREATE POLICY "Authenticated can view all instances"
ON public.whatsapp_instances
FOR SELECT
TO authenticated
USING (true);

-- Also ensure anon can read (for public status checks)
DROP POLICY IF EXISTS "Anon can view shared instances" ON public.whatsapp_instances;
CREATE POLICY "Anon can view shared instances"
ON public.whatsapp_instances
FOR SELECT
TO anon
USING (is_shared = true);