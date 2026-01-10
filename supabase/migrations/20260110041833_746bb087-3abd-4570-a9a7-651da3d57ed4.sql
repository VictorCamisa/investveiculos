-- Create a security definer function to check if user has a specific role
-- This function bypasses RLS and can be called from edge functions
CREATE OR REPLACE FUNCTION public.check_user_role(check_user_id uuid, check_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = check_user_id AND role = check_role
  );
END;
$$;

-- Grant execute permission to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.check_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_role(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_user_role(uuid, text) TO anon;