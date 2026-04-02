-- Round Robin Settings table (global config)
CREATE TABLE IF NOT EXISTS public.round_robin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_globally_active boolean DEFAULT true,
  distribution_method text DEFAULT 'sequential',
  response_time_limit_minutes integer DEFAULT 30,
  auto_reassign_enabled boolean DEFAULT true,
  penalty_enabled boolean DEFAULT false,
  penalty_type text DEFAULT 'skip_turn',
  penalty_duration_hours integer DEFAULT 24,
  penalty_threshold integer DEFAULT 3,
  working_hours_enabled boolean DEFAULT false,
  working_hours_start text DEFAULT '08:00',
  working_hours_end text DEFAULT '18:00',
  working_days integer[] DEFAULT ARRAY[1,2,3,4,5],
  max_leads_per_cycle integer DEFAULT NULL,
  notify_salesperson_on_assign boolean DEFAULT true,
  notify_manager_on_reassign boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.round_robin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage round_robin_settings"
ON public.round_robin_settings FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Round Robin Penalties table
CREATE TABLE IF NOT EXISTS public.round_robin_penalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid DEFAULT NULL,
  reason text DEFAULT NULL,
  penalty_type text DEFAULT 'skip_turn',
  applied_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT NULL,
  is_active boolean DEFAULT true
);

ALTER TABLE public.round_robin_penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage round_robin_penalties"
ON public.round_robin_penalties FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Add weight and penalty columns to round_robin_config if not exist
ALTER TABLE public.round_robin_config ADD COLUMN IF NOT EXISTS weight integer DEFAULT 1;
ALTER TABLE public.round_robin_config ADD COLUMN IF NOT EXISTS response_time_override_minutes integer DEFAULT NULL;
ALTER TABLE public.round_robin_config ADD COLUMN IF NOT EXISTS is_penalized boolean DEFAULT false;

-- Insert default settings
INSERT INTO public.round_robin_settings (is_globally_active) VALUES (true)
ON CONFLICT DO NOTHING;