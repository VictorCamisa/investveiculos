-- Fix the specific lead that failed to qualify due to permissions issue
-- Lead ID: 9f33c533-b8bd-495b-82e6-e31d554d13fb
-- Negotiation ID: dc419324-dad7-4e04-a832-584708d57719
-- Salesperson: José Augusto (efd3b0ca-522e-4ff1-a8b6-2b0e26634d8d)

-- 1. Update lead to assign salesperson
UPDATE public.leads 
SET 
  assigned_to = 'efd3b0ca-522e-4ff1-a8b6-2b0e26634d8d',
  updated_at = now()
WHERE id = '9f33c533-b8bd-495b-82e6-e31d554d13fb';

-- 2. Update negotiation status to "negociando" (Qualificado)
UPDATE public.negotiations 
SET 
  status = 'negociando',
  salesperson_id = 'efd3b0ca-522e-4ff1-a8b6-2b0e26634d8d',
  notes = 'Qualificado automaticamente pela IA (Score: 62). Vendedor atribuído: José Augusto',
  updated_at = now()
WHERE id = 'dc419324-dad7-4e04-a832-584708d57719';

-- 3. Create lead assignment record
INSERT INTO public.lead_assignments (lead_id, user_id, assigned_at)
VALUES ('9f33c533-b8bd-495b-82e6-e31d554d13fb', 'efd3b0ca-522e-4ff1-a8b6-2b0e26634d8d', now())
ON CONFLICT DO NOTHING;

-- 4. Create lead qualification record (that was missing)
INSERT INTO public.lead_qualifications (
  lead_id, 
  negotiation_id, 
  qualified_by, 
  score, 
  engagement_score, 
  completeness_score, 
  notes
)
VALUES (
  '9f33c533-b8bd-495b-82e6-e31d554d13fb',
  'dc419324-dad7-4e04-a832-584708d57719',
  null, -- Qualified by AI
  62,
  50, -- engagement score
  62, -- completeness score
  'Qualificação preenchida manualmente após correção de permissões'
);

-- 5. Increment round robin counters for the salesperson
UPDATE public.round_robin_config
SET 
  current_count = current_count + 1,
  last_assigned_at = now()
WHERE user_id = 'efd3b0ca-522e-4ff1-a8b6-2b0e26634d8d';

-- 6. Create notification for the salesperson
INSERT INTO public.notifications (user_id, type, title, message, link)
VALUES (
  'efd3b0ca-522e-4ff1-a8b6-2b0e26634d8d',
  'new_qualified_lead',
  '🎯 Novo Lead Qualificado!',
  'Cliente Interessado (5512982035619) foi qualificado pela IA. Score: 62 pontos.',
  '/crm'
);