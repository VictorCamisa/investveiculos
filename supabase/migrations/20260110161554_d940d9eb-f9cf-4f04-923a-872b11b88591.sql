-- Add is_default column to whatsapp_instances table
ALTER TABLE public.whatsapp_instances 
ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- Add is_shared column if not exists (for team sharing feature)
ALTER TABLE public.whatsapp_instances 
ADD COLUMN IF NOT EXISTS is_shared boolean DEFAULT false;

-- Add user_id to link instance to a user
ALTER TABLE public.whatsapp_instances 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user_id ON public.whatsapp_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_is_default ON public.whatsapp_instances(is_default);