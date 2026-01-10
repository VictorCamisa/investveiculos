import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  LeadQualification, 
  QualificationFormData, 
  ScoreBreakdown, 
  ScoreClassification 
} from '@/types/qualification';
import { PURCHASE_TIMELINES, ENGAGEMENT_KEYWORDS } from '@/types/qualification';

interface WhatsAppMessage {
  id: string;
  content: string | null;
  direction: string | null;
  created_at: string | null;
}

// Fetch qualification by negotiation ID
export function useLeadQualificationByNegotiation(negotiationId: string | null) {
  return useQuery({
    queryKey: ['lead-qualification', negotiationId],
    queryFn: async () => {
      if (!negotiationId) return null;
      
      const { data, error } = await supabase
        .from('lead_qualifications')
        .select('*')
        .eq('negotiation_id', negotiationId)
        .maybeSingle();
      
      if (error) throw error;
      return data as LeadQualification | null;
    },
    enabled: !!negotiationId,
  });
}

// Create qualification
export function useCreateQualification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<LeadQualification>) => {
      const { data: result, error } = await supabase
        .from('lead_qualifications')
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-qualification'] });
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
    },
    onError: (error) => {
      console.error('Error creating qualification:', error);
      toast.error('Erro ao salvar qualificação');
    },
  });
}

/**
 * Calculate Data Score (max 50 points)
 * Based on form completeness and specific field values
 */
export function calculateDataScore(formData: QualificationFormData): number {
  let score = 0;
  
  // Purchase timeline (up to 20 pts)
  if (formData.purchase_timeline) {
    const timeline = PURCHASE_TIMELINES.find(t => t.value === formData.purchase_timeline);
    if (timeline) {
      score += timeline.points;
    }
  }
  
  // Has trade-in vehicle (+10 pts)
  if (formData.has_trade_in) {
    score += 10;
  }
  
  // Down payment informed (+5 pts)
  if (formData.down_payment && formData.down_payment > 0) {
    score += 5;
  }
  
  // Max installment informed (+5 pts)
  if (formData.max_installment && formData.max_installment > 0) {
    score += 5;
  }
  
  // Payment method defined (+5 pts)
  if (formData.payment_method && formData.payment_method.trim().length > 0) {
    score += 5;
  }
  
  // Budget informed (+5 pts)
  if (formData.budget_min || formData.budget_max) {
    score += 5;
  }
  
  return Math.min(50, score);
}

/**
 * Calculate Engagement Score (max 50 points)
 * Based on lead interactions via WhatsApp
 */
export function calculateEngagementScore(messages: WhatsAppMessage[]): number {
  let score = 0;
  
  const leadMessages = messages.filter(m => m.direction === 'incoming');
  const storeMessages = messages.filter(m => m.direction === 'outgoing');
  
  // Lead initiated conversation (first message is incoming) - +10 pts
  if (messages.length > 0 && messages[0]?.direction === 'incoming') {
    score += 10;
  }
  
  // Responded to 3+ questions (incoming after outgoing) - +15 pts
  let responseCount = 0;
  for (let i = 1; i < messages.length; i++) {
    if (messages[i-1]?.direction === 'outgoing' && messages[i]?.direction === 'incoming') {
      responseCount++;
    }
  }
  if (responseCount >= 3) {
    score += 15;
  }
  
  // Clicked on link sent - +15 pts
  const allLeadContent = leadMessages
    .map(m => m.content?.toLowerCase() || '')
    .join(' ');
  
  if (ENGAGEMENT_KEYWORDS.clickedLink.some(kw => allLeadContent.includes(kw))) {
    score += 15;
  }
  
  // Requested contact with salesperson - +10 pts
  if (ENGAGEMENT_KEYWORDS.requestedContact.some(kw => allLeadContent.includes(kw))) {
    score += 10;
  }
  
  return Math.min(50, score);
}

/**
 * Get score classification based on new thresholds
 * < 40 = cold, 40-69 = warm, >= 70 = hot
 */
export function getScoreClassification(score: number): ScoreClassification {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

/**
 * Get classification label with emoji
 */
export function getClassificationLabel(classification: ScoreClassification): string {
  switch (classification) {
    case 'hot': return 'Quente 🔥';
    case 'warm': return 'Morno 🌡️';
    case 'cold': return 'Frio ❄️';
  }
}

/**
 * Get contextual message for each classification
 */
export function getClassificationMessage(classification: ScoreClassification): string {
  switch (classification) {
    case 'hot': 
      return 'Lead Quente! Altamente qualificado. Atribua a um vendedor imediatamente.';
    case 'warm': 
      return 'Lead Morno. Bom potencial. Avalie antes de atribuir.';
    case 'cold': 
      return 'Lead Frio. Recomenda-se mais qualificação antes de atribuir a um vendedor.';
  }
}

/**
 * Get classification color class
 */
export function getClassificationColor(classification: ScoreClassification): string {
  switch (classification) {
    case 'hot': return 'text-green-500';
    case 'warm': return 'text-yellow-500';
    case 'cold': return 'text-blue-500';
  }
}

/**
 * Get classification background class
 */
export function getClassificationBackground(classification: ScoreClassification): string {
  switch (classification) {
    case 'hot': return 'bg-green-500/10 border-green-500/30';
    case 'warm': return 'bg-yellow-500/10 border-yellow-500/30';
    case 'cold': return 'bg-blue-500/10 border-blue-500/30';
  }
}

/**
 * Hook to calculate total score with new 50/50 split
 */
export function useScoreCalculation(
  messages: WhatsAppMessage[],
  formData: QualificationFormData
): ScoreBreakdown {
  return useMemo(() => {
    const data = calculateDataScore(formData);
    const engagement = calculateEngagementScore(messages);
    
    return {
      data,
      engagement,
      total: data + engagement,
    };
  }, [messages, formData]);
}
