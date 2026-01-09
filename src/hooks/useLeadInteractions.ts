import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LeadInteraction } from '@/types/crm';
import { toast } from 'sonner';

export function useLeadInteractions(leadId: string) {
  return useQuery({
    queryKey: ['lead-interactions', leadId],
    queryFn: async (): Promise<LeadInteraction[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('lead_interactions')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as LeadInteraction[];
    },
    enabled: !!leadId,
  });
}

export function usePendingFollowUps() {
  return useQuery({
    queryKey: ['pending-follow-ups'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('lead_interactions')
        .select(`
          *,
          lead:leads(id, name, phone, assigned_to)
        `)
        .eq('follow_up_completed', false)
        .not('follow_up_date', 'is', null)
        .lte('follow_up_date', new Date().toISOString())
        .order('follow_up_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

interface CreateInteractionInput {
  lead_id: string;
  type: string;
  description: string;
  follow_up_date?: string;
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInteractionInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('lead_interactions')
        .insert({
          ...input,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead-interactions', variables.lead_id] });
      queryClient.invalidateQueries({ queryKey: ['pending-follow-ups'] });
      toast.success('Interação registrada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar: ${error.message}`);
    },
  });
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interactionId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('lead_interactions')
        .update({ follow_up_completed: true })
        .eq('id', interactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-interactions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-follow-ups'] });
      toast.success('Follow-up concluído!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}
