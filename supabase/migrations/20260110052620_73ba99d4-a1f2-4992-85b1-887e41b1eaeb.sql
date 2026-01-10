-- Recria a função check_user_role com cast explícito para app_role
CREATE OR REPLACE FUNCTION public.check_user_role(check_user_id uuid, check_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = check_user_id AND role = check_role::app_role
  );
END;
$function$;