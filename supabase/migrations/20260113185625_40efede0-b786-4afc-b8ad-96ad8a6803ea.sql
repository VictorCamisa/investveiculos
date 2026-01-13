-- Create storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-images',
  'vehicle-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Allow public read access to vehicle images
CREATE POLICY "Public can view vehicle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

-- Allow authenticated users to upload vehicle images
CREATE POLICY "Authenticated users can upload vehicle images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vehicle-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update vehicle images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vehicle-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete vehicle images
CREATE POLICY "Authenticated users can delete vehicle images"
ON storage.objects FOR DELETE
USING (bucket_id = 'vehicle-images' AND auth.role() = 'authenticated');