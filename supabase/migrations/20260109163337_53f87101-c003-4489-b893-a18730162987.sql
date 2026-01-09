-- Create function to increment round robin counters
CREATE OR REPLACE FUNCTION public.increment_round_robin_counters(p_salesperson_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today DATE := CURRENT_DATE;
  last_date DATE;
BEGIN
  -- Get the last assigned date
  SELECT DATE(last_assigned_at) INTO last_date
  FROM round_robin_config
  WHERE salesperson_id = p_salesperson_id;
  
  -- If it's a new day, reset current_leads_today
  IF last_date IS NULL OR last_date < today THEN
    UPDATE round_robin_config
    SET 
      current_leads_today = 1,
      total_leads_assigned = total_leads_assigned + 1,
      last_assigned_at = NOW(),
      updated_at = NOW()
    WHERE salesperson_id = p_salesperson_id;
  ELSE
    UPDATE round_robin_config
    SET 
      current_leads_today = current_leads_today + 1,
      total_leads_assigned = total_leads_assigned + 1,
      last_assigned_at = NOW(),
      updated_at = NOW()
    WHERE salesperson_id = p_salesperson_id;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.increment_round_robin_counters(UUID) TO service_role;