
ALTER TABLE public.user_permissions DROP CONSTRAINT IF EXISTS user_permissions_granted_by_fkey;
ALTER TABLE public.user_permissions ADD CONSTRAINT user_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_created_by_fkey;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.vehicle_costs DROP CONSTRAINT IF EXISTS vehicle_costs_created_by_fkey;
ALTER TABLE public.vehicle_costs ADD CONSTRAINT vehicle_costs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
