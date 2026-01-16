-- Enable real-time for lead_qualifications table
ALTER TABLE public.lead_qualifications REPLICA IDENTITY FULL;

-- Add to supabase_realtime publication (if not already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_qualifications;