-- Sync image_url with url for images already migrated to Supabase Storage
UPDATE vehicle_images 
SET image_url = url 
WHERE url LIKE '%supabase%' AND (image_url NOT LIKE '%supabase%' OR image_url IS NULL);