import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  LeadQualification, 
  QualificationFormData, 
  ScoreBreakdown, 
  ScoreClassification,
  INTENT_KEYWORDS 
} from '@/types/qualification';

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

// Calculate engagement score based on messages
export function calculateEngagementScore(messages: WhatsAppMessage[]): number {
  const leadMessages = messages.filter(m => m.direction === 'incoming');
  const messageCount = leadMessages.length;
  
  let score = 0;
  
  // Score based on message count
  if (messageCount >= 10) {
    score = 35;
  } else if (messageCount >= 6) {
    score = 25;
  } else if (messageCount >= 3) {
    score = 15;
  } else if (messageCount >= 1) {
    score = 5;
  }
  
  // Bonus for quick responses (check if lead responded within 5 minutes)
  if (messages.length >= 2) {
    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );
    
    for (let i = 1; i < sortedMessages.length; i++) {
      const prev = sortedMessages[i - 1];
      const curr = sortedMessages[i];
      
      if (prev.direction === 'outgoing' && curr.direction === 'incoming') {
        const prevTime = new Date(prev.created_at || 0).getTime();
        const currTime = new Date(curr.created_at || 0).getTime();
        const diffMinutes = (currTime - prevTime) / (1000 * 60);
        
        if (diffMinutes <= 5) {
          score = Math.min(40, score + 5);
          break;
        }
      }
    }
  }
  
  return Math.min(40, score);
}

// Calculate intent score based on keywords in messages
export function calculateIntentScore(messages: WhatsAppMessage[]): number {
  const allContent = messages
    .filter(m => m.direction === 'incoming' && m.content)
    .map(m => m.content!.toLowerCase())
    .join(' ');
  
  let score = 0;
  
  // High intent keywords (+10 each, max 2)
  const highIntentKeywords: string[] = [
    'quero comprar', 'vou comprar', 'fechar negócio', 'fechar negocio',
    'posso ir ver', 'agendar visita', 'posso visitar', 'vou aí',
    'preciso logo', 'urgente', 'hoje', 'amanhã', 'amanha'
  ];
  
  let highMatches = 0;
  for (const keyword of highIntentKeywords) {
    if (allContent.includes(keyword)) {
      highMatches++;
      if (highMatches >= 2) break;
    }
  }
  score += highMatches * 10;
  
  // Medium intent keywords (+5 each, max 2)
  const mediumIntentKeywords: string[] = [
    'tenho entrada', 'valor de entrada', 'quanto de entrada',
    'financiamento', 'parcela', 'consigo financiar',
    'trocar meu carro', 'tenho um pra trocar', 'aceita troca'
  ];
  
  let mediumMatches = 0;
  for (const keyword of mediumIntentKeywords) {
    if (allContent.includes(keyword)) {
      mediumMatches++;
      if (mediumMatches >= 2) break;
    }
  }
  score += mediumMatches * 5;
  
  return Math.min(30, score);
}

// Calculate completeness score based on form data
export function calculateCompletenessScore(formData: QualificationFormData): number {
  let score = 0;
  
  // Vehicle interest (+5)
  if (formData.vehicle_interest && formData.vehicle_interest.trim().length > 0) {
    score += 5;
  }
  
  // Budget (+5)
  if (formData.budget_min || formData.budget_max) {
    score += 5;
  }
  
  // Down payment (+5)
  if (formData.down_payment && formData.down_payment > 0) {
    score += 5;
  }
  
  // Payment method (+5)
  if (formData.payment_method && formData.payment_method.trim().length > 0) {
    score += 5;
  }
  
  // Purchase timeline (+5)
  if (formData.purchase_timeline && formData.purchase_timeline.trim().length > 0) {
    score += 5;
  }
  
  // Decision maker (+5)
  if (formData.decision_maker) {
    score += 5;
  }
  
  return Math.min(30, score);
}

// Get score classification
export function getScoreClassification(score: number): ScoreClassification {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
}

// Get classification label
export function getClassificationLabel(classification: ScoreClassification): string {
  switch (classification) {
    case 'hot': return 'Quente 🔥';
    case 'warm': return 'Morno 🌡️';
    case 'cold': return 'Frio ❄️';
  }
}

// Get classification color
export function getClassificationColor(classification: ScoreClassification): string {
  switch (classification) {
    case 'hot': return 'text-green-500';
    case 'warm': return 'text-yellow-500';
    case 'cold': return 'text-blue-500';
  }
}

// Get classification background
export function getClassificationBackground(classification: ScoreClassification): string {
  switch (classification) {
    case 'hot': return 'bg-green-500/10 border-green-500/30';
    case 'warm': return 'bg-yellow-500/10 border-yellow-500/30';
    case 'cold': return 'bg-blue-500/10 border-blue-500/30';
  }
}

// Hook to calculate total score
export function useScoreCalculation(
  messages: WhatsAppMessage[],
  formData: QualificationFormData
): ScoreBreakdown {
  return useMemo(() => {
    const engagement = calculateEngagementScore(messages);
    const intent = calculateIntentScore(messages);
    const completeness = calculateCompletenessScore(formData);
    
    return {
      engagement,
      intent,
      completeness,
      total: engagement + intent + completeness,
    };
  }, [messages, formData]);
}
