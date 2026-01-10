-- Add vehicle_usage column to lead_qualifications
ALTER TABLE lead_qualifications 
ADD COLUMN IF NOT EXISTS vehicle_usage TEXT;