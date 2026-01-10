-- Add created_by column to whatsapp_instances table
ALTER TABLE public.whatsapp_instances 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

-- Add signature_template column for shared instances
ALTER TABLE public.whatsapp_instances 
ADD COLUMN IF NOT EXISTS signature_template text DEFAULT '👤 {nome} está te atendendo';