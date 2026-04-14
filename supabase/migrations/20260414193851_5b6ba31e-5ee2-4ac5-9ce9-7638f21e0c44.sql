ALTER TABLE public.salesperson_goals DROP CONSTRAINT IF EXISTS salesperson_goals_user_id_fkey;
ALTER TABLE public.salesperson_goals ADD CONSTRAINT salesperson_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.whatsapp_instances DROP CONSTRAINT IF EXISTS whatsapp_instances_created_by_fkey;
ALTER TABLE public.whatsapp_instances ADD CONSTRAINT whatsapp_instances_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.whatsapp_instances DROP CONSTRAINT IF EXISTS whatsapp_instances_user_id_fkey;
ALTER TABLE public.whatsapp_instances ADD CONSTRAINT whatsapp_instances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.scheduled_reports DROP CONSTRAINT IF EXISTS scheduled_reports_created_by_fkey;
ALTER TABLE public.scheduled_reports ADD CONSTRAINT scheduled_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.utm_links DROP CONSTRAINT IF EXISTS utm_links_created_by_fkey;
ALTER TABLE public.utm_links ADD CONSTRAINT utm_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;