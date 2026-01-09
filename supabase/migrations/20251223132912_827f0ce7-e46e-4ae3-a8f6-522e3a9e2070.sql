-- Add mercadolibre_id column to vehicles table for ML integration
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS mercadolibre_id text UNIQUE;

-- Add images column to store array of image URLs
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS images text[];

-- Create index for mercadolibre_id lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_mercadolibre_id ON public.vehicles(mercadolibre_id);

-- Add comment for documentation
COMMENT ON COLUMN public.vehicles.mercadolibre_id IS 'Mercado Livre item ID (e.g., MLB5144697414)';
COMMENT ON COLUMN public.vehicles.images IS 'Array of image URLs from Supabase Storage';